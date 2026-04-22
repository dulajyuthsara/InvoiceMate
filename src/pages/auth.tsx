'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Zap, Mail, Lock, Eye, EyeOff, Building, Phone, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── SCHEMAS ─────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Minimum 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

// ─── INPUT FIELD ──────────────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  error?: string;
  rightElement?: React.ReactNode;
  [key: string]: unknown;
}

function InputField({ label, icon: Icon, type = 'text', placeholder, error, rightElement, ...props }: InputFieldProps) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
        <input
          type={type}
          placeholder={placeholder}
          className="input-dark w-full rounded-xl pl-10 pr-12 py-3 text-sm"
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-coral flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ─── AUTH SHELL ───────────────────────────────────────────────────────
function AuthShell({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="min-h-screen bg-mesh bg-grid flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gold-400/4 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold-lg">
            <Zap className="w-7 h-7 text-ink" />
          </div>
          <h1 className="font-display text-2xl font-bold text-gradient-white">{title}</h1>
          <p className="text-slate-500 text-sm mt-2">{subtitle}</p>
        </div>

        {/* Card */}
        <div className="stat-card p-8 card-3d">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────
export function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500)); // Simulate API call
      console.log('Login:', data);
      toast.success('Welcome back!');
      window.location.href = '/dashboard';
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your InvoiceMate account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <InputField
          label="Email"
          icon={Mail}
          type="email"
          placeholder="you@business.lk"
          error={errors.email?.message}
          {...register('email')}
        />
        <InputField
          label="Password"
          icon={Lock}
          type={showPw ? 'text' : 'password'}
          placeholder="••••••••"
          error={errors.password?.message}
          rightElement={
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-600 hover:text-slate-400 transition-smooth">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex justify-end">
          <a href="#" className="text-xs text-gold-400 hover:text-gold-light transition-smooth">Forgot password?</a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
          ) : (
            <>Sign in <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <div className="relative my-4">
          <div className="divider-gold" />
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-surface-1 px-3 text-xs text-slate-600">or continue with</span>
        </div>

        <button
          type="button"
          className="w-full py-3 rounded-xl border border-white/8 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/3 transition-smooth flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-gold-400 hover:text-gold-light transition-smooth font-medium">
          Create one free
        </Link>
      </p>
    </AuthShell>
  );
}

// ─── REGISTER PAGE ────────────────────────────────────────────────────
export function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 2000));
      console.log('Register:', data);
      toast.success('Account created! Welcome to InvoiceMate 🎉');
      window.location.href = '/dashboard';
    } catch {
      toast.error('Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Start invoicing today" subtitle="Create your free InvoiceMate account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Business Name"
          icon={Building}
          placeholder="Your Business Name"
          error={errors.businessName?.message}
          {...register('businessName')}
        />
        <InputField
          label="Email"
          icon={Mail}
          type="email"
          placeholder="you@business.lk"
          error={errors.email?.message}
          {...register('email')}
        />
        <InputField
          label="WhatsApp / Phone (optional)"
          icon={Phone}
          placeholder="+94 77 123 4567"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <InputField
          label="Password"
          icon={Lock}
          type={showPw ? 'text' : 'password'}
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          rightElement={
            <button type="button" onClick={() => setShowPw(!showPw)} className="text-slate-600 hover:text-slate-400 transition-smooth">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          {...register('password')}
        />
        <InputField
          label="Confirm Password"
          icon={Lock}
          type="password"
          placeholder="Repeat password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
          ) : (
            <>Create free account <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <p className="text-xs text-slate-600 text-center">
          By creating an account you agree to our{' '}
          <a href="#" className="text-gold-400">Terms of Service</a> and{' '}
          <a href="#" className="text-gold-400">Privacy Policy</a>
        </p>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-gold-400 hover:text-gold-light transition-smooth font-medium">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

export default LoginPage;
