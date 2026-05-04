'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Building, Mail, Phone, Globe, CreditCard, Bell, Shield,
  Zap, ChevronRight, Check, Loader2, Upload, MessageSquare,
  Key, Trash2, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Tab = 'profile' | 'notifications' | 'integrations' | 'billing' | 'security';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Business Profile', icon: Building },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Zap },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Shield },
];

// ─── PROFILE TAB ─────────────────────────────────────────────────────
function ProfileTab() {
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      businessName: 'My Business',
      email: 'owner@mybusiness.lk',
      phone: '+94771234567',
      address: 'Colombo, Sri Lanka',
      tinNumber: '',
      defaultLanguage: 'en',
    },
  });

  const onSubmit = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Profile saved successfully!');
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Logo upload */}
      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-4">Business Logo</h3>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 to-yellow-600 flex items-center justify-center text-ink font-bold text-2xl shadow-gold-lg flex-shrink-0">
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            ) : 'M'}
          </div>
          <div>
            <label className="btn-outline-gold px-4 py-2 rounded-xl text-sm cursor-pointer flex items-center gap-2 inline-flex">
              <Upload className="w-4 h-4" />
              Upload Logo
              <input type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] ?? null)} />
            </label>
            <p className="text-xs text-slate-500 mt-2">PNG, JPG up to 2MB. Square recommended.</p>
          </div>
        </div>
      </div>

      {/* Business info */}
      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-4">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: 'businessName', label: 'Business Name', icon: Building, placeholder: 'Your Business Name' },
            { name: 'email', label: 'Email', icon: Mail, placeholder: 'owner@business.lk' },
            { name: 'phone', label: 'Phone / WhatsApp', icon: Phone, placeholder: '+94 77 123 4567' },
            { name: 'tinNumber', label: 'TIN Number', icon: Key, placeholder: 'Tax Identification Number' },
          ].map(({ name, label, icon: Icon, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input {...register(name as never)} placeholder={placeholder} className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-sm" />
              </div>
            </div>
          ))}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Business Address</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-600" />
              <textarea {...register('address')} placeholder="Street, City, Province, Sri Lanka" rows={2} className="input-dark w-full rounded-xl pl-10 pr-4 py-3 text-sm resize-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Default language */}
      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-1">Default Invoice Language</h3>
        <p className="text-xs text-slate-500 mb-4">New invoices will default to this language.</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'en', label: 'English', script: 'Aa' },
            { value: 'si', label: 'Sinhala', script: 'සි' },
            { value: 'ta', label: 'Tamil', script: 'த' },
          ].map(({ value, label, script }) => (
            <label key={value} className="cursor-pointer">
              <input type="radio" {...register('defaultLanguage')} value={value} className="sr-only peer" />
              <div className="peer-checked:border-gold-400/60 peer-checked:bg-gold-400/8 border border-white/8 rounded-xl p-4 text-center transition-smooth hover:border-white/20">
                <div className="text-2xl font-bold text-slate-300 mb-1">{script}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-gold flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
        {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
      </button>
    </form>
  );
}

// ─── NOTIFICATIONS TAB ────────────────────────────────────────────────
function NotificationsTab() {
  const [settings, setSettings] = useState({
    whatsappReminders: true,
    emailReminders: true,
    overdueAlerts: true,
    paymentReceived: true,
    weeklyReport: false,
    day1Reminder: true,
    day7Reminder: true,
    day14Reminder: true,
    day30Reminder: false,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings(s => ({ ...s, [key]: !s[key] }));

  const Switch = ({ k }: { k: keyof typeof settings }) => (
    <div onClick={() => toggle(k)} className={cn('w-10 h-5 rounded-full transition-all relative cursor-pointer flex-shrink-0', settings[k] ? 'bg-gold-400' : 'bg-white/10')}>
      <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', settings[k] ? 'left-5' : 'left-0.5')} />
    </div>
  );

  const Row = ({ label, desc, k }: { label: string; desc: string; k: keyof typeof settings }) => (
    <div className="flex items-start justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
      </div>
      <Switch k={k} />
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-1">Delivery Channels</h3>
        <p className="text-xs text-slate-500 mb-4">Choose how you receive and send notifications</p>
        <Row label="WhatsApp Reminders" desc="Send automatic payment reminders via WhatsApp" k="whatsappReminders" />
        <Row label="Email Reminders" desc="Send automatic payment reminders via email" k="emailReminders" />
        <Row label="Overdue Alerts" desc="Get notified when an invoice becomes overdue" k="overdueAlerts" />
        <Row label="Payment Received" desc="Notify me when a payment is recorded" k="paymentReceived" />
        <Row label="Weekly Report" desc="Receive a weekly revenue summary every Monday" k="weeklyReport" />
      </div>
      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-1">Reminder Schedule</h3>
        <p className="text-xs text-slate-500 mb-4">Automatically remind clients on these overdue milestones</p>
        <Row label="Day 1 overdue" desc="First reminder — friendly tone" k="day1Reminder" />
        <Row label="Day 7 overdue" desc="Second reminder — polite but firm" k="day7Reminder" />
        <Row label="Day 14 overdue" desc="Third reminder — professional and direct" k="day14Reminder" />
        <Row label="Day 30 overdue" desc="Final reminder — formal notice" k="day30Reminder" />
      </div>
      <button onClick={() => toast.success('Notification settings saved!')} className="btn-gold flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
        <Check className="w-4 h-4" /> Save Settings
      </button>
    </div>
  );
}

// ─── INTEGRATIONS TAB ─────────────────────────────────────────────────
function IntegrationsTab() {
  const integrations = [
    {
      name: 'WhatsApp Business API',
      desc: 'Send invoices and reminders directly from your WhatsApp Business number',
      icon: MessageSquare,
      color: 'text-emerald bg-emerald/10',
      connected: false,
      badge: 'Recommended',
    },
    {
      name: 'Twilio',
      desc: 'Fallback WhatsApp messaging via Twilio Sandbox (easier to set up)',
      icon: Phone,
      color: 'text-sapphire bg-sapphire/10',
      connected: true,
      badge: null,
    },
    {
      name: 'SendGrid Email',
      desc: 'Transactional email delivery with beautiful branded templates',
      icon: Mail,
      color: 'text-violet bg-violet/10',
      connected: true,
      badge: null,
    },
    {
      name: 'OpenAI GPT-4o',
      desc: 'Powers Sinhala/Tamil translation, tax hints, and message generation',
      icon: Zap,
      color: 'text-gold-400 bg-gold-400/10',
      connected: true,
      badge: 'Core AI',
    },
  ];

  return (
    <div className="space-y-4">
      {integrations.map(({ name, desc, icon: Icon, color, connected, badge }) => (
        <div key={name} className="stat-card p-5 flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-200 text-sm">{name}</h3>
              {badge && <span className="text-[10px] bg-gold-400/10 text-gold-400 border border-gold-400/20 px-2 py-0.5 rounded-full font-semibold">{badge}</span>}
              {connected && <span className="text-[10px] bg-emerald/10 text-emerald border border-emerald/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1"><Check className="w-2.5 h-2.5" />Connected</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{desc}</p>
          </div>
          <button className={cn('px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth flex-shrink-0', connected ? 'border border-white/8 text-slate-400 hover:text-coral hover:border-coral/20' : 'btn-gold')}>
            {connected ? 'Configure' : 'Connect'}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── BILLING TAB ──────────────────────────────────────────────────────
function BillingTab() {
  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="stat-card p-6 border-gold-400/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold text-gold-400 text-lg">Pro Plan</h3>
              <span className="bg-gold-400/10 text-gold-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold-400/20">ACTIVE</span>
            </div>
            <p className="text-slate-500 text-sm">LKR 2,900 / month · Renews August 1, 2025</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-bold text-slate-100">LKR 2,900</p>
            <p className="text-xs text-slate-500">per month</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Unlimited invoices', 'AI multilingual', 'WhatsApp + Email', 'Analytics'].map(f => (
            <div key={f} className="flex items-center gap-1.5 text-xs text-slate-400">
              <Check className="w-3 h-3 text-emerald" />{f}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3">
          <button className="btn-gold px-4 py-2 rounded-xl text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" /> Upgrade to Business
          </button>
          <button className="btn-outline-gold px-4 py-2 rounded-xl text-sm">Manage Subscription</button>
        </div>
      </div>

      {/* Usage */}
      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-4">This Month's Usage</h3>
        {[
          { label: 'Invoices Created', used: 34, total: 'Unlimited', pct: 0 },
          { label: 'AI Translations', used: 12, total: 500, pct: 2.4 },
          { label: 'WhatsApp Messages', used: 89, total: 1000, pct: 8.9 },
          { label: 'PDF Storage', used: 48, total: '5 GB', pct: 0.96, suffix: 'MB' },
        ].map(({ label, used, total, pct, suffix }) => (
          <div key={label} className="mb-4 last:mb-0">
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-400">{label}</span>
              <span className="text-slate-300 font-medium">{used}{suffix ?? ''} / {total}</span>
            </div>
            {pct > 0 && (
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-gold-400 to-gold-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="stat-card p-6 border-coral/10">
        <h3 className="font-display font-semibold text-coral mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Danger Zone
        </h3>
        <p className="text-sm text-slate-500 mb-4">These actions are irreversible. Please be certain.</p>
        <div className="flex gap-3 flex-wrap">
          <button className="px-4 py-2 rounded-xl border border-coral/20 text-coral text-sm hover:bg-coral/5 transition-smooth flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete All Data
          </button>
          <button className="px-4 py-2 rounded-xl border border-coral/20 text-coral text-sm hover:bg-coral/5 transition-smooth">
            Cancel Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SECURITY TAB ─────────────────────────────────────────────────────
function SecurityTab() {
  const [changingPw, setChangingPw] = useState(false);

  return (
    <div className="space-y-5">
      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-4">Change Password</h3>
        <div className="space-y-3 max-w-sm">
          {['Current password', 'New password', 'Confirm new password'].map(p => (
            <input key={p} type="password" placeholder={p} className="input-dark w-full rounded-xl px-4 py-3 text-sm" />
          ))}
          <button
            onClick={async () => { setChangingPw(true); await new Promise(r => setTimeout(r, 1000)); toast.success('Password updated!'); setChangingPw(false); }}
            disabled={changingPw}
            className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2"
          >
            {changingPw ? <><Loader2 className="w-4 h-4 animate-spin" />Updating...</> : <><Key className="w-4 h-4" />Update Password</>}
          </button>
        </div>
      </div>

      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-1">Two-Factor Authentication</h3>
        <p className="text-xs text-slate-500 mb-4">Add an extra layer of security to your account</p>
        <button className="btn-outline-gold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" /> Enable 2FA
        </button>
      </div>

      <div className="stat-card p-6">
        <h3 className="font-display font-semibold text-slate-200 mb-4">Active Sessions</h3>
        {[
          { device: 'Chrome · Windows 11', location: 'Colombo, LK', current: true, time: 'Active now' },
          { device: 'Safari · iPhone 15', location: 'Colombo, LK', current: false, time: '2 hours ago' },
        ].map(({ device, location, current, time }) => (
          <div key={device} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm font-medium text-slate-200">{device}</p>
              <p className="text-xs text-slate-500">{location} · {time}</p>
            </div>
            {current ? (
              <span className="text-[10px] bg-emerald/10 text-emerald border border-emerald/20 px-2 py-1 rounded-full font-semibold">Current</span>
            ) : (
              <button className="text-xs text-coral hover:underline">Revoke</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN SETTINGS PAGE ───────────────────────────────────────────────
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const CONTENT: Record<Tab, React.ReactNode> = {
    profile: <ProfileTab />,
    notifications: <NotificationsTab />,
    integrations: <IntegrationsTab />,
    billing: <BillingTab />,
    security: <SecurityTab />,
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gradient-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account, integrations, and preferences</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="md:w-52 flex-shrink-0">
          <div className="stat-card p-2 space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'sidebar-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth text-left',
                  activeTab === id ? 'active text-gold-400 bg-gold-400/8' : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium">{label}</span>
                {activeTab === id && <ChevronRight className="ml-auto w-3.5 h-3.5 text-gold-400/60" />}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25 }}
          >
            {CONTENT[activeTab]}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
