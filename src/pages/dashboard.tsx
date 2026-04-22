'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, TrendingDown, FileText, Users, DollarSign,
  AlertCircle, Plus, Send, Eye, CheckCircle, ArrowUpRight,
  Clock, Zap
} from 'lucide-react';
import Link from 'next/link';
import { formatLKR, formatLKRShort, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils';
import { Invoice, InvoiceStatus } from '@/types';
import { cn } from '@/lib/utils';

// ─── MOCK DATA ────────────────────────────────────────────────────────
const REVENUE_DATA = [
  { month: 'Jan', revenue: 285000, invoices: 12 },
  { month: 'Feb', revenue: 420000, invoices: 18 },
  { month: 'Mar', revenue: 310000, invoices: 14 },
  { month: 'Apr', revenue: 580000, invoices: 22 },
  { month: 'May', revenue: 490000, invoices: 19 },
  { month: 'Jun', revenue: 720000, invoices: 28 },
  { month: 'Jul', revenue: 650000, invoices: 25 },
  { month: 'Aug', revenue: 880000, invoices: 34 },
];

const STATUS_DATA = [
  { name: 'Paid', value: 62, color: '#2ECC8A' },
  { name: 'Sent', value: 18, color: '#4A90E8' },
  { name: 'Overdue', value: 12, color: '#E8624A' },
  { name: 'Draft', value: 8, color: '#8B90A0' },
];

const RECENT_INVOICES: Partial<Invoice>[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2025-042',
    client: { name: 'Dilshan Perera', email: 'dilshan@example.com' } as never,
    totalLkr: 125000,
    status: 'paid',
    issuedAt: '2025-07-10T10:00:00Z',
  },
  {
    id: '2',
    invoiceNumber: 'INV-2025-041',
    client: { name: 'Nimal Enterprises', email: 'info@nimal.lk' } as never,
    totalLkr: 280000,
    status: 'overdue',
    issuedAt: '2025-07-05T10:00:00Z',
    dueDate: '2025-07-12T00:00:00Z',
  },
  {
    id: '3',
    invoiceNumber: 'INV-2025-040',
    client: { name: 'Kumari Textiles', email: 'kumari@textiles.lk' } as never,
    totalLkr: 67500,
    status: 'sent',
    issuedAt: '2025-07-08T10:00:00Z',
  },
  {
    id: '4',
    invoiceNumber: 'INV-2025-039',
    client: { name: 'Rajitha & Sons', email: 'rajitha@sons.lk' } as never,
    totalLkr: 450000,
    status: 'viewed',
    issuedAt: '2025-07-06T10:00:00Z',
  },
  {
    id: '5',
    invoiceNumber: 'INV-2025-038',
    client: { name: 'Colombo Cafe Co.', email: 'cafe@colombo.lk' } as never,
    totalLkr: 38000,
    status: 'draft',
    issuedAt: '2025-07-04T10:00:00Z',
  },
];

// ─── STAT CARD ────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: React.ElementType;
  accentClass: string;
  delay: number;
}

function StatCard({ label, value, change, changePositive, icon: Icon, accentClass, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn('stat-card p-6 card-3d', accentClass)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white/5">
          <Icon className="w-5 h-5 text-slate-300" />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
            changePositive
              ? 'bg-emerald/10 text-emerald border border-emerald/20'
              : 'bg-coral/10 text-coral border border-coral/20'
          )}
        >
          {changePositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <div className="card-3d-inner">
        <p className="text-2xl font-display font-bold text-slate-100 mb-1">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── STATUS ICON ──────────────────────────────────────────────────────
function StatusIcon({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { icon: React.ElementType; color: string }> = {
    paid: { icon: CheckCircle, color: 'text-emerald' },
    sent: { icon: Send, color: 'text-sapphire' },
    viewed: { icon: Eye, color: 'text-violet' },
    draft: { icon: FileText, color: 'text-slate-500' },
    overdue: { icon: AlertCircle, color: 'text-coral' },
    void: { icon: FileText, color: 'text-slate-600' },
  };
  const { icon: Icon, color } = map[status] || map.draft;
  return <Icon className={cn('w-4 h-4', color)} />;
}

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-gold-400/20 shadow-card">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-base font-display font-bold text-gold-400">
        {formatLKR(payload[0]?.value ?? 0)}
      </p>
      <p className="text-xs text-slate-500">{payload[1]?.value ?? 0} invoices</p>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-gradient-white">
            Good morning! 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <Link href="/invoices/new">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-gold hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm"
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </motion.button>
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value="LKR 3.42M"
          change="+18.2%"
          changePositive
          icon={DollarSign}
          accentClass="gold-accent"
          delay={0}
        />
        <StatCard
          label="Outstanding"
          value="LKR 840K"
          change="-5.1%"
          changePositive
          icon={Clock}
          accentClass="blue-accent"
          delay={0.08}
        />
        <StatCard
          label="Overdue"
          value="LKR 280K"
          change="+12.4%"
          changePositive={false}
          icon={AlertCircle}
          accentClass="red-accent"
          delay={0.16}
        />
        <StatCard
          label="Paid This Month"
          value="LKR 880K"
          change="+22.6%"
          changePositive
          icon={CheckCircle}
          accentClass="green-accent"
          delay={0.24}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 stat-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-semibold text-slate-200">Revenue Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">Monthly revenue in LKR</p>
            </div>
            <div className="flex gap-1">
              {(['week', 'month', 'quarter'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth',
                    chartPeriod === p
                      ? 'bg-gold-400/10 text-gold-400 border border-gold-400/20'
                      : 'text-slate-500 hover:text-slate-300'
                  )}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={REVENUE_DATA}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C8A84B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C8A84B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#8B90A0', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B90A0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatLKRShort(v)} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#C8A84B"
                strokeWidth={2}
                fill="url(#goldGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          className="stat-card p-6"
        >
          <h2 className="font-display font-semibold text-slate-200 mb-1">Invoice Status</h2>
          <p className="text-xs text-slate-500 mb-4">Distribution by count</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={STATUS_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {STATUS_DATA.map((entry, index) => (
                  <Cell key={index} fill={entry.color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value}%`, '']}
                contentStyle={{ background: 'rgba(30,34,51,0.9)', border: '1px solid rgba(200,168,75,0.2)', borderRadius: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {STATUS_DATA.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-400">{item.name}</span>
                </div>
                <span className="font-medium text-slate-200">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="stat-card overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div>
            <h2 className="font-display font-semibold text-slate-200">Recent Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">Latest activity across your business</p>
          </div>
          <Link href="/invoices">
            <button className="btn-outline-gold flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm">
              View all
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        <div className="divide-y divide-white/5">
          {RECENT_INVOICES.map((invoice, i) => (
            <motion.div
              key={invoice.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              className="invoice-card rounded-none border-0 flex items-center gap-4 px-6 py-4 cursor-pointer"
            >
              <StatusIcon status={invoice.status as InvoiceStatus} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs text-slate-500">{invoice.invoiceNumber}</span>
                  <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', getStatusColor(invoice.status as InvoiceStatus))}>
                    {getStatusLabel(invoice.status as InvoiceStatus)}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-200 truncate">{invoice.client?.name}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-100">{formatLKR(invoice.totalLkr ?? 0)}</p>
                <p className="text-xs text-slate-500">{formatDate(invoice.issuedAt!, 'relative')}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Plus, label: 'New Invoice', href: '/invoices/new', color: 'text-gold-400' },
          { icon: Users, label: 'Add Client', href: '/clients/new', color: 'text-sapphire' },
          { icon: Send, label: 'Send Reminder', href: '/invoices?action=remind', color: 'text-violet' },
          { icon: Zap, label: 'AI Translate', href: '/invoices?action=translate', color: 'text-emerald' },
        ].map(({ icon: Icon, label, href, color }) => (
          <Link key={href} href={href}>
            <div className="invoice-card p-4 flex flex-col items-center gap-2 text-center cursor-pointer card-3d">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <span className="text-sm text-slate-400 font-medium">{label}</span>
            </div>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
