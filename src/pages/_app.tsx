import type { AppProps } from 'next/app';
import Head from 'next/head';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { SyncEngine } from '@/lib/offline';
import '@/styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

let syncEngine: SyncEngine | null = null;

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && !syncEngine) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      syncEngine = new SyncEngine(apiUrl);
      syncEngine.init();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <title>InvoiceMate — Sri Lanka&apos;s Smart Invoicing App</title>
        <meta name="description" content="Create multilingual invoices in English, Sinhala and Tamil. Share via WhatsApp. Track payments. Built for Sri Lankan businesses." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0D0F14" />
        <meta name="application-name" content="InvoiceMate" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="InvoiceMate" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <meta property="og:title" content="InvoiceMate — Sri Lanka" />
        <meta property="og:description" content="Multilingual invoicing built for Sri Lankan businesses. English, Sinhala, Tamil." />
        <meta property="og:type" content="website" />
      </Head>

      <Component {...pageProps} />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1E2233',
            color: '#E8EAF0',
            border: '1px solid rgba(200,168,75,0.2)',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: "'DM Sans', sans-serif",
          },
          success: {
            iconTheme: { primary: '#2ECC8A', secondary: '#1E2233' },
          },
          error: {
            iconTheme: { primary: '#E8624A', secondary: '#1E2233' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
