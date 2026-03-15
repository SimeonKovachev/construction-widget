# Construction Widget — Multi-Tenant AI Sales & Estimator Chat Widget

> An embeddable AI-powered chat widget that qualifies leads, generates instant price quotes, and saves them to a CRM dashboard — all in real-time. Built as a multi-tenant SaaS platform.

**Stack:** ASP.NET Core 9 · PostgreSQL · OpenAI · SignalR · Next.js 15 · Vite IIFE · Railway · Vercel

---

## What It Does

A construction company (windows, doors, fencing, roofing — any trade) embeds a single `<script>` tag on their website. Visitors open the chat, describe what they need, and the AI:

1. Asks qualifying questions based on the tenant's product catalog
2. Calculates an instant price estimate using the tenant's pricing config
3. Collects the customer's name, phone, and email
4. Saves a lead to the admin dashboard
5. Sends a notification email to the business owner

Each business (tenant) has their own isolated dashboard, pricing config, and leads. The platform operator manages all tenants from a superadmin dashboard.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Client's Website                                       │
│  <script src="https://api.yourapp.com/widget.js">       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Widget (React IIFE — Shadow DOM isolated)        │   │
│  │  • Floating chat button                          │   │
│  │  • Chat window + message list                    │   │
│  │  • Connects via SignalR WebSocket                │   │
│  └──────────────────┬───────────────────────────────┘   │
└─────────────────────│───────────────────────────────────┘
                      │ WS /hubs/chat?tenantId=...
                      ▼
┌─────────────────────────────────────────────────────────┐
│  ASP.NET Core 9 API  (Railway)                          │
│                                                         │
│  • SignalR ChatHub — streams AI responses               │
│  • OpenAI Chat Completions + function calling           │
│  • TenantResolutionMiddleware — isolates all data       │
│  • Serves widget.js from /wwwroot                       │
│  • REST API for admin & superadmin dashboards           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PostgreSQL  (Railway managed)                    │   │
│  │  Tenants · Leads · Conversations                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          ▲                           ▲
          │ HTTPS REST                │ HTTPS REST
          │                           │
┌─────────┴──────────┐     ┌──────────┴──────────────┐
│  Admin Dashboard   │     │  Superadmin Dashboard    │
│  Next.js 15        │     │  Next.js 15              │
│  Vercel — port 3000│     │  Vercel — port 3001      │
│                    │     │                          │
│  Per-tenant login  │     │  Platform operator       │
│  Leads CRM         │     │  Create/manage tenants   │
│  Price list editor │     │  Platform-wide stats     │
│  Settings          │     │                          │
└────────────────────┘     └──────────────────────────┘
```

---

## Features

### Widget
- Real-time streaming AI responses via SignalR
- Shadow DOM isolation — zero CSS conflict with host site
- Collects name, phone, email, and delivery preferences in one message
- Session-based lead deduplication (no double saves across reconnects)
- Served as a single IIFE bundle from the backend (`/widget.js`)

### Admin Dashboard (per-tenant)
- JWT-authenticated login per tenant
- Leads table with status badges (New / Contacted / Quoted / Converted / Lost)
- Lead detail drawer — edit status, notes, email
- Price list management — upload CSV or edit inline by category/material
- Settings — notification email, SMTP config
- Full tenant data isolation — each admin sees only their own data

### Superadmin Dashboard
- Platform-wide stats (total tenants, leads, revenue)
- Create new tenants (generates API key + hashed credentials)
- Toggle tenant active/inactive
- View all tenants

### Backend API
- Multi-tenant middleware (resolves tenant from API key or JWT claim)
- OpenAI function calling: `calculate_price` + `save_lead`
- Auto database migrations on startup
- Demo data seeded on first run
- Health check endpoint at `/healthz`

---

## Tech Stack

| Layer | Technology |
|---|---|
| API | ASP.NET Core 9, C# |
| Realtime | SignalR (WebSockets) |
| AI | OpenAI Chat Completions API (function calling) |
| Database | PostgreSQL via EF Core 9 + Npgsql |
| Auth | JWT Bearer tokens, BCrypt password hashing |
| Email | FluentEmail + SMTP |
| Admin UI | Next.js 15, React 19, Tailwind CSS v4 |
| Superadmin UI | Next.js 15, React 19, Tailwind CSS v4 |
| Widget | React 19, Vite (IIFE lib mode), @microsoft/signalr |
| Hosting | Railway (API + DB), Vercel (frontends) |

---

## Repo Structure

```
construction-widget/
├── backend/
│   ├── Dockerfile                        ← Multi-stage .NET 9 build
│   ├── global.json                       ← Pins .NET 9 SDK
│   ├── railway.json                      ← Railway build/deploy config
│   ├── ConstructionWidget.sln
│   └── src/
│       ├── ConstructionWidget.Api/       ← ASP.NET Core Web API (port 5032)
│       │   ├── Controllers/              ← Auth, Admin, Leads, SuperAdmin, Widget
│       │   ├── Hubs/ChatHub.cs           ← SignalR hub (streams AI responses)
│       │   ├── Middleware/               ← TenantResolutionMiddleware
│       │   ├── wwwroot/
│       │   │   ├── widget.js             ← Built widget bundle (served at /widget.js)
│       │   │   └── test-widget.html      ← Local test page
│       │   ├── appsettings.json
│       │   └── appsettings.example.json  ← Safe template (no real secrets)
│       ├── ConstructionWidget.Core/      ← Entities, interfaces, models
│       │   ├── Entities/                 ← Tenant, Lead, Conversation
│       │   ├── Interfaces/               ← ILeadRepository, ITenantRepository, etc.
│       │   └── Models/                   ← ChatModels (tool args, streaming)
│       ├── ConstructionWidget.Infrastructure/  ← EF Core, services, repositories
│       │   ├── Data/                     ← AppDbContext, DbSeeder, Migrations
│       │   ├── Repositories/             ← LeadRepository, TenantRepository
│       │   └── Services/                 ← OpenAiChatService, EstimateService, AuthService
│       └── ConstructionWidget.Application/    ← DTOs, application services
│           ├── DTOs/
│           └── Services/                 ← LeadService, TenantService, SuperAdminService
│
└── frontend/
    ├── admin-dashboard/                  ← Tenant admin UI (Next.js 15, port 3000)
    │   ├── app/(dashboard)/              ← Leads, PriceList, Settings pages
    │   ├── components/                   ← LeadsTable, PriceListEditor, etc.
    │   └── lib/                          ← api.ts, types.ts, auth.ts
    ├── superadmin/                       ← Platform operator UI (Next.js 15, port 3001)
    │   ├── app/
    │   │   ├── login/page.tsx
    │   │   └── dashboard/page.tsx
    │   └── lib/                          ← api.ts, types.ts, auth.ts
    └── widget/                           ← Embeddable chat widget (Vite IIFE)
        └── src/
            ├── index.tsx                 ← Mount + Shadow DOM setup
            ├── Widget.tsx
            ├── components/               ← ChatButton, ChatWindow, MessageList, InputBar
            └── hooks/                    ← useChat.ts, useSignalR.ts
```

---

## Local Development

### Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9)
- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 15+](https://www.postgresql.org/download/) running locally on port 5432

---

### 1. Backend

Copy the example config and fill in your values:
```bash
cd backend/src/ConstructionWidget.Api
cp appsettings.example.json appsettings.json
```

Edit `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=construction_widget;Username=postgres;Password=YOUR_PG_PASSWORD"
  },
  "OpenAI": {
    "ApiKey": "sk-proj-...",
    "Model": "gpt-4o"
  },
  "Jwt": {
    "Secret": "any-random-string-at-least-32-characters-long",
    "Issuer": "ConstructionWidget",
    "Audience": "ConstructionWidgetAdmin",
    "ExpiryMinutes": 480
  },
  "SuperAdmin": {
    "Email": "you@example.com",
    "Password": "YourPassword123!"
  },
  "AdminSecret": "your-admin-secret"
}
```

Run (auto-migrates DB and seeds demo data on first run):
```bash
cd backend
dotnet run --project src/ConstructionWidget.Api
# API → http://localhost:5032
# Swagger → http://localhost:5032/swagger
```

Demo credentials printed to startup logs:
```
Tenant:   Acme Windows & Doors
Email:    admin@acme-windows.com
Password: Demo1234!
API Key:  <printed in logs>
```

---

### 2. Admin Dashboard

```bash
cd frontend/admin-dashboard
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5032
```

```bash
npm install
npm run dev
# http://localhost:3000
```

Login: `admin@acme-windows.com` / `Demo1234!`

---

### 3. Superadmin Dashboard

```bash
cd frontend/superadmin
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5032
```

```bash
npm install
npm run dev
# http://localhost:3001
```

Login: credentials from `appsettings.json → SuperAdmin`

---

### 4. Widget (rebuild after changes)

```bash
cd frontend/widget
npm install
npm run build
cp dist/widget.js ../../backend/src/ConstructionWidget.Api/wwwroot/widget.js
```

Test locally:
```
http://localhost:5032/test-widget.html
```

---

## Environment Variables

### Backend (ASP.NET Core)

For local dev use `appsettings.json`. For production (Railway), set these as environment variables using double-underscore `__` notation for nested keys:

| Variable | Example | Description |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | `Host=...;Port=5432;Database=railway;...` | PostgreSQL Npgsql connection string |
| `OpenAI__ApiKey` | `sk-proj-...` | OpenAI API key |
| `OpenAI__Model` | `gpt-4o` | OpenAI model |
| `Jwt__Secret` | 40+ random chars | JWT signing secret |
| `Jwt__Issuer` | `ConstructionWidget` | JWT issuer claim |
| `Jwt__Audience` | `ConstructionWidgetAdmin` | JWT audience claim |
| `Jwt__ExpiryMinutes` | `480` | Token lifetime (8 hours) |
| `SuperAdmin__Email` | `admin@yourplatform.com` | Superadmin login email |
| `SuperAdmin__Password` | `StrongPass123!` | Superadmin login password |
| `AdminSecret` | any secret string | Header secret for tenant creation |
| `Smtp__Host` | `smtp.gmail.com` | SMTP server |
| `Smtp__Port` | `587` | SMTP port |
| `Smtp__Username` | `you@gmail.com` | SMTP username |
| `Smtp__Password` | Gmail App Password | SMTP password (use App Password, not login) |
| `Smtp__FromEmail` | `noreply@yourdomain.com` | Notification sender address |
| `Smtp__FromName` | `Sales Widget` | Notification sender name |
| `ASPNETCORE_URLS` | `http://+:8080` | Bind address (Railway uses 8080) |
| `ASPNETCORE_ENVIRONMENT` | `Production` | Environment name |

### Frontend (Next.js — both dashboards)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full URL to the backend API (e.g. `https://yourapp.up.railway.app`) |

---

## API Reference

### Authentication

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Tenant login → returns JWT |
| `POST` | `/api/auth/superadmin/login` | Superadmin login → returns JWT |

### Admin (requires `Authorization: Bearer <token>`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/admin/tenants/me` | Get current tenant info |
| `PUT` | `/api/admin/tenants/me` | Update tenant settings |
| `GET` | `/api/admin/leads` | List all leads |
| `GET` | `/api/admin/leads/{id}` | Get single lead |
| `PATCH` | `/api/admin/leads/{id}` | Update lead (status, notes, email) |
| `DELETE` | `/api/admin/leads/{id}` | Delete lead |
| `GET` | `/api/admin/pricelist` | Get pricing config |
| `POST` | `/api/admin/pricelist` | Upload pricing CSV |
| `PUT` | `/api/admin/pricelist/globals` | Update global pricing (markup %, labor) |
| `PUT` | `/api/admin/pricelist/{category}/{material}` | Upsert a material price |
| `DELETE` | `/api/admin/pricelist/{category}/{material}` | Remove a material |
| `POST` | `/api/admin/pricelist/category` | Add a new category |
| `DELETE` | `/api/admin/pricelist/{category}` | Remove a category |

### Superadmin (requires JWT with `role: superadmin`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/superadmin/stats` | Platform statistics |
| `GET` | `/api/superadmin/tenants` | List all tenants |
| `POST` | `/api/superadmin/tenants` | Create new tenant |
| `PUT` | `/api/superadmin/tenants/{id}/toggle` | Toggle tenant active/inactive |
| `DELETE` | `/api/superadmin/tenants/{id}` | Delete tenant |

### Widget (public)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/widget/config` | Widget config (requires `X-Tenant-ID` header) |
| `GET` | `/widget.js` | Widget IIFE bundle |
| `WS` | `/hubs/chat?tenantId=...` | SignalR chat hub |
| `GET` | `/healthz` | Health check |

---

## Widget Embed

Add to any webpage. Replace `YOUR-TENANT-ID` with the UUID from the admin Settings page:

```html
<script>
  window.SalesWidgetConfig = {
    tenantId: "YOUR-TENANT-ID",
    apiUrl:   "https://yourapp.up.railway.app"
  };
</script>
<script src="https://yourapp.up.railway.app/widget.js" async></script>
```

The widget mounts a Shadow DOM (no CSS leakage), connects to SignalR, and streams AI responses in real time. The bundle is served directly from the backend — no CDN or separate hosting needed.

### Pricing CSV Format

Upload via the admin Price List page or `POST /api/admin/pricelist`:

```csv
category,material,basePrice,pricePerSqFt,minimumPrice
windows,vinyl,150,8.50,250
windows,aluminum,200,12.00,350
doors,fiberglass,350,0,350
fencing,wood,25,8,200
GLOBAL,MarkupPercentage,15,,
GLOBAL,LaborFixedCost,75,,
```

**Pricing formula:**
```
sqFt  = width × height  (auto-converts mm / cm / m / ft / in)
price = (basePrice + sqFt × pricePerSqFt + laborFixedCost) × (1 + markup%)
final = max(price, minimumPrice)
```

---

## Database Schema

### Tenants
| Column | Type | Notes |
|---|---|---|
| `Id` | `uuid` | PK |
| `Name` | `text` | Company name |
| `ApiKey` | `text` | Unique — used for widget auth |
| `OwnerEmail` | `text` | Login email |
| `PasswordHash` | `text` | BCrypt hash |
| `PricingConfig` | `text` | JSON blob — categories/materials/prices |
| `IsActive` | `bool` | Platform-level on/off switch |
| `NotificationEmail` | `text?` | Lead alert recipient |
| `SmtpHost/Port/User/Password` | various | Per-tenant SMTP override |
| `CreatedAt` | `timestamptz` | |

### Leads
| Column | Type | Notes |
|---|---|---|
| `Id` | `uuid` | PK |
| `TenantId` | `uuid` | FK → Tenants |
| `SessionId` | `text?` | Widget session — prevents duplicate saves |
| `CustomerName` | `text` | |
| `Phone` | `text` | |
| `Email` | `text?` | Optional — collected by AI |
| `Requirements` | `text` | AI-summarized needs + delivery preferences |
| `QuotedPrice` | `decimal` | Calculated by EstimateService |
| `Status` | `text` | `new` \| `contacted` \| `quoted` \| `converted` \| `lost` |
| `Notes` | `text?` | Internal admin notes |
| `CreatedAt` | `timestamptz` | |
| `UpdatedAt` | `timestamptz?` | |

### Conversations
| Column | Type | Notes |
|---|---|---|
| `Id` | `uuid` | PK |
| `TenantId` | `uuid` | FK → Tenants |
| `SessionId` | `text` | Widget session ID |
| `MessagesJson` | `text` | Full message history as JSON array |
| `CreatedAt` / `UpdatedAt` | `timestamptz` | |

---

## Deployment

### Backend → Railway

1. Create Railway project → **Deploy from GitHub** → root directory: `backend`
2. Add a **PostgreSQL** database service (Railway links `DATABASE_URL` automatically)
3. Set environment variables in the **Variables** tab (see table above)
4. Railway uses `backend/Dockerfile` — builds with `mcr.microsoft.com/dotnet/sdk:9.0`
5. On first boot the app runs EF migrations and seeds demo data automatically

**PostgreSQL URL conversion** — Railway provides `DATABASE_URL` as:
```
postgresql://postgres:PASSWORD@HOST:PORT/railway
```
Convert to Npgsql format for `ConnectionStrings__DefaultConnection`:
```
Host=HOST;Port=PORT;Database=railway;Username=postgres;Password=PASSWORD;SslMode=Disable
```
> Use `SslMode=Disable` for Railway's internal hostname (`postgres.railway.internal`).
> Use `SslMode=Require` for the external proxy hostname.

### Frontends → Vercel

For each Next.js app:
1. [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. Set **Root Directory** to the app folder
3. Add env var: `NEXT_PUBLIC_API_URL` = your Railway API URL
4. Deploy — auto-deploys on every push to `master`

| App | Root Directory | Local Port |
|---|---|---|
| Admin Dashboard | `frontend/admin-dashboard` | 3000 |
| Superadmin | `frontend/superadmin` | 3001 |

### Cost Estimate

| Tier | Monthly |
|---|---|
| Launching (1–5 clients) | ~$0 (Railway $5 free credit) |
| Growing (10+ clients) | ~$5–10/mo Railway |
| Scaling (50+ clients) | ~$20–40/mo Railway + Vercel free |
| Custom domain (optional, one-time) | ~$9–12/year |

---

## Build Commands Reference

```bash
# Backend
cd backend
dotnet run --project src/ConstructionWidget.Api          # dev server
dotnet watch run --project src/ConstructionWidget.Api    # hot reload
dotnet ef migrations add <Name> \                        # new EF migration
  --project src/ConstructionWidget.Infrastructure \
  --startup-project src/ConstructionWidget.Infrastructure

# Admin Dashboard
cd frontend/admin-dashboard
npm run dev        # http://localhost:3000
npm run build      # production build

# Superadmin
cd frontend/superadmin
npm run dev        # http://localhost:3001
npm run build

# Widget
cd frontend/widget
npm run build
cp dist/widget.js ../../backend/src/ConstructionWidget.Api/wwwroot/widget.js
```
