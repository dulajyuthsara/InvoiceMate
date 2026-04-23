'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  Zap, Globe, MessageSquare, BarChart3, Shield, Smartphone,
  Check, ArrowRight, Star, ChevronDown, Languages, FileText,
  TrendingUp, Users, Bell
} from 'lucide-react';

// ─── 3D FLOATING CARD ────────────────────────────────────────────────
function FloatingInvoiceCard() {
  return (
    <motion.div
      animate={{
        y: [0, -16, 0],
        rotateX: [2, -2, 2],
        rotateY: [-3, 3, -3],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-80 perspective-1000"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Shadow */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-48 h-8 bg-gold-400/10 blur-2xl rounded-full" />

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-3d-gold overflow-hidden">
        {/* Header */}
        <div className="bg-ink p-5 flex justify-between items-start">
          <div>
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase mb-1">Invoice</p>
            <p className="font-display font-bold text-white text-lg">INV-2025-042</p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C8A84B, #E8C96A)' }}>
            <Zap className="w-5 h-5 text-ink" />
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex justify-between mb-3">
            <span className="text-xs text-gray-400">Dilshan Perera</span>
            <span className="text-xs font-semibold text-emerald bg-emerald/10 px-2 py-0.5 rounded-full">Paid</span>
          </div>
          <div className="space-y-2 mb-4">
            {['Web Design Service', 'SEO Consultation', 'Hosting Setup'].map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-600">{item}</span>
                <span className="text-gray-800 font-medium">LKR {[45000, 25000, 15000][i].toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold text-gray-800">Total</span>
            <span className="font-bold text-lg" style={{ color: '#C8A84B' }}>LKR 85,000</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald rounded-full" />
          <span className="text-xs text-gray-400">Sent via WhatsApp · July 10, 2025</span>
        </div>
      </div>

      {/* Floating badges */}
      <motion.div
        animate={{ x: [0, 6, 0], y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        className="absolute -right-8 top-8 glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-card"
      >
        <Globe className="w-4 h-4 text-gold-400" />
        <span className="text-xs text-slate-300 font-medium">සිංහල</span>
      </motion.div>

      <motion.div
        animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        className="absolute -left-10 bottom-8 glass rounded-xl px-3 py-2 flex items-center gap-2 shadow-card"
      >
        <MessageSquare className="w-4 h-4 text-emerald" />
        <span className="text-xs text-slate-300 font-medium">WhatsApp</span>
      </motion.div>
    </motion.div>
  );
}

// ─── FEATURE CARD ─────────────────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay: number;
}

function FeatureCard({ icon: Icon, title, description, color, delay }: FeatureCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      className="stat-card p-6 card-3d group"
    >
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color} transition-smooth group-hover:scale-110`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-display font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ─── PRICING CARD ─────────────────────────────────────────────────────
interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  featured?: boolean;
  delay: number;
}

function PricingCard({ name, price, period, features, featured, delay }: PricingCardProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6 }}
      className={`stat-card p-7 card-3d relative ${featured ? 'border-gold-400/30' : ''}`}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold px-4 py-1 rounded-full text-xs font-bold text-ink">
          Most Popular
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">{name}</p>
      <div className="mb-4">
        <span className="font-display text-4xl font-bold text-slate-100">{price}</span>
        <span className="text-slate-500 text-sm ml-1">{period}</span>
      </div>
      <ul className="space-y-2.5 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-slate-400">
            <Check className="w-4 h-4 text-emerald flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/auth/register">
        <button className={`w-full py-3 rounded-xl text-sm font-semibold transition-smooth ${featured ? 'btn-gold' : 'btn-outline-gold'}`}>
          Get Started
        </button>
      </Link>
    </motion.div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <div className="min-h-screen bg-mesh bg-grid text-white overflow-x-hidden">
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 2 + 0.5 + 'px',
              height: Math.random() * 2 + 0.5 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.5 + 0.1,
              animation: `pulse ${Math.random() * 4 + 2}s ease-in-out infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* ─── NAV ───────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
              <Zap className="w-4 h-4 text-ink" />
            </div>
            <span className="font-display font-bold text-lg">
              Invoice<span className="text-gold-gradient">Mate</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#features" className="hover:text-slate-200 transition-smooth">Features</a>
            <a href="#pricing" className="hover:text-slate-200 transition-smooth">Pricing</a>
            <a href="#testimonials" className="hover:text-slate-200 transition-smooth">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <button className="btn-outline-gold px-4 py-2 rounded-xl text-sm">Sign in</button>
            </Link>
            <Link href="/auth/register">
              <button className="btn-gold px-4 py-2 rounded-xl text-sm">Get Started Free</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────── */}
      <motion.section
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative min-h-screen flex items-center pt-20"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
          {/* Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 rounded-full px-4 py-2 mb-6"
            >
              <span className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-gold-400 tracking-wide uppercase">
                Designed for Sri Lankan Businesses
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05] mb-6"
            >
              Invoice in{' '}
              <span className="text-gold-gradient">English,</span>
              <br />
              <span className="text-gold-gradient">සිංහල,</span>{' '}
              or <span className="text-gold-gradient">தமிழ்</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-400 leading-relaxed mb-8 max-w-xl"
            >
              The first invoicing SaaS built for Sri Lankan small businesses. Share PDFs via WhatsApp in seconds.
              AI-powered multilingual invoices with VAT/NBT guidance built in.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Link href="/auth/register">
                <button className="btn-gold flex items-center gap-2 px-6 py-3.5 rounded-xl text-base">
                  Start for free
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="btn-outline-gold flex items-center gap-2 px-6 py-3.5 rounded-xl text-base">
                  Live demo
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex items-center gap-6 text-sm text-slate-500"
            >
              {['No credit card', 'LKR only', 'WhatsApp-first'].map((item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* 3D Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="flex justify-center"
          >
            <FloatingInvoiceCard />
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-600"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.section>

      {/* ─── STATS ─────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '500+', label: 'Businesses', icon: Users },
            { value: '12K+', label: 'Invoices sent', icon: FileText },
            { value: 'LKR 2.4B+', label: 'Invoiced', icon: TrendingUp },
            { value: '4.9★', label: 'App rating', icon: Star },
          ].map(({ value, label, icon: Icon }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <Icon className="w-5 h-5 text-gold-400 mx-auto mb-3" />
              <p className="font-display text-3xl font-bold text-slate-100 mb-1">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FEATURES ──────────────────────────────────── */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-4"
            >
              Everything you need
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl font-bold text-gradient-white mb-4"
            >
              Built for Sri Lankan Reality
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 max-w-xl mx-auto"
            >
              Every feature designed around how Sri Lankan businesses actually work — WhatsApp-first, mobile-first, multilingual.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon={Languages} title="AI Multilingual Invoices" description="GPT-4o translates your invoices to Sinhala and Tamil instantly. Clients receive invoices in their language of choice." color="bg-gold-400/10 text-gold-400" delay={0} />
            <FeatureCard icon={MessageSquare} title="WhatsApp Native Sharing" description="Send invoices directly via WhatsApp Business API. AI generates the perfect message in your client's language." color="bg-emerald/10 text-emerald" delay={0.08} />
            <FeatureCard icon={Shield} title="VAT/NBT Tax Guidance" description="AI analyses your line items and hints at applicable VAT (18%) and NBT (2%) in real time. Always stay compliant." color="bg-violet/10 text-violet" delay={0.16} />
            <FeatureCard icon={BarChart3} title="Revenue Analytics" description="Beautiful charts showing paid vs unpaid trends, top clients, and cash flow forecasts. Know your business at a glance." color="bg-sapphire/10 text-sapphire" delay={0.24} />
            <FeatureCard icon={Smartphone} title="Mobile-First PWA" description="Works perfectly on your phone. Install as an app. Create invoices even when offline — syncs automatically when connected." color="bg-coral/10 text-coral" delay={0.32} />
            <FeatureCard icon={Bell} title="Smart Reminders" description="Automated WhatsApp reminders for unpaid invoices. AI personalises each message. You get paid faster." color="bg-gold-400/10 text-gold-400" delay={0.4} />
          </div>
        </div>
      </section>

      {/* ─── PRICING ───────────────────────────────────── */}
      <section id="pricing" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-gradient-white mb-4">Simple Pricing</h2>
            <p className="text-slate-500">Start free. Upgrade when you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricingCard
              name="Free"
              price="LKR 0"
              period="/month"
              features={['5 invoices/month', 'WhatsApp sharing', 'PDF generation', 'EN only']}
              delay={0}
            />
            <PricingCard
              name="Pro"
              price="LKR 2,900"
              period="/month"
              features={['Unlimited invoices', 'Multilingual AI', 'WhatsApp + Email', 'Tax hints', 'Analytics']}
              featured
              delay={0.1}
            />
            <PricingCard
              name="Business"
              price="LKR 7,500"
              period="/month"
              features={['Everything in Pro', 'Team members (5)', 'API access', 'Custom branding', 'Priority support']}
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="stat-card p-12 card-3d relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold-400/5 to-transparent pointer-events-none" />
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-6 shadow-gold-lg">
              <Zap className="w-8 h-8 text-ink" />
            </div>
            <h2 className="font-display text-3xl font-bold text-gradient-white mb-4">
              Start invoicing in 60 seconds
            </h2>
            <p className="text-slate-500 mb-8">
              Join 500+ Sri Lankan businesses already using InvoiceMate to get paid faster.
            </p>
            <Link href="/auth/register">
              <button className="btn-gold px-8 py-4 rounded-xl text-base inline-flex items-center gap-2">
                Create your free account
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────── */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center">
              <Zap className="w-4 h-4 text-ink" />
            </div>
            <span className="font-display font-bold">Invoice<span className="text-gold-gradient">Mate</span></span>
          </div>
          <p className="text-slate-600 text-sm">
            © 2025 InvoiceMate · Built for Sri Lankan businesses · LKR only
          </p>
          <div className="flex gap-4 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-300 transition-smooth">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-smooth">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-smooth">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
