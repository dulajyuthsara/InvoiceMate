import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Invoice } from '../invoices/invoice.entity';

@Processor('pdf')
@Injectable()
export class PdfProcessor {
  private readonly logger = new Logger(PdfProcessor.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly config: ConfigService,
  ) {
    this.region = config.get<string>('AWS_REGION', 'ap-southeast-1');
    this.bucket = config.get<string>('S3_BUCKET', 'invoicemate-pdfs');
    this.s3 = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: config.get<string>('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get<string>('AWS_SECRET_ACCESS_KEY', ''),
      },
    });
  }

  @Process('generate-pdf')
  async handleGeneratePdf(job: Job<{ invoiceId: string }>) {
    const { invoiceId } = job.data;
    this.logger.log(`Generating PDF for invoice ${invoiceId}`);

    try {
      const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
      if (!invoice) {
        this.logger.warn(`Invoice ${invoiceId} not found for PDF generation`);
        return;
      }

      // Generate HTML from invoice data
      const html = this.buildInvoiceHtml(invoice);

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=none',
        ],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      });

      await browser.close();

      // Upload to S3
      const key = `invoices/${invoice.userId}/${invoice.id}.pdf`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: pdfBuffer,
          ContentType: 'application/pdf',
          ContentDisposition: `attachment; filename="${invoice.invoiceNumber}.pdf"`,
          ServerSideEncryption: 'AES256',
          Metadata: {
            invoiceId: invoice.id,
            userId: invoice.userId,
            invoiceNumber: invoice.invoiceNumber,
          },
        })
      );

      const pdfUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

      await this.invoiceRepo.update(invoiceId, {
        pdfUrl,
        pdfGeneratedAt: new Date(),
      });

      this.logger.log(`PDF generated and uploaded: ${pdfUrl}`);
    } catch (err) {
      this.logger.error(`PDF generation failed for invoice ${invoiceId}:`, err);
      throw err; // BullMQ will retry
    }
  }

  @Process('generate-receipt')
  async handleGenerateReceipt(job: Job<{ invoiceId: string }>) {
    const { invoiceId } = job.data;
    this.logger.log(`Generating receipt for invoice ${invoiceId}`);
    // Same as PDF but with "RECEIPT" header and paid stamp
    await this.handleGeneratePdf(job);
  }

  private buildInvoiceHtml(invoice: Invoice): string {
    const formatLKR = (amount: number) =>
      new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);

    const lineItemsHtml = invoice.lineItems
      .map(
        (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#374151">${item.description}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;color:#6b7280">${item.quantity}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;color:#6b7280">${formatLKR(item.rateLkr)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:600;color:#111827">${formatLKR(item.totalLkr)}</td>
      </tr>`
      )
      .join('');

    const vatRow =
      Number(invoice.vatLkr) > 0
        ? `<tr><td colspan="3" style="text-align:right;padding:6px 8px;font-size:13px;color:#6b7280">VAT (18%)</td><td style="text-align:right;padding:6px 8px;font-size:13px;color:#C8A84B">${formatLKR(Number(invoice.vatLkr))}</td></tr>`
        : '';
    const nbtRow =
      Number(invoice.nbtLkr) > 0
        ? `<tr><td colspan="3" style="text-align:right;padding:6px 8px;font-size:13px;color:#6b7280">NBT (2%)</td><td style="text-align:right;padding:6px 8px;font-size:13px;color:#9B72E8">${formatLKR(Number(invoice.nbtLkr))}</td></tr>`
        : '';

    const statusColor = invoice.status === 'paid' ? '#2ECC8A' : '#E8624A';
    const statusText = invoice.status.toUpperCase();

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; color: #111827; background: #fff; }
    .header { background: linear-gradient(135deg, #0D0F14 0%, #1A1D26 100%); padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; }
    .logo { width: 48px; height: 48px; background: linear-gradient(135deg, #C8A84B, #E8C96A); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .logo-text { color: #0D0F14; font-weight: 800; font-size: 20px; }
    .invoice-title { color: #fff; font-size: 28px; font-weight: 700; }
    .invoice-meta { color: #8B90A0; font-size: 13px; margin-top: 4px; }
    .status-badge { padding: 6px 16px; border-radius: 100px; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; }
    .content { padding: 40px; }
    .bill-section { margin-bottom: 32px; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #9CA3AF; margin-bottom: 8px; }
    .client-name { font-size: 18px; font-weight: 700; color: #111827; }
    .client-detail { font-size: 13px; color: #6b7280; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { border-bottom: 2px solid #F3F4F6; }
    th { text-align: left; padding: 10px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; }
    .totals-section { margin-top: 24px; display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .grand-total { font-size: 18px; font-weight: 700; color: #C8A84B; }
    .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #F3F4F6; text-align: center; color: #D1D5DB; font-size: 11px; }
    .notes { background: #F9FAFB; border-radius: 8px; padding: 16px; margin-top: 24px; }
    .notes p { font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
        <div class="logo"><span class="logo-text">IM</span></div>
        <div>
          <div style="color:#fff;font-weight:700;font-size:16px">InvoiceMate</div>
          <div style="color:#8B90A0;font-size:11px">invoicemate.lk</div>
        </div>
      </div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-meta">${invoice.invoiceNumber}</div>
      <div class="invoice-meta">Issued: ${new Date(invoice.issuedAt).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${invoice.dueDate ? `<div class="invoice-meta">Due: ${new Date(invoice.dueDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}</div>` : ''}
    </div>
    <div>
      <span class="status-badge" style="background:${statusColor}20;color:${statusColor};border:1px solid ${statusColor}40">${statusText}</span>
    </div>
  </div>

  <div class="content">
    <div class="bill-section">
      <div class="section-label">Bill To</div>
      <div class="client-name">Client</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Rate</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>${lineItemsHtml}</tbody>
    </table>

    <div class="totals-section">
      <table class="totals-table">
        <tr>
          <td style="padding:6px 8px;font-size:13px;color:#6b7280">Subtotal</td>
          <td style="text-align:right;padding:6px 8px;font-size:13px;color:#111827">${formatLKR(Number(invoice.subtotalLkr))}</td>
        </tr>
        ${vatRow}${nbtRow}
        <tr style="border-top:2px solid #F3F4F6">
          <td style="padding:12px 8px;font-weight:700;font-size:15px">Total (LKR)</td>
          <td style="text-align:right;padding:12px 8px" class="grand-total">${formatLKR(Number(invoice.totalLkr))}</td>
        </tr>
        ${Number(invoice.paidLkr) > 0 ? `
        <tr>
          <td style="padding:4px 8px;font-size:13px;color:#2ECC8A">Amount Paid</td>
          <td style="text-align:right;padding:4px 8px;font-size:13px;color:#2ECC8A">${formatLKR(Number(invoice.paidLkr))}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px;font-size:13px;font-weight:700">Balance Due</td>
          <td style="text-align:right;padding:4px 8px;font-size:13px;font-weight:700;color:#E8624A">${formatLKR(Number(invoice.totalLkr) - Number(invoice.paidLkr))}</td>
        </tr>` : ''}
      </table>
    </div>

    ${invoice.notes ? `<div class="notes"><div class="section-label">Notes</div><p>${invoice.notes}</p></div>` : ''}

    <div class="footer">
      <p>Generated by InvoiceMate · invoicemate.lk · All amounts in Sri Lankan Rupees (LKR)</p>
      <p style="margin-top:4px">This is a computer-generated document and does not require a signature</p>
    </div>
  </div>
</body>
</html>`;
  }
}
