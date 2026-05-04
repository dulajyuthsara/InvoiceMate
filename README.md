# InvoiceMate 🧾
### Sri Lanka's First AI-Powered Multilingual Invoicing SaaS

> Create invoices in English, සිංහල, and தமிழ் · Share via WhatsApp · Track payments · LKR only

---

## 🏗 Architecture Overview

```
invoicemate/
├── src/                    # Next.js 14 Frontend (PWA)
│   ├── components/
│   │   ├── layout/         # AppLayout, Sidebar, Header
│   │   ├── ui/             # Reusable UI components
│   │   ├── dashboard/      # Dashboard widgets
│   │   ├── invoice/        # Invoice builder, preview, PDF
│   │   └── clients/        # Client management
│   ├── pages/              # Next.js pages
│   ├── lib/                # API client, utils, offline engine
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript interfaces
│   └── styles/             # Global CSS (3D effects, animations)
├── backend/                # NestJS Backend
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/       # JWT auth, user management
│   │   │   ├── invoices/   # Invoice CRUD + PDF generation
│   │   │   ├── clients/    # Client management
│   │   │   ├── payments/   # Payment tracking
│   │   │   ├── ai/         # GPT-4o: translation, hints, messages
│   │   │   ├── notifications/ # WhatsApp + email delivery
│   │   │   └── analytics/  # Revenue analytics
│   │   └── common/         # Guards, interceptors, filters
│   └── prisma/
│       └── schema.sql      # PostgreSQL schema
├── docker-compose.yml      # Local development
├── Dockerfile.frontend     # Frontend container
└── backend/Dockerfile      # Backend container
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- OpenAI API key
- Twilio account (WhatsApp)
- SendGrid account (Email)

### 1. Clone and setup

```bash
git clone https://github.com/your-org/invoicemate.git
cd invoicemate
```

### 2. Configure environment

```bash
# Frontend
cp .env.local.example .env.local
# Edit .env.local with your values

# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

### 3. Start with Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3001
- Frontend on port 3000

### 4. Manual setup (without Docker)

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Start PostgreSQL and Redis (via Docker or locally)
docker run -d -p 5432:5432 -e POSTGRES_USER=invoicemate -e POSTGRES_PASSWORD=localpassword -e POSTGRES_DB=invoicemate_db postgres:16-alpine
docker run -d -p 6379:6379 redis:7-alpine

# Apply database schema
psql -U invoicemate -d invoicemate_db -h localhost -f backend/prisma/schema.sql

# Start backend (in backend/ directory)
cd backend && npm run start:dev

# Start frontend (in root directory)
npm run dev
```

Open http://localhost:3000

---

## 🔑 Key Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | GPT-4o for AI features |
| `PINECONE_API_KEY` | Vector DB for semantic search |
| `TWILIO_ACCOUNT_SID` | WhatsApp message delivery |
| `SENDGRID_API_KEY` | Email delivery |
| `AWS_ACCESS_KEY_ID` | S3 PDF storage |
| `JWT_SECRET` | Min 64 chars, change in production! |

---

## 🛠 Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| Next.js 14 | React framework, SSR, App Router |
| TypeScript | Type safety |
| Tailwind CSS | Utility-first styling |
| Framer Motion | 3D animations and transitions |
| Zustand | Global state management |
| TanStack Query | Server state, caching |
| React Hook Form + Zod | Form validation |
| Recharts | Analytics charts |
| Dexie.js | IndexedDB for offline support |
| next-pwa | Progressive Web App |

### Backend
| Tech | Purpose |
|------|---------|
| NestJS | Node.js framework with DI |
| TypeORM | PostgreSQL ORM |
| BullMQ + Redis | Async job queues |
| Puppeteer | PDF generation |
| OpenAI GPT-4o | AI features |
| Pinecone | Vector embeddings |
| Twilio | WhatsApp messaging |
| SendGrid | Email delivery |
| AWS S3 | PDF file storage |
| Passport + JWT | Authentication |

---

## 📋 API Endpoints

```
POST   /api/v1/auth/register     Register new business
POST   /api/v1/auth/login        JWT login
GET    /api/v1/auth/me           Get current user

GET    /api/v1/invoices          List invoices (with filters)
POST   /api/v1/invoices          Create invoice (async PDF)
GET    /api/v1/invoices/:id      Get single invoice
PATCH  /api/v1/invoices/:id      Update invoice
POST   /api/v1/invoices/:id/send         Send via WhatsApp/email
POST   /api/v1/invoices/:id/payments     Record payment
POST   /api/v1/invoices/:id/translate    AI translate
POST   /api/v1/invoices/:id/void         Void invoice

GET    /api/v1/clients           List clients
POST   /api/v1/clients           Create client
GET    /api/v1/clients/:id       Get client
PATCH  /api/v1/clients/:id       Update client

POST   /api/v1/ai/tax-hints      Get VAT/NBT hints
POST   /api/v1/ai/message        Generate sharing message
POST   /api/v1/ai/translate      Translate text snippet

GET    /api/v1/analytics/summary Revenue analytics
```

---

## 🌐 Multilingual Support

InvoiceMate supports three languages:
- **English (EN)** — Default
- **සිංහල (SI)** — Sinhala (AI-translated via GPT-4o)
- **தமிழ் (TA)** — Tamil Sri Lankan (AI-translated via GPT-4o)

Translations are cached in the invoice's `translations` JSONB column after first generation — no repeated API costs.

---

## 💰 Tax Compliance

- **VAT**: 18% — AI hints per line item
- **NBT**: 2% — AI hints per line item
- Optional per-item toggles
- Tax summary reports exportable as PDF/CSV
- All amounts in LKR only

---

## 📱 PWA / Offline Support

1. Install as a mobile app on Android/iOS via "Add to Home Screen"
2. Create invoices offline — stored in IndexedDB via Dexie.js
3. SyncEngine auto-syncs pending invoices when network is restored
4. Service Worker caches app shell for instant load

---

## 🔒 Security

- JWT with 15-minute access tokens + 30-day refresh tokens
- bcrypt password hashing (cost factor 12)
- Row-level security: every query scoped to `user_id`
- S3 PDFs served via signed URLs (48h TTL)
- Helmet.js security headers
- Rate limiting: 100 req/min per IP
- Input validation on all endpoints via class-validator
- WhatsApp webhook verified via HMAC-SHA256

---

## ☁️ Deployment

### MVP (Render + Supabase, ~$50/month)
1. Deploy frontend to Vercel
2. Deploy backend to Render
3. Use Supabase for PostgreSQL
4. Use Supabase Storage for PDFs (migrate to S3 later)

### Production (AWS, ~$300-600/month)
1. AWS ECS Fargate for backend (ap-southeast-1)
2. AWS RDS PostgreSQL Multi-AZ
3. ElastiCache Redis
4. S3 + CloudFront CDN
5. Route 53 for DNS

---

## 📄 License

MIT © 2025 InvoiceMate

---

*Built with ❤️ for Sri Lankan small businesses*
