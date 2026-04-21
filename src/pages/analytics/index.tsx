'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Clock } from 'lucide-react';
import { formatLKR, formatLKRShort, cn } from '@/lib/utils';

const REVENUE_DATA = [
  { month: 'Jan', revenue: 285000, paid: 240000, unpaid: 45000 },
  { month: 'Feb', revenue: 420000, paid: 390000, unpaid: 30000 },
  { month: 'Mar', revenue: 310000, paid: 270000, unpaid: 40000 },
  { month: 'Apr', revenue: 580000, paid: 520000, unpaid: 60000 },
  { month: 'May', revenue: 490000, paid: 430000, unpaid: 60000 },
  { month: 'Jun', revenue: 720000, paid: 680000, unpaid: 40000 },
  { month: 'Jul', revenue: 880000, paid: 800000, unpaid: 80000 },
  { month: 'Aug', revenue: 950000, paid: 870000, unpaid: 80000 },
];

const TOP_CLIENTS = [
  { name: 'Nimal Enterprises', revenue: 1250000, invoices: 22, change: +18 },
  { name: 'Rajitha & Sons', revenue: 920000, invoices: 17, change: +5 },
  { name: 'Sunethra Fashion', revenue: 640000, invoices: 11, change: -3 },
  { name: 'Dilshan Perera', revenue: 425000, invoices: 8, change: +24 },
  { name: 'Kumari Textiles', revenue: 380000, invoices: 14, change: +9 },
];

const AGING_DATA = [
  { range: 'Current', amount: 320000, color: '#2ECC8A' },
  { range: '1–30 days', amount: 185000, color: '#4A90E8' },
  { range: '31–60 days', amount: 95000, color: '#C8A84B' },
  { range: '60+ days', amount: 45000, color: '#E8624A' },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 border border-gold-400/20 shadow-card min-w-40">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {formatLKR(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('6m');

  const totalRevenue = REVENUE_DATA.reduce((s, d) => s + d.revenue, 0);
  const totalPaid = REVENUE_DATA.reduce((s, d) => s + d.paid, 0);
  const totalUnpaid = REVENUE_DATA.reduce((s, d) => s + d.unpaid, 0);
  const collectionRate = Math.round((totalPaid / totalRevenue) * 100);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-gradient-white">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Revenue insights and business performance</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoiced', value: formatLKRShort(totalRevenue), icon: DollarSign, change: '+22%', up: true, accent: 'text-gold-400' },
          { label: 'Collected', value: formatLKRShort(totalPaid), icon: TrendingUp, change: '+19%', up: true, accent: 'text-emerald' },
          { label: 'Outstanding', value: formatLKRShort(totalUnpaid), icon: Clock, change: '-8%', up: false, accent: 'text-coral' },
          { label: 'Collection Rate', value: `${collectionRate}%`, icon: FileText, change: '+3%', up: true, accent: 'text-sapphire' },
        ].map(({ label, value, icon: Icon, change, up, accent }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="stat-card p-5 card-3d">
            <div className="flex items-center justify-between mb-3">
              <Icon className={cn('w-5 h-5', accent)} />
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', up ? 'text-emerald bg-emerald/10 border border-emerald/20' : 'text-coral bg-coral/10 border border-coral/20')}>
                {up ? <TrendingUp className="inline w-3 h-3 mr-0.5" /> : <TrendingDown className="inline w-3 h-3 mr-0.5" />}{change}
              </span>
            </div>
            <p className="font-display text-2xl font-bold text-slate-100">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stat-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display font-semibold text-slate-200">Revenue vs Collections</h2>
            <p className="text-xs text-slate-500 mt-0.5">Monthly LKR comparison</p>
          </div>
          <div className="flex gap-1">
            {(['3m', '6m', '1y'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-smooth', period === p ? 'bg-gold-400/10 text-gold-400 border border-gold-400/20' : 'text-slate-500 hover:text-slate-300')}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={REVENUE_DATA}>
            <defs>
              <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C8A84B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#C8A84B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2ECC8A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2ECC8A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#8B90A0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8B90A0', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={formatLKRShort} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Invoiced" stroke="#C8A84B" strokeWidth={2} fill="url(#gRevenue)" />
            <Area type="monotone" dataKey="paid" name="Collected" stroke="#2ECC8A" strokeWidth={2} fill="url(#gPaid)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Clients */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }} className="lg:col-span-2 stat-card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">Top Clients by Revenue</h2>
          <div className="space-y-3">
            {TOP_CLIENTS.map((client, i) => (
              <div key={client.name} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 w-5 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-300">{client.name}</span>
                    <span className="text-sm font-bold text-gold-400">{formatLKR(client.revenue)}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full" style={{ width: `${(client.revenue / TOP_CLIENTS[0].revenue) * 100}%` }} />
                  </div>
                </div>
                <span className={cn('text-xs font-semibold w-12 text-right', client.change > 0 ? 'text-emerald' : 'text-coral')}>
                  {client.change > 0 ? '+' : ''}{client.change}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Aging Buckets */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }} className="stat-card p-6">
          <h2 className="font-display font-semibold text-slate-200 mb-4">Invoice Aging</h2>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={AGING_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="amount">
                {AGING_DATA.map((entry, i) => <Cell key={i} fill={entry.color} stroke="transparent" />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {AGING_DATA.map(item => (
              <div key={item.range} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-slate-400 text-xs">{item.range}</span>
                </div>
                <span className="text-slate-200 text-xs font-medium">{formatLKR(item.amount)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
