// ─── INVOICE ENTITY ───────────────────────────────────────────────────
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index
} from 'typeorm';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'void';
export type Language = 'en' | 'si' | 'ta';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @Column({ name: 'client_id' })
  clientId: string;

  @Column({ name: 'invoice_number', unique: true })
  invoiceNumber: string;

  @Column({ default: 'draft' })
  status: InvoiceStatus;

  @Column({ default: 'en' })
  language: Language;

  @Column({ name: 'line_items', type: 'jsonb' })
  lineItems: LineItemJson[];

  @Column({ type: 'jsonb', nullable: true })
  translations: Record<string, unknown> | null;

  @Column({ name: 'subtotal_lkr', type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotalLkr: number;

  @Column({ name: 'vat_lkr', type: 'numeric', precision: 14, scale: 2, default: 0 })
  vatLkr: number;

  @Column({ name: 'nbt_lkr', type: 'numeric', precision: 14, scale: 2, default: 0 })
  nbtLkr: number;

  @Column({ name: 'total_lkr', type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalLkr: number;

  @Column({ name: 'paid_lkr', type: 'numeric', precision: 14, scale: 2, default: 0 })
  paidLkr: number;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ name: 'pdf_url', nullable: true })
  pdfUrl: string | null;

  @Column({ name: 'pdf_generated_at', type: 'timestamptz', nullable: true })
  pdfGeneratedAt: Date | null;

  @Column({ name: 'embedding_id', nullable: true })
  embeddingId: string | null;

  @Column({ nullable: true, type: 'text' })
  notes: string | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ name: 'issued_at' })
  issuedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface LineItemJson {
  id: string;
  description: string;
  quantity: number;
  rateLkr: number;
  vatApplicable: boolean;
  nbtApplicable: boolean;
  subtotalLkr: number;
  vatLkr: number;
  nbtLkr: number;
  totalLkr: number;
}

// ─── DTOS ─────────────────────────────────────────────────────────────
import {
  IsString, IsOptional, IsEnum, IsArray, IsBoolean,
  IsNumber, IsDateString, ValidateNested, IsUUID, Min, ArrayMinSize
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLineItemDto {
  @ApiProperty() @IsString() description: string;
  @ApiProperty() @IsNumber() @Min(0.01) quantity: number;
  @ApiProperty() @IsNumber() @Min(0) rateLkr: number;
  @ApiProperty() @IsBoolean() vatApplicable: boolean;
  @ApiProperty() @IsBoolean() nbtApplicable: boolean;
}

export class CreateInvoiceDto {
  @ApiProperty() @IsUUID() clientId: string;
  @ApiPropertyOptional({ enum: ['en', 'si', 'ta'] }) @IsEnum(['en', 'si', 'ta']) @IsOptional() language?: Language;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dueDate?: string;
  @ApiProperty({ type: [CreateLineItemDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CreateLineItemDto)
  lineItems: CreateLineItemDto[];
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional() @IsDateString() @IsOptional() dueDate?: string;
  @ApiPropertyOptional({ enum: ['draft','sent','viewed','paid','overdue','void'] })
  @IsEnum(['draft','sent','viewed','paid','overdue','void']) @IsOptional()
  status?: InvoiceStatus;
}

export class SendInvoiceDto {
  @ApiProperty({ type: [String] }) @IsArray() channels: string[];
  @ApiPropertyOptional() @IsString() @IsOptional() message?: string;
}

export class InvoiceFilterDto {
  @ApiPropertyOptional() @IsOptional() status?: InvoiceStatus;
  @ApiPropertyOptional() @IsOptional() clientId?: string;
  @ApiPropertyOptional() @IsOptional() fromDate?: string;
  @ApiPropertyOptional() @IsOptional() toDate?: string;
  @ApiPropertyOptional() @IsOptional() search?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) page?: number = 1;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) limit?: number = 20;
}
