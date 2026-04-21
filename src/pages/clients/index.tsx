'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Search, Phone, Mail, MapPin,
  TrendingUp, FileText, ChevronRight, X, Loader2,
  ArrowUpRight, MessageSquare
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { formatLKR, getInitials, buildWhatsAppUrl, cn } from '@/lib/utils';
import { Client } from '@/types';

// Mock data
const MOCK_CLIENTS: Client[] = [
  { id: '1', userId: 'u1', name: 'Dilshan Perera', email: 'dilshan@techcorp.lk', phone: '0771234567', address: 'Colombo 3', lifetimeValueLkr: 425000, invoiceCount: 8, lastInvoiceAt: '2025-07-10T10:00:00Z', createdAt: '2024-01-15T00:00:00Z' },
  { id: '2', userId: 'u1', name: 'Nimal Enterprises', email: 'info@nimal.lk', phone: '0112345678', address: 'Kandy', lifetimeValueLkr: 1250000, invoiceCount: 22, lastInvoiceAt: '2025-07-05T10:00:00Z', createdAt: '2024-02-20T00:00:00Z' },
  { id: '3', userId: 'u1', name: 'Kumari Textiles', email: 'kumari@textiles.lk', phone: '0762345678', address: 'Gampaha', lifetimeValueLkr: 380000, invoiceCount: 14, lastInvoiceAt: '2025-07-08T10:00:00Z', createdAt: '2024-03-10T00:00:00Z' },
  { id: '4', userId: 'u1', name: 'Rajitha & Sons', email: 'rajitha@sons.lk', phone: '0718765432', address: 'Negombo', lifetimeValueLkr: 920000, invoiceCount: 17, lastInvoiceAt: '2025-06-28T10:00:00Z', createdAt: '2024-04-05T00:00:00Z' },
  { id: '5', userId: 'u1', name: 'Colombo Cafe Co.', email: 'cafe@colombo.lk', phone: '0773344556', address: 'Colombo 7', lifetimeValueLkr: 195000, invoiceCount: 9, lastInvoiceAt: '2025-07-04T10:00:00Z', createdAt: '2024-05-12T00:00:00Z' },
  { id: '6', userId: 'u1', name: 'Sunethra Fashion', email: 'sunethra@fashion.lk', phone: '0779988776', address: 'Matara', lifetimeValueLkr: 640000, invoiceCount: 11, lastInvoiceAt: '2025-06-20T10:00:00Z', createdAt: '2024-06-01T00:00:00Z' },
];

const AVATAR_COLORS = [
  'from-gold-400 to-yellow-600',
  'from-emerald to-teal-600',
  'from-sapphire to-blue-700',
  'from-violet to-purple-700',
  'from-coral to-rose-700',
  'from-pink-500 to-rose-600',
];

// ─── ADD CLIENT MODAL ────────────────────────────────────────────────
const clientSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
});
type ClientForm = z.infer<typeof clientSchema>;

function AddClientModal({ onClose, onAdd }: { onClose: () => void; onAdd: (c: Client) => void }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
  });

  const onSubmit = async (data: ClientForm) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const newClient: Client = {
      id: crypto.randomUUID(),
      userId: 'u1',
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      lifetimeValueLkr: 0,
      invoiceCount: 0,
      createdAt: new Date().toISOString(),
    };
    onAdd(newClient);
    toast.success(`${data.name} added to clients!`);
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md stat-card p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-slate-200">Add New Client</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-smooth">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'name', placeholder: 'Client / Business Name *', icon: Users },
            { name: 'email', placeholder: 'Email address', icon: Mail },
            { name: 'phone', placeholder: 'WhatsApp / Phone', icon: Phone },
            { name: 'address', placeholder: 'City / Address', icon: MapPin },
            { name: 'taxId', placeholder: 'Tax ID / NIC (optional)', icon: FileText },
          ].map(({ name, placeholder, icon: Icon }) => (
            <div key={name}>
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  {...register(name as keyof ClientForm)}
                  placeholder={placeholder}
                  className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-sm"
                />
              </div>
              {errors[name as keyof ClientForm] && (
                <p className="text-coral text-xs mt-1">{errors[name as keyof ClientForm]?.message}</p>
              )}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline-gold py-3 rounded-xl text-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 btn-gold py-3 rounded-xl text-sm flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Client'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── CLIENT CARD ─────────────────────────────────────────────────────
function ClientCard({ client, index }: { client: Client; index: number }) {
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = getInitials(client.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="invoice-card p-5 card-3d cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-card`}>
          <span className="text-white font-bold font-display text-base">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-200 truncate">{client.name}</h3>
            <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5" />
          </div>
          <div className="space-y-1 mt-1.5">
            {client.email && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail className="w-3 h-3" />
                <span className="truncate">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Phone className="w-3 h-3" />
                <span>{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3 h-3" />
                <span>{client.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
        <div className="bg-white/3 rounded-lg p-2.5">
          <p className="text-xs text-slate-500 mb-0.5">Lifetime Value</p>
          <p className="text-sm font-bold text-gold-400">{formatLKR(client.lifetimeValueLkr)}</p>
        </div>
        <div className="bg-white/3 rounded-lg p-2.5">
          <p className="text-xs text-slate-500 mb-0.5">Invoices</p>
          <p className="text-sm font-bold text-slate-200">{client.invoiceCount}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button className="flex-1 py-2 rounded-lg border border-white/8 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/3 transition-smooth flex items-center justify-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          Invoice
        </button>
        {client.phone && (
          <a
            href={buildWhatsAppUrl(client.phone, `Hi ${client.name.split(' ')[0]},`)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 rounded-lg border border-emerald/20 text-xs text-emerald hover:bg-emerald/5 transition-smooth flex items-center justify-center gap-1.5"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            WhatsApp
          </a>
        )}
        <button className="py-2 px-2.5 rounded-lg border border-white/8 text-xs text-slate-400 hover:text-sapphire hover:border-sapphire/20 transition-smooth">
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── CLIENTS PAGE ─────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const totalLTV = clients.reduce((s, c) => s + c.lifetimeValueLkr, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-gradient-white">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">{clients.length} clients · {formatLKR(totalLTV)} total lifetime value</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gold flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Client
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Clients', value: String(clients.length), icon: Users, color: 'text-sapphire' },
          { label: 'Total LTV', value: formatLKR(totalLTV), icon: TrendingUp, color: 'text-gold-400' },
          { label: 'Active This Month', value: '8', icon: FileText, color: 'text-emerald' },
          { label: 'Avg. Invoice Value', value: formatLKR(totalLTV / Math.max(clients.reduce((s, c) => s + c.invoiceCount, 0), 1)), icon: ChevronRight, color: 'text-violet' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="stat-card p-4 card-3d"
          >
            <Icon className={cn('w-5 h-5 mb-2', color)} />
            <p className="font-display font-bold text-slate-100 text-lg leading-tight">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients by name, email, or phone..."
          className="input-dark w-full rounded-xl pl-11 pr-4 py-3 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No clients found</p>
          <p className="text-slate-600 text-sm mt-1">Try a different search or add a new client</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((client, i) => (
            <ClientCard key={client.id} client={client} index={i} />
          ))}
        </div>
      )}

      {/* Add Client Modal */}
      <AnimatePresence>
        {showModal && (
          <AddClientModal
            onClose={() => setShowModal(false)}
            onAdd={(c) => setClients(prev => [c, ...prev])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
