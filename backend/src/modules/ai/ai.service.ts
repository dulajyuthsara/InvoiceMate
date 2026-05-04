import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get<string>('OPENAI_API_KEY'),
    });
  }

  // ─── TRANSLATE INVOICE ───────────────────────────────────────────────
  async translateInvoice(
    invoice: { lineItems: Array<{ id: string; description: string }>; notes?: string | null },
    targetLanguage: 'si' | 'ta'
  ): Promise<{ lineItems: Array<{ id: string; description: string }>; notes?: string }> {
    const langName = targetLanguage === 'si' ? 'Sinhala' : 'Tamil (Sri Lankan)';

    const inputData = {
      lineItems: invoice.lineItems.map((i) => ({ id: i.id, description: i.description })),
      notes: invoice.notes ?? '',
    };

    const prompt = `You are a professional Sri Lankan business document translator.
Translate the following invoice content from English into ${langName}.

Rules:
- Maintain professional business tone appropriate for Sri Lankan SMEs
- For Sinhala: use standard written Sinhala script (Unicode)
- For Tamil: use standard Sri Lankan Tamil (not Indian variants)
- Transliterate brand names and product names naturally
- Return ONLY valid JSON matching the exact input structure
- Do NOT translate IDs, numbers, or currency amounts

Input JSON:
${JSON.stringify(inputData, null, 2)}

Return format (JSON only, no markdown, no preamble):
{
  "lineItems": [{"id": "...", "description": "translated text"}],
  "notes": "translated notes or empty string"
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{}';
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error('Translation failed:', err);
      throw err;
    }
  }

  // ─── TAX HINTS ───────────────────────────────────────────────────────
  async getTaxHints(
    lineItems: Array<{ description: string; amountLkr: number }>
  ): Promise<Array<{
    description: string;
    vatLikely: boolean;
    nbtLikely: boolean;
    confidence: 'high' | 'medium' | 'low';
    hint: string;
  }>> {
    const prompt = `You are a Sri Lanka tax compliance assistant for small businesses.
Analyze these invoice line items and provide VAT/NBT guidance hints.

Current Sri Lanka tax rules (use these only):
- VAT (Value Added Tax): 18% — applies to most goods/services if business turnover > LKR 80M/year or registered for VAT
- NBT (Nation Building Tax): 2% — applies to supply of goods and services in Sri Lanka
- Exempt from VAT: basic food items (rice, bread, milk, vegetables), educational services, certain medical services
- Financial services: exempt from both VAT and NBT

Line items to analyze:
${JSON.stringify(lineItems, null, 2)}

For EACH line item return:
{
  "description": "original description",
  "vatLikely": true or false,
  "nbtLikely": true or false,
  "confidence": "high" | "medium" | "low",
  "hint": "One plain-English sentence about applicable taxes"
}

Return ONLY valid JSON array. No markdown. No preamble.
Last element: add "disclaimer" as a separate string field: "These hints are for guidance only. Consult a registered tax professional."`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{"hints":[]}';
      const parsed = JSON.parse(raw);
      return parsed.hints ?? parsed;
    } catch (err) {
      this.logger.error('Tax hints failed:', err);
      return lineItems.map((item) => ({
        description: item.description,
        vatLikely: false,
        nbtLikely: false,
        confidence: 'low' as const,
        hint: 'Unable to determine tax applicability. Please consult a tax professional.',
      }));
    }
  }

  // ─── GENERATE MESSAGE ─────────────────────────────────────────────────
  async generateMessage(params: {
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    businessName: string;
    totalLkr: number;
    dueDate?: string | null;
    channel: 'whatsapp' | 'email';
    language: 'en' | 'si' | 'ta';
    tone: 'formal' | 'friendly';
    pdfLink?: string;
  }): Promise<{ subject?: string; body: string }> {
    const langName = { en: 'English', si: 'Sinhala', ta: 'Tamil (Sri Lankan)' }[params.language];
    const dueDateStr = params.dueDate
      ? new Date(params.dueDate).toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'not specified';

    const prompt = `You are a professional business communication assistant for Sri Lankan small businesses.
Generate a ${params.channel} message to send with an invoice.

Invoice details:
- Business name: ${params.businessName}
- Client name: ${params.clientName}
- Invoice number: ${params.invoiceNumber}
- Total amount: LKR ${params.totalLkr.toLocaleString()}
- Due date: ${dueDateStr}
- Language: ${langName}
- Tone: ${params.tone}
- Channel: ${params.channel}
${params.pdfLink ? `- PDF link: ${params.pdfLink}` : ''}

Instructions:
${params.channel === 'whatsapp' ? `
- Keep under 200 words
- Use appropriate WhatsApp formatting (no HTML)
- Start with a warm greeting
- Mention invoice number and total amount
- Include the PDF link naturally: ${params.pdfLink ?? '[PDF link will be inserted]'}
- Close warmly
- Write entirely in ${langName}
- Subject field should be null` : `
- Write a professional email body (up to 300 words)
- Include a clear subject line
- Mention invoice number and total amount prominently
- Professional HTML-safe formatting
- Write entirely in ${langName}`}

Return ONLY valid JSON:
{"subject": "email subject or null", "body": "the full message text"}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const raw = completion.choices[0]?.message?.content ?? '{"subject":null,"body":""}';
      return JSON.parse(raw);
    } catch (err) {
      this.logger.error('Message generation failed:', err);
      return {
        subject: params.channel === 'email' ? `Invoice ${params.invoiceNumber} — LKR ${params.totalLkr.toLocaleString()}` : undefined,
        body: `Dear ${params.clientName},\n\nPlease find attached Invoice ${params.invoiceNumber} for LKR ${params.totalLkr.toLocaleString()}.\n\nThank you for your business.\n\n${params.businessName}`,
      };
    }
  }

  // ─── GENERATE EMBEDDINGS ─────────────────────────────────────────────
  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      this.logger.error('Embedding creation failed:', err);
      throw err;
    }
  }

  // ─── GENERATE REMINDER MESSAGE ───────────────────────────────────────
  async generateReminderMessage(params: {
    clientName: string;
    businessName: string;
    invoiceNumber: string;
    totalLkr: number;
    paidLkr: number;
    daysOverdue: number;
    language: 'en' | 'si' | 'ta';
    pdfLink?: string;
  }): Promise<string> {
    const balanceLkr = params.totalLkr - params.paidLkr;
    const tone = params.daysOverdue <= 7 ? 'gentle and friendly' : params.daysOverdue <= 14 ? 'polite but firm' : 'professional and direct';
    const langName = { en: 'English', si: 'Sinhala', ta: 'Tamil (Sri Lankan)' }[params.language];

    const prompt = `Write a ${tone} payment reminder WhatsApp message for an overdue invoice.

Details:
- Client: ${params.clientName}
- Business: ${params.businessName}
- Invoice: ${params.invoiceNumber}
- Balance due: LKR ${balanceLkr.toLocaleString()}
- Days overdue: ${params.daysOverdue}
- Language: ${langName}
${params.pdfLink ? `- Invoice link: ${params.pdfLink}` : ''}

Keep it under 120 words. Do not threaten. Be respectful of Sri Lankan business culture.
Write entirely in ${langName}.
Return ONLY the message text, no JSON wrapper.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.6,
      });
      return completion.choices[0]?.message?.content ?? '';
    } catch (err) {
      this.logger.error('Reminder message generation failed:', err);
      return `Dear ${params.clientName}, this is a reminder that Invoice ${params.invoiceNumber} for LKR ${balanceLkr.toLocaleString()} is overdue. Please arrange payment at your earliest convenience. Thank you — ${params.businessName}`;
    }
  }
}
