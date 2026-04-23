'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  Bell,
  Plus,
  ChevronRight,
  Zap,
  LogOut,
  Globe,
} from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null },
  { href: '/invoices', icon: FileText, label: 'Invoices', badge: null },
  { href: '/clients', icon: Users, label: 'Clients', badge: null },
  { href: '/analytics', icon: BarChart3, label: 'Analytics', badge: null },
  { href: '/settings', icon: Settings, label: 'Settings', badge: null },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, notifications } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="flex h-screen bg-mesh bg-grid overflow-hidden">
      {/* ─── SIDEBAR ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {(sidebarOpen || !isMobile) && (
          <>
            {/* Mobile overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleSidebar}
                className="fixed inset-0 z-30 modal-overlay md:hidden"
              />
            )}

            <motion.aside
              initial={isMobile ? { x: -280 } : false}
              animate={{ x: 0 }}
              exit={isMobile ? { x: -280 } : undefined}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'relative z-40 flex flex-col',
                'bg-surface-1 border-r border-white/5',
                'w-64 flex-shrink-0',
                isMobile && 'fixed top-0 left-0 bottom-0'
              )}
            >
              {/* Sidebar glow effect */}
              <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-gold-400/20 to-transparent" />

              {/* Logo */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                    <Zap className="w-5 h-5 text-ink" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald rounded-full border-2 border-surface-1" />
                </div>
                <div>
                  <h1 className="font-display font-bold text-lg text-gradient-white leading-none">
                    Invoice<span className="text-gold-gradient">Mate</span>
                  </h1>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono tracking-widest uppercase">
                    Sri Lanka
                  </p>
                </div>
                {isMobile && (
                  <button onClick={toggleSidebar} className="ml-auto text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Quick create */}
              <div className="px-4 py-3">
                <Link href="/invoices/new">
                  <button className="btn-gold w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm">
                    <Plus className="w-4 h-4" />
                    New Invoice
                  </button>
                </Link>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
                <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Menu
                </p>
                {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <Link key={href} href={href}>
                      <div
                        className={cn(
                          'sidebar-item flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer',
                          'text-slate-400 hover:text-slate-200 transition-smooth',
                          active && 'active text-gold-400 bg-gold-400/8'
                        )}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span className="font-body text-sm font-medium">{label}</span>
                        {badge && (
                          <span className="ml-auto bg-coral/20 text-coral text-[10px] font-bold px-2 py-0.5 rounded-full border border-coral/30">
                            {badge}
                          </span>
                        )}
                        {active && (
                          <ChevronRight className="ml-auto w-3 h-3 text-gold-400/60" />
                        )}
                      </div>
                    </Link>
                  );
                })}

                <div className="pt-4">
                  <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    Languages
                  </p>
                  <div className="px-3 py-2 flex gap-2">
                    {['EN', 'සි', 'த'].map((lang, i) => (
                      <button
                        key={i}
                        className={cn(
                          'flex-1 py-1.5 rounded-lg text-xs font-semibold transition-smooth',
                          i === 0
                            ? 'bg-gold-400/10 text-gold-400 border border-gold-400/20'
                            : 'bg-white/3 text-slate-500 border border-white/5 hover:text-slate-300'
                        )}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              </nav>

              {/* User profile */}
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-3 rounded-xl glass transition-smooth hover:border-gold-400/20 cursor-pointer">
                  <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center text-ink font-bold text-sm flex-shrink-0">
                    {user?.businessName?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">
                      {user?.businessName ?? 'My Business'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{user?.email ?? ''}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="text-slate-500 hover:text-coral transition-smooth"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT ────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5 glass-dark flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="text-slate-400 hover:text-slate-200 transition-smooth md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex text-slate-500 hover:text-slate-300 transition-smooth"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm text-slate-400">
            <Globe className="w-4 h-4" />
            <span>LKR</span>
            <span className="text-white/20">·</span>
            <span className="text-gold-400 font-medium capitalize">
              {pathname.split('/')[1] || 'dashboard'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-xl glass hover:border-gold-400/20 transition-smooth">
              <Bell className="w-5 h-5 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-coral rounded-full text-[10px] font-bold text-white flex items-center justify-center border-2 border-ink">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Online status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass text-xs text-emerald font-medium">
              <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
              Online
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
