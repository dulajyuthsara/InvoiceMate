import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, HttpCode, HttpStatus
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { AiService } from '../ai/ai.service';
import {
  CreateInvoiceDto, UpdateInvoiceDto, SendInvoiceDto, InvoiceFilterDto
} from './invoice.entity';

@ApiTags('Invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new invoice (PDF generated async)' })
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Request() req: { user: { sub: string } }, @Body() dto: CreateInvoiceDto) {
    const invoice = await this.invoicesService.create(req.user.sub, dto);
    return {
      success: true,
      data: invoice,
      message: 'Invoice created. PDF generation queued.',
    };
  }

  @Get()
  @ApiOperation({ summary: 'List invoices with filters and pagination' })
  async findAll(@Request() req: { user: { sub: string } }, @Query() filters: InvoiceFilterDto) {
    return this.invoicesService.findAll(req.user.sub, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single invoice by ID' })
  async findOne(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    const invoice = await this.invoicesService.findOne(req.user.sub, id);
    return { success: true, data: invoice };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice notes, due date, or status' })
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto
  ) {
    const invoice = await this.invoicesService.update(req.user.sub, id, dto);
    return { success: true, data: invoice };
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send invoice via WhatsApp / email (async)' })
  @HttpCode(HttpStatus.ACCEPTED)
  async send(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() dto: SendInvoiceDto
  ) {
    const result = await this.invoicesService.send(req.user.sub, id, dto);
    return { success: true, data: result, message: 'Delivery queued.' };
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Record a payment against an invoice' })
  async recordPayment(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: {
      amountLkr: number;
      method: string;
      reference?: string;
      notes?: string;
      paidAt?: string;
    }
  ) {
    const invoice = await this.invoicesService.recordPayment(req.user.sub, id, body);
    return { success: true, data: invoice };
  }

  @Post(':id/translate')
  @ApiOperation({ summary: 'AI-translate invoice to Sinhala or Tamil' })
  async translate(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body() body: { targetLanguage: 'si' | 'ta' }
  ) {
    const invoice = await this.invoicesService.findOne(req.user.sub, id);

    // Check cache first
    const cached = invoice.translations?.[body.targetLanguage];
    if (cached) {
      return { success: true, data: cached, cached: true };
    }

    const translation = await this.aiService.translateInvoice(invoice, body.targetLanguage);
    await this.invoicesService.storeTranslation(id, body.targetLanguage, translation);

    return { success: true, data: translation, cached: false };
  }

  @Post(':id/void')
  @ApiOperation({ summary: 'Void an invoice' })
  async void(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    const invoice = await this.invoicesService.void(req.user.sub, id);
    return { success: true, data: invoice };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft invoice' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    const invoice = await this.invoicesService.findOne(req.user.sub, id);
    if (invoice.status !== 'draft') {
      throw new Error('Only draft invoices can be deleted');
    }
    // Soft delete — mark void instead of hard delete for audit
    await this.invoicesService.void(req.user.sub, id);
  }
}
