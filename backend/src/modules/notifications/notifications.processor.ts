import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as twilio from 'twilio';
import * as sgMail from '@sendgrid/mail';
import { Invoice } from '../invoices/invoice.entity';
import { AiService } from '../ai/ai.service';

interface SendInvoiceJobData {
  invoiceId: string;
  userId: string;
  channel: string;
  message: string;
}

@Processor('notifications')
@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private twilioClient: twilio.Twilio;

  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepo: Repository<Invoice>,
    private readonly config: ConfigService,
    private readonly aiService: AiService,
  ) {
    this.twilioClient = twilio.default(
      config.get<string>('TWILIO_ACCOUNT_SID'),
      config.get<string>('TWILIO_AUTH_TOKEN'),
    );
    sgMail.setApiKey(config.get<string>('SENDGRID_API_KEY', ''));
  }

  @Process('send-invoice')
  async handleSendInvoice(job: Job<SendInvoiceJobData>) {
    const { invoiceId, channel, message } = job.data;

    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice) {
      this.logger.warn(`Invoice ${invoiceId} not found for notification`);
      return;
    }

    let generatedMessage = message;

    // Auto-generate message if requested
    if (message === 'auto') {
      const generated = await this.aiService.generateMessage({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientName: 'Client', // In production: join with clients table
        businessName: 'Business', // In production: join with users table
        totalLkr: Number(invoice.totalLkr),
        dueDate: invoice.dueDate,
        channel: channel as 'whatsapp' | 'email',
        language: invoice.language,
        tone: 'friendly',
        pdfLink: invoice.pdfUrl ?? undefined,
      });
      generatedMessage = generated.body;
    }

    if (channel === 'whatsapp') {
      await this.sendWhatsApp(invoice, generatedMessage);
    } else if (channel === 'email') {
      await this.sendEmail(invoice, generatedMessage);
    }
  }

  private async sendWhatsApp(invoice: Invoice, message: string): Promise<void> {
    const waNumber = this.config.get<string>('TWILIO_WHATSAPP_NUMBER');

    // In production: look up client phone from clients table
    const toPhone = 'whatsapp:+94771234567'; // Placeholder

    try {
      // If PDF is available, send as media message
      if (invoice.pdfUrl) {
        await this.twilioClient.messages.create({
          from: `whatsapp:${waNumber}`,
          to: toPhone,
          body: message,
          mediaUrl: [invoice.pdfUrl],
        });
      } else {
        await this.twilioClient.messages.create({
          from: `whatsapp:${waNumber}`,
          to: toPhone,
          body: message,
        });
      }

      this.logger.log(`WhatsApp sent for invoice ${invoice.invoiceNumber}`);
    } catch (err) {
      this.logger.error(`WhatsApp delivery failed for ${invoice.id}:`, err);
      throw err;
    }
  }

  private async sendEmail(invoice: Invoice, messageBody: string): Promise<void> {
    const fromEmail = this.config.get<string>('SENDGRID_FROM_EMAIL', 'noreply@invoicemate.lk');

    // In production: look up client email from clients table
    const toEmail = 'client@example.com'; // Placeholder

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 40px 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0D0F14, #1A1D26); padding: 32px 40px; }
    .logo-text { color: #C8A84B; font-size: 22px; font-weight: 800; }
    .content { padding: 40px; }
    .message { font-size: 15px; color: #374151; line-height: 1.7; white-space: pre-line; }
    .cta { display: inline-block; margin-top: 24px; padding: 14px 28px; background: linear-gradient(135deg, #C8A84B, #E8C96A); color: #0D0F14; font-weight: 700; border-radius: 12px; text-decoration: none; font-size: 14px; }
    .invoice-details { background: #F9FAFB; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #E5E7EB; }
    .invoice-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
    .footer { padding: 24px 40px; background: #F9FAFB; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="logo-text">InvoiceMate</span>
    </div>
    <div class="content">
      <p class="message">${messageBody.replace(/\n/g, '<br>')}</p>
      <div class="invoice-details">
        <div class="invoice-row"><span style="color:#9CA3AF">Invoice</span><strong>${invoice.invoiceNumber}</strong></div>
        <div class="invoice-row"><span style="color:#9CA3AF">Amount</span><strong style="color:#C8A84B">LKR ${Number(invoice.totalLkr).toLocaleString()}</strong></div>
        ${invoice.dueDate ? `<div class="invoice-row"><span style="color:#9CA3AF">Due Date</span><strong>${new Date(invoice.dueDate).toLocaleDateString('en-LK')}</strong></div>` : ''}
      </div>
      ${invoice.pdfUrl ? `<a href="${invoice.pdfUrl}" class="cta">View / Download Invoice →</a>` : ''}
    </div>
    <div class="footer">
      <p>Sent via InvoiceMate · invoicemate.lk · Sri Lanka</p>
      <p>All amounts in Sri Lankan Rupees (LKR)</p>
    </div>
  </div>
</body>
</html>`;

    try {
      await sgMail.send({
        to: toEmail,
        from: { email: fromEmail, name: 'InvoiceMate' },
        subject: `Invoice ${invoice.invoiceNumber} — LKR ${Number(invoice.totalLkr).toLocaleString()}`,
        text: messageBody,
        html: htmlBody,
        attachments: invoice.pdfUrl
          ? [{ content: '', filename: `${invoice.invoiceNumber}.pdf`, type: 'application/pdf', disposition: 'attachment' }]
          : undefined,
      });

      this.logger.log(`Email sent for invoice ${invoice.invoiceNumber}`);
    } catch (err) {
      this.logger.error(`Email delivery failed for ${invoice.id}:`, err);
      throw err;
    }
  }

  @Process('send-reminder')
  async handleSendReminder(job: Job<{ invoiceId: string; channel: string; daysOverdue: number }>) {
    const { invoiceId, channel, daysOverdue } = job.data;

    const invoice = await this.invoiceRepo.findOne({ where: { id: invoiceId } });
    if (!invoice || invoice.status === 'paid') return;

    const reminderMessage = await this.aiService.generateReminderMessage({
      clientName: 'Client',
      businessName: 'Business',
      invoiceNumber: invoice.invoiceNumber,
      totalLkr: Number(invoice.totalLkr),
      paidLkr: Number(invoice.paidLkr),
      daysOverdue,
      language: invoice.language,
      pdfLink: invoice.pdfUrl ?? undefined,
    });

    if (channel === 'whatsapp') {
      await this.sendWhatsApp(invoice, reminderMessage);
    } else if (channel === 'email') {
      await this.sendEmail(invoice, reminderMessage);
    }
  }
}
