import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

class TaxHintItemDto {
  @IsString() description: string;
  @IsNumber() amountLkr: number;
}

class TaxHintsDto {
  @IsArray() lineItems: TaxHintItemDto[];
}

class GenerateMessageDto {
  @IsString() invoiceId: string;
  @IsString() invoiceNumber: string;
  @IsString() clientName: string;
  @IsString() businessName: string;
  @IsNumber() totalLkr: number;
  @IsOptional() @IsString() dueDate?: string;
  @IsEnum(['whatsapp', 'email']) channel: 'whatsapp' | 'email';
  @IsEnum(['en', 'si', 'ta']) language: 'en' | 'si' | 'ta';
  @IsEnum(['formal', 'friendly']) tone: 'formal' | 'friendly';
  @IsOptional() @IsString() pdfLink?: string;
}

class TranslateTextDto {
  @IsString() text: string;
  @IsEnum(['si', 'ta']) targetLanguage: 'si' | 'ta';
}

@ApiTags('AI Features')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('tax-hints')
  @ApiOperation({ summary: 'Get AI-powered VAT/NBT hints for line items' })
  @HttpCode(HttpStatus.OK)
  async getTaxHints(@Body() dto: TaxHintsDto) {
    const hints = await this.aiService.getTaxHints(dto.lineItems);
    return { success: true, data: hints };
  }

  @Post('message')
  @ApiOperation({ summary: 'Generate WhatsApp or email message for invoice sharing' })
  @HttpCode(HttpStatus.OK)
  async generateMessage(@Body() dto: GenerateMessageDto) {
    const message = await this.aiService.generateMessage(dto);
    return { success: true, data: message };
  }

  @Post('translate')
  @ApiOperation({ summary: 'Translate text snippet to Sinhala or Tamil' })
  @HttpCode(HttpStatus.OK)
  async translateText(@Body() dto: TranslateTextDto) {
    // Simple text translation endpoint for ad-hoc use
    const result = await this.aiService.translateInvoice(
      { lineItems: [{ id: '1', description: dto.text }], notes: '' },
      dto.targetLanguage
    );
    return { success: true, data: result.lineItems[0]?.description ?? '' };
  }
}
