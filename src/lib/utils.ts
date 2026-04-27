import { InvoiceStatus, Language } from '@/types';
import { clsx, type ClassValue } from 'clsx';

// ─── CLASSNAMES ──────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// ─── CURRENCY FORMAT ─────────────────────────────────────────────────
export function formatLKR(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatLKRShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `LKR ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `LKR ${(amount / 1_000).toFixed(0)}K`;
  }
  return `LKR ${amount.toFixed(0)}`;
}

// ─── DATE FORMAT ─────────────────────────────────────────────────────
export function formatDate(date: string | Date, format?: 'short' | 'long' | 'relative'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (format === 'relative') {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  }

  if (format === 'long') {
    return d.toLocaleDateString('en-LK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return d.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

export function daysUntilDue(dueDate: string): number {
  const diff = new Date(dueDate).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── INVOICE NUMBER ───────────────────────────────────────────────────
export function generateInvoiceNumber(prefix = 'INV'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${year}-${random}`;
}

// ─── TAX CALCULATION ──────────────────────────────────────────────────
const VAT_RATE = 0.18;
const NBT_RATE = 0.02;

export function calculateLineItemTotals(
  quantity: number,
  rateLkr: number,
  vatApplicable: boolean,
  nbtApplicable: boolean
) {
  const subtotalLkr = quantity * rateLkr;
  const vatLkr = vatApplicable ? subtotalLkr * VAT_RATE : 0;
  const nbtLkr = nbtApplicable ? subtotalLkr * NBT_RATE : 0;
  const totalLkr = subtotalLkr + vatLkr + nbtLkr;

  return {
    subtotalLkr: Math.round(subtotalLkr * 100) / 100,
    vatLkr: Math.round(vatLkr * 100) / 100,
    nbtLkr: Math.round(nbtLkr * 100) / 100,
    totalLkr: Math.round(totalLkr * 100) / 100,
  };
}

export function calculateInvoiceTotals(
  lineItems: Array<{
    subtotalLkr: number;
    vatLkr: number;
    nbtLkr: number;
    totalLkr: number;
  }>
) {
  const subtotalLkr = lineItems.reduce((sum, item) => sum + item.subtotalLkr, 0);
  const vatLkr = lineItems.reduce((sum, item) => sum + item.vatLkr, 0);
  const nbtLkr = lineItems.reduce((sum, item) => sum + item.nbtLkr, 0);
  const totalLkr = lineItems.reduce((sum, item) => sum + item.totalLkr, 0);

  return {
    subtotalLkr: Math.round(subtotalLkr * 100) / 100,
    vatLkr: Math.round(vatLkr * 100) / 100,
    nbtLkr: Math.round(nbtLkr * 100) / 100,
    totalLkr: Math.round(totalLkr * 100) / 100,
  };
}

// ─── STATUS HELPERS ───────────────────────────────────────────────────
export function getStatusColor(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    draft: 'badge-draft',
    sent: 'badge-sent',
    viewed: 'badge-sent',
    paid: 'badge-paid',
    overdue: 'badge-overdue',
    void: 'badge-draft',
  };
  return map[status] || 'badge-draft';
}

export function getStatusLabel(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    draft: 'Draft',
    sent: 'Sent',
    viewed: 'Viewed',
    paid: 'Paid',
    overdue: 'Overdue',
    void: 'Void',
  };
  return map[status] || status;
}

// ─── LANGUAGE HELPERS ─────────────────────────────────────────────────
export function getLanguageLabel(lang: Language): string {
  const map: Record<Language, string> = {
    en: 'English',
    si: 'සිංහල',
    ta: 'தமிழ்',
  };
  return map[lang] || lang;
}

export function getLanguageFlag(lang: Language): string {
  const map: Record<Language, string> = {
    en: '🇬🇧',
    si: '🇱🇰',
    ta: '🇱🇰',
  };
  return map[lang] || '';
}

// ─── WHATSAPP ─────────────────────────────────────────────────────────
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const international = cleaned.startsWith('94') ? cleaned : `94${cleaned.replace(/^0/, '')}`;
  return `https://wa.me/${international}?text=${encodeURIComponent(message)}`;
}

// ─── FILE HELPERS ─────────────────────────────────────────────────────
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── FORM VALIDATION ──────────────────────────────────────────────────
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^(\+94|0|94)?[0-9]{9}$/.test(phone.replace(/\s/g, ''));
}

// ─── TRUNCATE ─────────────────────────────────────────────────────────
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// ─── DEBOUNCE ─────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// ─── INITIALS ─────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── RANDOM COLOR FOR AVATAR ──────────────────────────────────────────
const AVATAR_COLORS = [
  'from-gold-400 to-gold-600',
  'from-emerald to-teal-600',
  'from-sapphire to-blue-700',
  'from-violet to-purple-700',
  'from-coral to-rose-700',
];

export function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
