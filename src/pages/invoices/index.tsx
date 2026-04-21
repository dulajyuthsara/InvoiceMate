'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Filter, FileText, Send, CheckCircle,
  AlertCircle, Eye, Download, Trash2, MessageSquare,
  ChevronDown, X, ArrowUpRight, Clock
} from 'lucide-react';
import Link from 'next/link';
import { formatLKR, formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils';
import { Invoice, InvoiceStatus } from '@/types';

// Mock invoices
const MOCK_INVOICES: Partial<Invoice>[] = [
  { id: '1', invoiceNumber: 'INV-2025-042', client: { name: 'Dilshan Perera' } as never, totalLkr: 125000, paidLkr: 125000, status: 'paid', language: 'en', issuedAt: '2025-07-10T10:00:00Z', dueDate: '2025-07-20T00:00:00Z' },
  { id: '2', invoiceNumber: 'INV-2025-041', client: { name: 'Nimal Enterprises' } as never, totalLkr: 280000, paidLkr: 0, status: 'overdue', language: 'si', issuedAt: '2025-07-05T10:00:00Z', dueDate: '2025-07-12T00:00:00Z' },
  { id: '3', invoiceNumber: 'INV-2025-040', client: { name: 'Kumari Textiles' } as never, totalLkr: 67500, paidLkr: 0, status: 'sent', language: 'ta', issuedAt: '2025-07-08T10:00:00Z', dueDate: '2025-07-22T00:00:00Z' },
  { id: '4', invoiceNumber: 'INV-2025-039', client: { name: 'Rajitha & Sons' } as never, totalLkr: 450000, paidLkr: 0, status: 'viewed', language: 'en', issuedAt: '2025-07-06T10:00:00Z', dueDate: '2025-07-16T00:00:00Z' },
  { id: '5', invoiceNumber: 'INV-2025-038', client: { name: 'Colombo Cafe Co.' } as never, totalLkr: 38000, paidLkr: 0, status: 'draft', language: 'en', issuedAt: '2025-07-04T10:00:00Z' },
  { id: '6', invoiceNumber: 'INV-2025-037', client: { name: 'Sunethra Fashion' } as never, totalLkr: 92000, paidLkr: 92000, status: 'paid', language: 'si', issuedAt: '2025-07-01T10:00:00Z', dueDate: '2025-07-11T00:00:00Z' },
  { id: '7', invoiceNumber: 'INV-2025-036', client: { name: 'Perera Holdings' } as never, totalLkr: 345000, paidLkr: 0, status: 'sent', language: 'en', issuedAt: '2025-06-28T10:00:00Z', dueDate: '2025-07-08T00:00:00Z' },
  { id: '8', invoiceNumber: 'INV-2025-035', client: { name: 'Malini Creations' } as never, totalLkr: 18500, paidLkr: 18500, status: 'paid', language: 'ta', issuedAt: '2025-06-25T10:00:00Z', dueDate: '2025-07-05T00:00:00Z' },
];

const STATUS_FILTERS: { value: InvoiceStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
];

const LANG_ICON: Record<string, string> = { en: '🇬🇧', si: '🇱🇰', ta: '🇱🇰' };
const LANG_LABEL: Record<string, string> = { en: 'EN', si: 'SI', ta: 'TA' };

function StatusIcon({ status }: { status: InvoiceStatus }) {
  const map: Record<string, { icon: React.ElementType; cls: string }> = {
    paid: { icon: CheckCircle, cls: 'text-emerald' },
    sent: { icon: Send, cls: 'text-sapphire' },
    viewed: { icon: Eye, cls: 'text-violet' },
    draft: { icon: FileText, cls: 'text-slate-500' },
    overdue: { icon: AlertCircle, cls: 'text-coral' },
    void: { icon: X, cls: 'text-slate-600' },
  };
  const { icon: Icon, cls } = map[status] ?? map.draft;
  return <Icon className={cn('w-4 h-4 flex-shrink-0', cls)} />;
}

function InvoiceRow({ invoice, selected, onSelect, delay }: {
  invoice: Partial<Invoice>;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const balance = (invoice.totalLkr ?? 0) - (invoice.paidLkr ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'invoice-card p-4 flex items-center gap-4 cursor-pointer',
        selected && 'border-gold-400/30 bg-gold-400/3'
      )}
    >
      {/* Checkbox */}
      <div
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          'w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-smooth',
          selected ? 'bg-gold-400 border-gold-400' : 'border-white/20 hover:border-gold-400/40'
        )}
      >
        {selected && <CheckCircle className="w-3 h-3 text-ink" />}
      </div>

      {/* Status icon */}
      <StatusIcon status={invoice.status as InvoiceStatus} />

      {/* Invoice details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs text-slate-500">{invoice.invoiceNumber}</span>
          <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', getStatusColor(invoice.status as InvoiceStatus))}>
            {getStatusLabel(invoice.status as InvoiceStatus)}
          </span>
          <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
            {LANG_ICON[invoice.language ?? 'en']} {LANG_LABEL[invoice.language ?? 'en']}
          </span>
        </div>
        <p className="text-sm font-medium text-slate-200 truncate mt-0.5">{invoice.client?.name}</p>
        <p className="text-xs text-slate-600 mt-0.5">
          Issued {formatDate(invoice.issuedAt!, 'relative')}
          {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate, 'short')}`}
        </p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-slate-100">{formatLKR(invoice.totalLkr ?? 0)}</p>
        {balance > 0 && invoice.status !== 'draft' && (
          <p className="text-xs text-coral mt-0.5">Due: {formatLKR(balance)}</p>
        )}
        {invoice.status === 'paid' && (
          <p className="text-xs text-emerald mt-0.5">Paid in full</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button className="p-1.5 rounded-lg hover:bg-sapphire/10 text-slate-600 hover:text-sapphire transition-smooth" title="View">
          <ArrowUpRight className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-emerald/10 text-slate-600 hover:text-emerald transition-smooth" title="WhatsApp">
          <MessageSquare className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-slate-300 transition-smooth" title="Download PDF">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filtered = MOCK_INVOICES.filter(inv => {
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesSearch =
      !search ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(i => i.id!)));
  };

  const totalUnpaid = MOCK_INVOICES.filter(i => i.status !== 'paid' && i.status !== 'draft' && i.status !== 'void').reduce((s, i) => s + ((i.totalLkr ?? 0) - (i.paidLkr ?? 0)), 0);
  const totalPaid = MOCK_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + (i.totalLkr ?? 0), 0);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gradient-white">Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">
            {MOCK_INVOICES.length} total · {formatLKR(totalPaid)} collected · {formatLKR(totalUnpaid)} outstanding
          </p>
        </div>
        <Link href="/invoices/new">
          <button className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm">
            <Plus className="w-4 h-4" />
            New Invoice
          </button>
        </Link>
      </motion.div>

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3 mb-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice number or client..."
              className="input-dark w-full rounded-xl pl-11 pr-4 py-3 text-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn('btn-outline-gold flex items-center gap-2 px-4 py-3 rounded-xl text-sm', showFilters && 'bg-gold-400/8')}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth border',
                statusFilter === value
                  ? 'bg-gold-400/10 text-gold-400 border-gold-400/30'
                  : 'border-white/8 text-slate-500 hover:text-slate-300 hover:border-white/20'
              )}
            >
              {label}
              <span className="ml-1.5 text-[10px] opacity-60">
                {value === 'all' ? MOCK_INVOICES.length : MOCK_INVOICES.filter(i => i.status === value).length}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-xl p-3 mb-4 flex items-center gap-3 border border-gold-400/20"
          >
            <span className="text-sm text-gold-400 font-medium">{selected.size} selected</span>
            <div className="flex gap-2 ml-auto">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald border border-emerald/20 hover:bg-emerald/5 transition-smooth">
                <CheckCircle className="w-3.5 h-3.5" /> Mark Paid
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-sapphire border border-sapphire/20 hover:bg-sapphire/5 transition-smooth">
                <MessageSquare className="w-3.5 h-3.5" /> Send Reminder
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 border border-white/8 hover:bg-white/3 transition-smooth">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
              <button onClick={() => setSelected(new Set())} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 transition-smooth">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select all */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <button
            onClick={toggleSelectAll}
            className={cn('w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center cursor-pointer transition-smooth', selected.size === filtered.length && selected.size > 0 ? 'bg-gold-400 border-gold-400' : 'border-white/20 hover:border-gold-400/40')}
          >
            {selected.size === filtered.length && selected.size > 0 && <CheckCircle className="w-3 h-3 text-ink" />}
          </button>
          <span className="text-xs text-slate-500">Select all</span>
          <span className="text-xs text-slate-600 ml-auto">{filtered.length} invoices</span>
        </div>
      )}

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No invoices found</p>
          <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filters</p>
          <Link href="/invoices/new">
            <button className="btn-gold mt-5 px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Invoice
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((inv, i) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              selected={selected.has(inv.id!)}
              onSelect={() => toggleSelect(inv.id!)}
              delay={i * 0.04}
            />
          ))}
        </div>
      )}

      {/* Summary footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6 p-4 glass rounded-xl grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Total Invoiced</p>
          <p className="font-display font-bold text-slate-100 text-sm">{formatLKR(MOCK_INVOICES.reduce((s, i) => s + (i.totalLkr ?? 0), 0))}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Collected</p>
          <p className="font-display font-bold text-emerald text-sm">{formatLKR(totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Outstanding</p>
          <p className="font-display font-bold text-coral text-sm">{formatLKR(totalUnpaid)}</p>
        </div>
      </motion.div>
    </div>
  );
}
