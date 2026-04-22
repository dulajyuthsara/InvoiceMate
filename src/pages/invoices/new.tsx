'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Trash2, Sparkles, Globe, Send, Download,
  ChevronDown, Info, AlertCircle, CheckCircle, X,
  Loader2, Languages, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, calculateLineItemTotals, calculateInvoiceTotals, formatLKR, getLanguageLabel } from '@/lib/utils';
import { Language, TaxHint } from '@/types';

// ─── SCHEMA ───────────────────────────────────────────────────────────
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(0.01, 'Must be > 0'),
  rateLkr: z.number().min(0, 'Must be ≥ 0'),
  vatApplicable: z.boolean(),
  nbtApplicable: z.boolean(),
});

const invoiceSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1, 'Client name required'),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  language: z.enum(['en', 'si', 'ta']),
  dueDate: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Add at least one item'),
  notes: z.string().optional(),
  vatEnabled: z.boolean(),
  nbtEnabled: z.boolean(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

// ─── LANGUAGE SELECTOR ────────────────────────────────────────────────
interface LanguageSelectorProps {
  value: Language;
  onChange: (lang: Language) => void;
}

function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const langs: Language[] = ['en', 'si', 'ta'];
  return (
    <div className="flex gap-1 p-1 glass rounded-xl">
      {langs.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-smooth',
            value === lang
              ? 'bg-gold-400/10 text-gold-400 border border-gold-400/20'
              : 'text-slate-500 hover:text-slate-300'
          )}
        >
          {getLanguageLabel(lang)}
        </button>
      ))}
    </div>
  );
}

// ─── TAX HINT BADGE ───────────────────────────────────────────────────
function TaxHintBadge({ hint }: { hint: TaxHint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold border transition-smooth',
          hint.vatLikely || hint.nbtLikely
            ? 'bg-gold-400/10 text-gold-400 border-gold-400/20'
            : 'bg-white/5 text-slate-500 border-white/10'
        )}
      >
        <Sparkles className="w-3 h-3" />
        Tax hint
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            className="absolute z-20 bottom-full mb-2 right-0 w-64 glass rounded-xl p-3 border border-gold-400/20 shadow-3d-gold"
          >
            <p className="text-xs text-slate-300 leading-relaxed">{hint.hint}</p>
            <div className="flex gap-2 mt-2">
              {hint.vatLikely && (
                <span className="text-[10px] bg-gold-400/10 text-gold-400 px-2 py-0.5 rounded-full border border-gold-400/20">
                  VAT 18%
                </span>
              )}
              {hint.nbtLikely && (
                <span className="text-[10px] bg-violet/10 text-violet px-2 py-0.5 rounded-full border border-violet/20">
                  NBT 2%
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-600 mt-2">Consult your tax advisor for guidance.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── LINE ITEM ROW ────────────────────────────────────────────────────
interface LineItemRowProps {
  index: number;
  register: ReturnType<typeof useForm<InvoiceFormData>>['register'];
  watch: ReturnType<typeof useForm<InvoiceFormData>>['watch'];
  setValue: ReturnType<typeof useForm<InvoiceFormData>>['setValue'];
  remove: (index: number) => void;
  hints: Record<number, TaxHint>;
}

function LineItemRow({ index, register, watch, setValue, remove, hints }: LineItemRowProps) {
  const qty = watch(`lineItems.${index}.quantity`) || 0;
  const rate = watch(`lineItems.${index}.rateLkr`) || 0;
  const vat = watch(`lineItems.${index}.vatApplicable`);
  const nbt = watch(`lineItems.${index}.nbtApplicable`);
  const totals = calculateLineItemTotals(qty, rate, vat, nbt);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="glass rounded-xl p-4 border border-white/5"
    >
      <div className="grid grid-cols-12 gap-3 items-start">
        {/* Description */}
        <div className="col-span-12 md:col-span-5">
          <input
            {...register(`lineItems.${index}.description`)}
            placeholder="Service or product description..."
            className="input-dark w-full rounded-xl px-3 py-2.5 text-sm"
          />
        </div>

        {/* Quantity */}
        <div className="col-span-4 md:col-span-2">
          <input
            type="number"
            {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })}
            placeholder="Qty"
            step="0.01"
            className="input-dark w-full rounded-xl px-3 py-2.5 text-sm"
          />
        </div>

        {/* Rate */}
        <div className="col-span-4 md:col-span-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">LKR</span>
            <input
              type="number"
              {...register(`lineItems.${index}.rateLkr`, { valueAsNumber: true })}
              placeholder="0.00"
              step="0.01"
              className="input-dark w-full rounded-xl pl-11 pr-3 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Total */}
        <div className="col-span-4 md:col-span-2">
          <div className="bg-white/3 rounded-xl px-3 py-2.5 text-sm font-medium text-gold-400 text-right">
            {formatLKR(totals.totalLkr)}
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-12 md:col-span-1 flex items-center justify-end">
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-slate-600 hover:text-coral transition-smooth p-1.5 rounded-lg hover:bg-coral/10"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tax toggles */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setValue(`lineItems.${index}.vatApplicable`, !vat)}
            className={cn(
              'w-8 h-4 rounded-full transition-all relative cursor-pointer',
              vat ? 'bg-gold-400' : 'bg-white/10'
            )}
          >
            <div className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all', vat ? 'left-4' : 'left-0.5')} />
          </div>
          <span className="text-xs text-slate-400">VAT 18%</span>
          {vat && <span className="text-xs text-gold-400">+{formatLKR(totals.vatLkr)}</span>}
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setValue(`lineItems.${index}.nbtApplicable`, !nbt)}
            className={cn(
              'w-8 h-4 rounded-full transition-all relative cursor-pointer',
              nbt ? 'bg-violet' : 'bg-white/10'
            )}
          >
            <div className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all', nbt ? 'left-4' : 'left-0.5')} />
          </div>
          <span className="text-xs text-slate-400">NBT 2%</span>
          {nbt && <span className="text-xs text-violet">+{formatLKR(totals.nbtLkr)}</span>}
        </label>

        <div className="ml-auto">
          {hints[index] && <TaxHintBadge hint={hints[index]} />}
        </div>
      </div>
    </motion.div>
  );
}

// ─── INVOICE PREVIEW (PDF Style) ─────────────────────────────────────
function InvoicePreview({ data }: { data: InvoiceFormData }) {
  const allTotals = data.lineItems.map(item =>
    calculateLineItemTotals(item.quantity, item.rateLkr, item.vatApplicable, item.nbtApplicable)
  );
  const grand = calculateInvoiceTotals(allTotals);

  return (
    <div className="pdf-preview shadow-3d p-8" id="invoice-preview">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-sans">INVOICE</h2>
          <p className="text-gray-400 text-sm mt-1">INV-2025-XXX</p>
          <p className="text-gray-400 text-xs">{new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C8A84B, #E8C96A)' }}>
          <span className="text-white font-bold text-xl">IM</span>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Bill To</p>
        <p className="font-bold text-gray-800">{data.clientName || 'Client Name'}</p>
        {data.clientEmail && <p className="text-sm text-gray-500">{data.clientEmail}</p>}
        {data.clientPhone && <p className="text-sm text-gray-500">{data.clientPhone}</p>}
      </div>

      {/* Line Items */}
      <table className="w-full mb-6" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
            <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 pb-3">Description</th>
            <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 pb-3">Qty</th>
            <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 pb-3">Rate</th>
            <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-gray-400 pb-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item, i) => {
            const t = allTotals[i];
            return (
              <tr key={i} style={{ borderBottom: '1px solid #f8f8f8' }}>
                <td className="py-3 text-sm text-gray-700">{item.description || 'Item description'}</td>
                <td className="py-3 text-sm text-gray-500 text-right">{item.quantity}</td>
                <td className="py-3 text-sm text-gray-500 text-right">{formatLKR(item.rateLkr)}</td>
                <td className="py-3 text-sm font-medium text-gray-800 text-right">{formatLKR(t?.totalLkr ?? 0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Totals */}
      <div className="ml-auto w-56 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span><span>{formatLKR(grand.subtotalLkr)}</span>
        </div>
        {grand.vatLkr > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>VAT (18%)</span><span>{formatLKR(grand.vatLkr)}</span>
          </div>
        )}
        {grand.nbtLkr > 0 && (
          <div className="flex justify-between text-sm text-gray-500">
            <span>NBT (2%)</span><span>{formatLKR(grand.nbtLkr)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200 text-base">
          <span>Total (LKR)</span><span style={{ color: '#C8A84B' }}>{formatLKR(grand.totalLkr)}</span>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-600">{data.notes}</p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
        Generated by InvoiceMate · invoicemate.lk · LKR Only
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────
export default function NewInvoicePage() {
  const [showPreview, setShowPreview] = useState(false);
  const [hints, setHints] = useState<Record<number, TaxHint>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      language: 'en',
      vatEnabled: false,
      nbtEnabled: false,
      lineItems: [{ description: '', quantity: 1, rateLkr: 0, vatApplicable: false, nbtApplicable: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  const watchedItems = watch('lineItems');
  const language = watch('language');

  // Compute totals live
  const allTotals = watchedItems.map(item =>
    calculateLineItemTotals(item.quantity || 0, item.rateLkr || 0, item.vatApplicable, item.nbtApplicable)
  );
  const grand = calculateInvoiceTotals(allTotals);

  // AI: get tax hints (debounced simulation)
  const getTaxHints = useCallback(async (index: number, description: string, amount: number) => {
    if (!description || description.length < 3) return;
    // In production: call aiApi.taxHints()
    // Simulating AI response:
    const fakeHints: TaxHint[] = [
      { description, vatLikely: amount > 10000, nbtLikely: true, confidence: 'high', hint: `This service likely attracts ${amount > 10000 ? 'VAT (18%) and ' : ''}NBT (2%) under Sri Lanka tax law. Review with your accountant.` },
    ];
    setHints(prev => ({ ...prev, [index]: fakeHints[0] }));
  }, []);

  useEffect(() => {
    watchedItems.forEach((item, i) => {
      const timer = setTimeout(() => {
        getTaxHints(i, item.description, item.rateLkr * item.quantity);
      }, 800);
      return () => clearTimeout(timer);
    });
  }, [watchedItems, getTaxHints]);

  const handleAITranslate = async () => {
    if (language === 'en') return toast.error('Select Sinhala or Tamil first');
    setIsTranslating(true);
    await new Promise(r => setTimeout(r, 2000)); // Simulate API
    toast.success(`Invoice translated to ${getLanguageLabel(language)}!`);
    setIsTranslating(false);
  };

  const handleGenerateMessage = async () => {
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('WhatsApp message generated!');
    setIsGenerating(false);
  };

  const onSubmit = async (data: InvoiceFormData) => {
    console.log('Invoice data:', data);
    toast.success('Invoice created successfully!');
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="font-display text-2xl font-bold text-gradient-white">New Invoice</h1>
          <p className="text-slate-500 text-sm mt-1">Create multilingual invoice with AI assistance</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={cn(
              'btn-outline-gold flex items-center gap-2 px-4 py-2 rounded-xl text-sm',
              showPreview && 'bg-gold-400/8'
            )}
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', showPreview && 'rotate-180')} />
            {showPreview ? 'Hide' : 'Preview'}
          </button>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* ─── LEFT: FORM ──────────────────────────────── */}
          <div className="xl:col-span-3 space-y-5">
            {/* Client Info */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stat-card p-5"
            >
              <h3 className="font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-sapphire/20 flex items-center justify-center">
                  <span className="text-sapphire text-xs font-bold">1</span>
                </div>
                Client Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <input
                    {...register('clientName')}
                    placeholder="Client / Business Name *"
                    className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                  />
                  {errors.clientName && (
                    <p className="text-coral text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.clientName.message}
                    </p>
                  )}
                </div>
                <input
                  {...register('clientEmail')}
                  type="email"
                  placeholder="Email address"
                  className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                />
                <input
                  {...register('clientPhone')}
                  placeholder="WhatsApp / Phone (+94...)"
                  className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                />
                <input
                  {...register('dueDate')}
                  type="date"
                  className="input-dark w-full rounded-xl px-4 py-3 text-sm"
                />
              </div>
            </motion.div>

            {/* Language & Settings */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="stat-card p-5"
            >
              <h3 className="font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-violet/20 flex items-center justify-center">
                  <span className="text-violet text-xs font-bold">2</span>
                </div>
                Language & Settings
              </h3>
              <LanguageSelector value={language} onChange={(lang) => setValue('language', lang)} />
              {language !== 'en' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3"
                >
                  <button
                    type="button"
                    onClick={handleAITranslate}
                    disabled={isTranslating}
                    className="btn-gold w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
                  >
                    {isTranslating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Translating...</>
                    ) : (
                      <><Languages className="w-4 h-4" /> AI Translate to {getLanguageLabel(language)}</>
                    )}
                  </button>
                  <p className="text-xs text-slate-600 mt-2 text-center">
                    Powered by GPT-4o · Translation cached after first generation
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Line Items */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stat-card p-5"
            >
              <h3 className="font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gold-400/20 flex items-center justify-center">
                  <span className="text-gold-400 text-xs font-bold">3</span>
                </div>
                Line Items
              </h3>

              <AnimatePresence>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <LineItemRow
                      key={field.id}
                      index={index}
                      register={register}
                      watch={watch}
                      setValue={setValue}
                      remove={remove}
                      hints={hints}
                    />
                  ))}
                </div>
              </AnimatePresence>

              <button
                type="button"
                onClick={() => append({ description: '', quantity: 1, rateLkr: 0, vatApplicable: false, nbtApplicable: false })}
                className="mt-3 w-full py-3 rounded-xl border border-dashed border-white/10 text-slate-500 hover:text-slate-300 hover:border-gold-400/20 transition-smooth flex items-center justify-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Line Item
              </button>
            </motion.div>

            {/* Notes */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="stat-card p-5"
            >
              <h3 className="font-display font-semibold text-slate-200 mb-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald/20 flex items-center justify-center">
                  <span className="text-emerald text-xs font-bold">4</span>
                </div>
                Notes
              </h3>
              <textarea
                {...register('notes')}
                placeholder="Payment terms, bank details, thank you message..."
                rows={3}
                className="input-dark w-full rounded-xl px-4 py-3 text-sm resize-none"
              />
            </motion.div>
          </div>

          {/* ─── RIGHT: SUMMARY & ACTIONS ────────────────── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Totals */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="stat-card p-5 card-3d"
            >
              <h3 className="font-display font-semibold text-slate-200 mb-4">Invoice Total</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-slate-300 font-mono">{formatLKR(grand.subtotalLkr)}</span>
                </div>
                {grand.vatLkr > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      VAT <span className="text-xs text-gold-400">(18%)</span>
                    </span>
                    <span className="text-gold-400 font-mono">{formatLKR(grand.vatLkr)}</span>
                  </div>
                )}
                {grand.nbtLkr > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      NBT <span className="text-xs text-violet">(2%)</span>
                    </span>
                    <span className="text-violet font-mono">{formatLKR(grand.nbtLkr)}</span>
                  </div>
                )}
                <div className="divider-gold" />
                <div className="flex justify-between">
                  <span className="font-display font-bold text-slate-200">Total</span>
                  <span className="font-display font-bold text-xl text-gold-gradient">{formatLKR(grand.totalLkr)}</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-gold-400/5 border border-gold-400/10 flex items-start gap-2">
                <Info className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500">
                  All amounts in Sri Lankan Rupees (LKR). VAT rate 18%, NBT rate 2%.
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.38 }}
              className="stat-card p-5 space-y-3"
            >
              <h3 className="font-display font-semibold text-slate-200 mb-4">Actions</h3>

              <button
                type="submit"
                className="btn-gold w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Save Invoice
              </button>

              <button
                type="button"
                onClick={handleGenerateMessage}
                disabled={isGenerating}
                className="btn-outline-gold w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                AI Generate Message
              </button>

              <button
                type="button"
                className="w-full py-3 rounded-xl border border-white/8 text-slate-400 hover:text-slate-200 text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-white/3"
              >
                <Send className="w-4 h-4" />
                Send via WhatsApp
              </button>

              <button
                type="button"
                className="w-full py-3 rounded-xl border border-white/8 text-slate-400 hover:text-slate-200 text-sm flex items-center justify-center gap-2 transition-smooth hover:bg-white/3"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
            </motion.div>

            {/* AI Tax Disclaimer */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.44 }}
              className="p-4 rounded-xl border border-gold-400/10 bg-gold-400/3"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-gold-400 mb-1">AI Tax Hints Active</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    VAT/NBT hints are generated by AI based on your line item descriptions.
                    Always verify with a registered tax professional.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </form>

      {/* Live Preview */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8"
          >
            <h2 className="font-display font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-gold-400" />
              Live PDF Preview
            </h2>
            <div className="max-w-2xl mx-auto shadow-3d-gold rounded-xl overflow-hidden">
              <InvoicePreview data={watch()} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
