import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle token refresh + errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── AUTH API ───────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    businessName: string;
    phone?: string;
  }) => api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get('/auth/me'),

  updateProfile: (data: Partial<{ businessName: string; phone: string; defaultLanguage: string; tinNumber: string; address: string }>) =>
    api.patch('/auth/profile', data),
};

// ─── INVOICES API ───────────────────────────────────────────────────
export const invoicesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/invoices', { params }),

  get: (id: string) => api.get(`/invoices/${id}`),

  create: (data: unknown) => api.post('/invoices', data),

  update: (id: string, data: unknown) => api.patch(`/invoices/${id}`, data),

  delete: (id: string) => api.delete(`/invoices/${id}`),

  send: (id: string, data: { channels: string[]; message?: string }) =>
    api.post(`/invoices/${id}/send`, data),

  translate: (id: string, data: { targetLanguage: string }) =>
    api.post(`/invoices/${id}/translate`, data),

  markPaid: (id: string, paymentData: unknown) =>
    api.post(`/invoices/${id}/payments`, paymentData),

  void: (id: string) => api.post(`/invoices/${id}/void`),

  getPdf: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// ─── CLIENTS API ────────────────────────────────────────────────────
export const clientsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/clients', { params }),

  get: (id: string) => api.get(`/clients/${id}`),

  create: (data: unknown) => api.post('/clients', data),

  update: (id: string, data: unknown) => api.patch(`/clients/${id}`, data),

  delete: (id: string) => api.delete(`/clients/${id}`),

  invoices: (id: string) => api.get(`/clients/${id}/invoices`),
};

// ─── AI API ─────────────────────────────────────────────────────────
export const aiApi = {
  taxHints: (lineItems: Array<{ description: string; amountLkr: number }>) =>
    api.post('/ai/tax-hints', { lineItems }),

  generateMessage: (data: {
    invoiceId: string;
    channel: string;
    language: string;
    tone: string;
  }) => api.post('/ai/message', data),

  translate: (data: { text: string | object; targetLanguage: string }) =>
    api.post('/ai/translate', data),
};

// ─── ANALYTICS API ──────────────────────────────────────────────────
export const analyticsApi = {
  summary: (params?: { period?: string; fromDate?: string; toDate?: string }) =>
    api.get('/analytics/summary', { params }),

  revenue: (params?: Record<string, unknown>) =>
    api.get('/analytics/revenue', { params }),

  clients: () => api.get('/analytics/clients'),
};
