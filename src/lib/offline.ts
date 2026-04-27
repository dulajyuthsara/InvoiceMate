import Dexie, { type Table } from 'dexie';
import { OfflineInvoice, Client } from '@/types';

// ─── OFFLINE DB SCHEMA ───────────────────────────────────────────────
interface OfflineClient extends Client {
  syncStatus: 'pending' | 'synced' | 'error';
}

class InvoiceMateDB extends Dexie {
  offlineInvoices!: Table<OfflineInvoice>;
  offlineClients!: Table<OfflineClient>;
  syncQueue!: Table<{ id: string; type: string; payload: unknown; createdAt: string; retries: number }>;

  constructor() {
    super('InvoiceMateDB');
    this.version(1).stores({
      offlineInvoices: '++localId, syncStatus, createdAt',
      offlineClients: '++id, syncStatus, name',
      syncQueue: '++id, type, createdAt',
    });
  }
}

export const db = new InvoiceMateDB();

// ─── OFFLINE INVOICE SERVICE ─────────────────────────────────────────
export const offlineInvoiceService = {
  // Save invoice locally when offline
  async saveInvoice(invoice: Omit<OfflineInvoice, 'localId' | 'syncStatus' | 'createdAt'>): Promise<string> {
    const localId = crypto.randomUUID();
    await db.offlineInvoices.add({
      ...invoice,
      localId,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
    });
    // Queue for sync
    await db.syncQueue.add({
      id: crypto.randomUUID(),
      type: 'CREATE_INVOICE',
      payload: { localId, invoice },
      createdAt: new Date().toISOString(),
      retries: 0,
    });
    return localId;
  },

  async getAll(): Promise<OfflineInvoice[]> {
    return db.offlineInvoices.orderBy('createdAt').reverse().toArray();
  },

  async getPending(): Promise<OfflineInvoice[]> {
    return db.offlineInvoices.where('syncStatus').equals('pending').toArray();
  },

  async markSynced(localId: string): Promise<void> {
    await db.offlineInvoices.where('localId').equals(localId).modify({ syncStatus: 'synced' });
  },

  async markError(localId: string): Promise<void> {
    await db.offlineInvoices.where('localId').equals(localId).modify({ syncStatus: 'error' });
  },
};

// ─── SYNC ENGINE ─────────────────────────────────────────────────────
export class SyncEngine {
  private isSyncing = false;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl;
  }

  // Start listening for network reconnection
  init() {
    window.addEventListener('online', () => {
      console.log('[SyncEngine] Network restored — starting sync');
      this.sync();
    });

    // Also try sync on startup if online
    if (navigator.onLine) {
      this.sync();
    }
  }

  async sync(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing) return { synced: 0, failed: 0 };
    this.isSyncing = true;

    let synced = 0;
    let failed = 0;

    try {
      const pendingInvoices = await offlineInvoiceService.getPending();

      for (const invoice of pendingInvoices) {
        try {
          const token = localStorage.getItem('access_token');
          const response = await fetch(`${this.apiBaseUrl}/invoices`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              clientId: invoice.clientId,
              language: invoice.language,
              dueDate: invoice.dueDate,
              lineItems: invoice.lineItems,
              notes: invoice.notes,
              vatEnabled: invoice.vatEnabled,
              nbtEnabled: invoice.nbtEnabled,
            }),
          });

          if (response.ok) {
            await offlineInvoiceService.markSynced(invoice.localId);
            synced++;
          } else {
            await offlineInvoiceService.markError(invoice.localId);
            failed++;
          }
        } catch {
          await offlineInvoiceService.markError(invoice.localId);
          failed++;
        }
      }
    } finally {
      this.isSyncing = false;
    }

    console.log(`[SyncEngine] Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  }
}

// ─── HOOK: useOfflineStatus ───────────────────────────────────────────
import { useState, useEffect } from 'react';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll pending count
    const interval = setInterval(async () => {
      const pending = await offlineInvoiceService.getPending();
      setPendingCount(pending.length);
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isOnline, pendingCount };
}
