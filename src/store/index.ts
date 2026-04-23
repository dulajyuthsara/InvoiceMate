import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, Invoice, Client, AppNotification, InvoiceFilters } from '@/types';

// ─── AUTH STORE ──────────────────────────────────────────────────────
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// ─── UI STORE ────────────────────────────────────────────────────────
interface UIState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
  notifications: AppNotification[];
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
  notifications: [],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        {
          ...n,
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          read: false,
        },
        ...s.notifications.slice(0, 49),
      ],
    })),
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));

// ─── INVOICE STORE ───────────────────────────────────────────────────
interface InvoiceState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  filters: InvoiceFilters;
  totalPages: number;
  totalCount: number;
  summary: { totalLkr: number; paidLkr: number; outstandingLkr: number } | null;
  setInvoices: (invoices: Invoice[], meta?: { total: number; pages: number; summary: { totalLkr: number; paidLkr: number; outstandingLkr: number } }) => void;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  setFilters: (filters: Partial<InvoiceFilters>) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
}

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoices: [],
  selectedInvoice: null,
  filters: { page: 1, limit: 20 },
  totalPages: 1,
  totalCount: 0,
  summary: null,
  setInvoices: (invoices, meta) =>
    set({
      invoices,
      totalPages: meta?.pages ?? 1,
      totalCount: meta?.total ?? invoices.length,
      summary: meta?.summary ?? null,
    }),
  setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } })),
  addInvoice: (invoice) =>
    set((s) => ({ invoices: [invoice, ...s.invoices] })),
  updateInvoice: (id, updates) =>
    set((s) => ({
      invoices: s.invoices.map((inv) =>
        inv.id === id ? { ...inv, ...updates } : inv
      ),
      selectedInvoice:
        s.selectedInvoice?.id === id
          ? { ...s.selectedInvoice, ...updates }
          : s.selectedInvoice,
    })),
  removeInvoice: (id) =>
    set((s) => ({ invoices: s.invoices.filter((inv) => inv.id !== id) })),
}));

// ─── CLIENT STORE ────────────────────────────────────────────────────
interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  setClients: (clients: Client[]) => void;
  setSelectedClient: (client: Client | null) => void;
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  removeClient: (id: string) => void;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  selectedClient: null,
  setClients: (clients) => set({ clients }),
  setSelectedClient: (client) => set({ selectedClient: client }),
  addClient: (client) => set((s) => ({ clients: [client, ...s.clients] })),
  updateClient: (id, updates) =>
    set((s) => ({
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  removeClient: (id) =>
    set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),
}));
