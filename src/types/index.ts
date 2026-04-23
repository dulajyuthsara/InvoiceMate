// ─── ENUMS ────────────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'void';
export type Language = 'en' | 'si' | 'ta';
export type Channel = 'whatsapp' | 'email' | 'both';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'cheque' | 'other';
export type SubscriptionTier = 'free' | 'pro' | 'business';
export type TaxType = 'vat' | 'nbt' | 'both' | 'none';

// ─── USER ─────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  phone?: string;
  businessName: string;
  tinNumber?: string;
  logoUrl?: string;
  defaultLanguage: Language;
  subscriptionTier: SubscriptionTier;
  waPhoneId?: string;
  address?: string;
  createdAt: string;
}

// ─── CLIENT ───────────────────────────────────────────────────────
export interface Client {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  lifetimeValueLkr: number;
  invoiceCount: number;
  lastInvoiceAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
}

// ─── LINE ITEM ─────────────────────────────────────────────────────
export interface LineItem {
  id: string;
  description: string;
  descriptionSi?: string;
  descriptionTa?: string;
  quantity: number;
  rateLkr: number;
  taxType: TaxType;
  vatApplicable: boolean;
  nbtApplicable: boolean;
  subtotalLkr: number;
  vatLkr: number;
  nbtLkr: number;
  totalLkr: number;
}

// ─── INVOICE ───────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  userId: string;
  clientId: string;
  client: Client;
  invoiceNumber: string;
  status: InvoiceStatus;
  language: Language;
  lineItems: LineItem[];
  translations?: {
    si?: InvoiceTranslation;
    ta?: InvoiceTranslation;
  };
  subtotalLkr: number;
  vatLkr: number;
  nbtLkr: number;
  totalLkr: number;
  paidLkr: number;
  balanceLkr: number;
  dueDate?: string;
  pdfUrl?: string;
  pdfGeneratedAt?: string;
  notes?: string;
  notesSi?: string;
  notesTa?: string;
  issuedAt: string;
  sentAt?: string;
  paidAt?: string;
  payments?: Payment[];
  reminders?: Reminder[];
}

export interface InvoiceTranslation {
  lineItems: Array<{ id: string; description: string }>;
  notes?: string;
  header?: string;
  footer?: string;
}

export interface CreateInvoiceInput {
  clientId: string;
  language: Language;
  dueDate?: string;
  lineItems: CreateLineItemInput[];
  notes?: string;
  vatEnabled: boolean;
  nbtEnabled: boolean;
}

export interface CreateLineItemInput {
  description: string;
  quantity: number;
  rateLkr: number;
  vatApplicable: boolean;
  nbtApplicable: boolean;
}

// ─── PAYMENT ───────────────────────────────────────────────────────
export interface Payment {
  id: string;
  invoiceId: string;
  amountLkr: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt: string;
}

export interface CreatePaymentInput {
  amountLkr: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  paidAt?: string;
}

// ─── REMINDER ─────────────────────────────────────────────────────
export interface Reminder {
  id: string;
  invoiceId: string;
  channel: Channel;
  status: 'scheduled' | 'sent' | 'failed';
  messageBody?: string;
  scheduledFor: string;
  sentAt?: string;
}

// ─── ANALYTICS ────────────────────────────────────────────────────
export interface AnalyticsSummary {
  totalRevenueLkr: number;
  outstandingLkr: number;
  overdueLkr: number;
  paidThisMonthLkr: number;
  invoicesTotal: number;
  invoicesPaid: number;
  invoicesUnpaid: number;
  invoicesOverdue: number;
  topClients: Array<{ client: Client; totalLkr: number; count: number }>;
  revenueTrend: Array<{ period: string; revenueLkr: number; invoices: number }>;
  statusBreakdown: Array<{ status: InvoiceStatus; count: number; totalLkr: number }>;
}

// ─── AI TYPES ─────────────────────────────────────────────────────
export interface TaxHint {
  description: string;
  vatLikely: boolean;
  nbtLikely: boolean;
  confidence: 'high' | 'medium' | 'low';
  hint: string;
}

export interface GeneratedMessage {
  subject?: string;
  body: string;
}

export interface TranslationResult {
  language: Language;
  lineItems: Array<{ id: string; description: string }>;
  notes?: string;
}

// ─── API RESPONSE ─────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface InvoiceListResponse extends PaginatedResponse<Invoice> {
  summary: {
    totalLkr: number;
    paidLkr: number;
    outstandingLkr: number;
  };
}

// ─── FILTER PARAMS ─────────────────────────────────────────────────
export interface InvoiceFilters {
  status?: InvoiceStatus;
  clientId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── OFFLINE SYNC ──────────────────────────────────────────────────
export interface OfflineInvoice extends CreateInvoiceInput {
  localId: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'error';
  createdAt: string;
}

// ─── NOTIFICATION ──────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
