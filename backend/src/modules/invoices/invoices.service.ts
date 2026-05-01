import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { Invoice, LineItemJson, CreateInvoiceDto, UpdateInvoiceDto, SendInvoiceDto, InvoiceFilterDto } from './invoice.entity';

const VAT_RATE = 0.18;
const NBT_RATE = 0.02;

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    @InjectQueue('pdf') private readonly pdfQueue: Queue,
    @InjectQueue('notifications') private readonly notifQueue: Queue,
    private readonly dataSource: DataSource,
  ) {}

  // ─── HELPER: calculate line item totals ──────────────────────────────
  private calcLineItem(item: CreateInvoiceDto['lineItems'][0]): LineItemJson {
    const subtotalLkr = Math.round(item.quantity * item.rateLkr * 100) / 100;
    const vatLkr = item.vatApplicable ? Math.round(subtotalLkr * VAT_RATE * 100) / 100 : 0;
    const nbtLkr = item.nbtApplicable ? Math.round(subtotalLkr * NBT_RATE * 100) / 100 : 0;
    const totalLkr = Math.round((subtotalLkr + vatLkr + nbtLkr) * 100) / 100;
    return {
      id: uuidv4(),
      description: item.description,
      quantity: item.quantity,
      rateLkr: item.rateLkr,
      vatApplicable: item.vatApplicable,
      nbtApplicable: item.nbtApplicable,
      subtotalLkr,
      vatLkr,
      nbtLkr,
      totalLkr,
    };
  }

  // ─── HELPER: generate invoice number ─────────────────────────────────
  private async generateInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.invoiceRepo.count({ where: { userId } });
    const seq = String(count + 1).padStart(4, '0');
    return `INV-${year}-${seq}`;
  }

  // ─── CREATE ───────────────────────────────────────────────────────────
  async create(userId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    const calculatedItems = dto.lineItems.map((item) => this.calcLineItem(item));

    const subtotalLkr = calculatedItems.reduce((s, i) => s + i.subtotalLkr, 0);
    const vatLkr = calculatedItems.reduce((s, i) => s + i.vatLkr, 0);
    const nbtLkr = calculatedItems.reduce((s, i) => s + i.nbtLkr, 0);
    const totalLkr = calculatedItems.reduce((s, i) => s + i.totalLkr, 0);

    const invoiceNumber = await this.generateInvoiceNumber(userId);

    const invoice = this.invoiceRepo.create({
      userId,
      clientId: dto.clientId,
      invoiceNumber,
      language: dto.language ?? 'en',
      lineItems: calculatedItems,
      subtotalLkr,
      vatLkr,
      nbtLkr,
      totalLkr,
      paidLkr: 0,
      dueDate: dto.dueDate ?? null,
      notes: dto.notes ?? null,
      status: 'draft',
    });

    const saved = await this.invoiceRepo.save(invoice);

    // Queue async PDF generation
    await this.pdfQueue.add('generate-pdf', { invoiceId: saved.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });

    this.logger.log(`Invoice ${invoiceNumber} created for user ${userId}`);
    return saved;
  }

  // ─── LIST ─────────────────────────────────────────────────────────────
  async findAll(userId: string, filters: InvoiceFilterDto) {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.user_id = :userId', { userId })
      .orderBy('inv.issued_at', 'DESC');

    if (filters.status) qb.andWhere('inv.status = :status', { status: filters.status });
    if (filters.clientId) qb.andWhere('inv.client_id = :clientId', { clientId: filters.clientId });
    if (filters.fromDate) qb.andWhere('inv.issued_at >= :fromDate', { fromDate: filters.fromDate });
    if (filters.toDate) qb.andWhere('inv.issued_at <= :toDate', { toDate: filters.toDate });

    // Full-text search in invoice number, notes, line items
    if (filters.search) {
      qb.andWhere(
        `(inv.invoice_number ILIKE :q OR inv.notes ILIKE :q OR inv.line_items::text ILIKE :q)`,
        { q: `%${filters.search}%` }
      );
    }

    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Summary aggregates
    const summary = await this.invoiceRepo
      .createQueryBuilder('inv')
      .where('inv.user_id = :userId', { userId })
      .select('SUM(inv.total_lkr)', 'totalLkr')
      .addSelect('SUM(inv.paid_lkr)', 'paidLkr')
      .addSelect('SUM(inv.total_lkr - inv.paid_lkr)', 'outstandingLkr')
      .getRawOne();

    return {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
      summary: {
        totalLkr: Number(summary.totalLkr ?? 0),
        paidLkr: Number(summary.paidLkr ?? 0),
        outstandingLkr: Number(summary.outstandingLkr ?? 0),
      },
    };
  }

  // ─── GET ONE ──────────────────────────────────────────────────────────
  async findOne(userId: string, id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({ where: { id, userId } });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  // ─── UPDATE ───────────────────────────────────────────────────────────
  async update(userId: string, id: string, dto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.findOne(userId, id);
    Object.assign(invoice, dto);
    return this.invoiceRepo.save(invoice);
  }

  // ─── SEND ─────────────────────────────────────────────────────────────
  async send(userId: string, id: string, dto: SendInvoiceDto): Promise<{ jobIds: string[] }> {
    const invoice = await this.findOne(userId, id);

    if (!invoice.pdfUrl) {
      // Force PDF generation and wait briefly
      await this.pdfQueue.add('generate-pdf', { invoiceId: id }, { priority: 1 });
    }

    const jobIds: string[] = [];

    for (const channel of dto.channels) {
      const job = await this.notifQueue.add('send-invoice', {
        invoiceId: id,
        userId,
        channel,
        message: dto.message ?? 'auto',
      }, { attempts: 3, backoff: { type: 'exponential', delay: 3000 } });
      jobIds.push(String(job.id));
    }

    // Update status to sent
    if (invoice.status === 'draft') {
      await this.invoiceRepo.update(id, { status: 'sent', sentAt: new Date() });
    }

    return { jobIds };
  }

  // ─── RECORD PAYMENT ───────────────────────────────────────────────────
  async recordPayment(
    userId: string,
    invoiceId: string,
    paymentData: { amountLkr: number; method: string; reference?: string; notes?: string; paidAt?: string }
  ) {
    const invoice = await this.findOne(userId, invoiceId);

    if (invoice.status === 'void') {
      throw new BadRequestException('Cannot record payment on a voided invoice');
    }

    const newPaid = Number(invoice.paidLkr) + paymentData.amountLkr;
    const newStatus = newPaid >= Number(invoice.totalLkr) ? 'paid' : invoice.status;

    await this.dataSource.transaction(async (manager) => {
      await manager.query(
        `INSERT INTO payments (id, invoice_id, amount_lkr, method, reference, notes, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          uuidv4(), invoiceId, paymentData.amountLkr, paymentData.method,
          paymentData.reference ?? null, paymentData.notes ?? null,
          paymentData.paidAt ?? new Date().toISOString()
        ]
      );
      await manager.update(Invoice, invoiceId, { paidLkr: newPaid, status: newStatus as Invoice['status'] });

      // Update client lifetime value
      await manager.query(
        `UPDATE clients SET lifetime_value_lkr = lifetime_value_lkr + $1 WHERE id = $2`,
        [paymentData.amountLkr, invoice.clientId]
      );
    });

    // If fully paid, queue receipt generation
    if (newStatus === 'paid') {
      await this.pdfQueue.add('generate-receipt', { invoiceId }, { attempts: 2 });
    }

    return this.findOne(userId, invoiceId);
  }

  // ─── VOID ─────────────────────────────────────────────────────────────
  async void(userId: string, id: string): Promise<Invoice> {
    const invoice = await this.findOne(userId, id);
    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot void a paid invoice');
    }
    await this.invoiceRepo.update(id, { status: 'void' });
    return this.findOne(userId, id);
  }

  // ─── MARK OVERDUE (called by CRON) ───────────────────────────────────
  async markOverdueInvoices(): Promise<number> {
    const result = await this.invoiceRepo
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: 'overdue' })
      .where('status IN (:...statuses)', { statuses: ['sent', 'viewed'] })
      .andWhere('due_date < :now', { now: new Date().toISOString() })
      .execute();
    return result.affected ?? 0;
  }

  // ─── STORE TRANSLATION ───────────────────────────────────────────────
  async storeTranslation(id: string, language: string, translation: Record<string, unknown>): Promise<void> {
    const invoice = await this.invoiceRepo.findOne({ where: { id } });
    if (!invoice) return;
    const translations = invoice.translations ?? {};
    translations[language] = translation;
    await this.invoiceRepo.update(id, { translations });
  }
}
