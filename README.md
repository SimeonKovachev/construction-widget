# Multi-tenant AI Sales & Estimator Chat Widget

A 24/7 AI-powered floating chat widget for construction and manufacturing websites. Calculates instant prices using a configurable price list, captures leads, and notifies business owners via email.

## Architecture

```
backend/                          # ASP.NET Core 9 Web API
  src/ConstructionWidget.Api/     # HTTP layer, SignalR hub, middleware
  src/ConstructionWidget.Core/    # Domain entities, interfaces (no deps)
  src/ConstructionWidget.Infrastructure/  # EF Core, OpenAI, services

frontend/
  admin-dashboard/                # Next.js 14 admin app (JWT auth)
  widget/                         # Vite IIFE bundle (embeds via Shadow DOM)
```

## Prerequisites

- .NET 9 SDK
- Node.js 18+
- PostgreSQL (running locally on port 5432)
- OpenAI API key

## Quick Start

### 1. Configure the API

Edit `backend/src/ConstructionWidget.Api/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=construction_widget;Username=postgres;Password=YOUR_PG_PASSWORD"
  },
  "OpenAI": {
    "ApiKey": "sk-YOUR_OPENAI_API_KEY",
    "Model": "gpt-4o"
  },
  "Jwt": {
    "Secret": "YOUR_32_CHAR_SECRET_KEY_HERE!!!!"
  },
  "AdminSecret": "your-admin-secret"
}
```

### 2. Start the API

```bash
cd backend
dotnet run --project src/ConstructionWidget.Api
```

The API auto-migrates and seeds a demo tenant on first run:
- **Admin email:** `admin@acme-windows.com`
- **Admin password:** `Demo1234!`
- **API key:** Printed in startup logs

### 3. Start the Admin Dashboard

```bash
cd frontend/admin-dashboard
npm install
npm run dev
# Open http://localhost:3000
```

Log in with the demo credentials above.

### 4. Upload a Price List

Upload `sample-pricelist.csv` (in project root) via the **Price List** page in the admin dashboard.

### 5. Embed the Widget

1. Get your **Tenant ID** from the Settings page in the admin dashboard.
2. Open `test-widget.html` and replace `REPLACE_WITH_YOUR_TENANT_ID`.
3. Open the HTML file in a browser.

Or embed in any website:

```html
<div id="sales-widget"></div>
<script>
  window.SalesWidgetConfig = {
    tenantId: "YOUR-TENANT-ID",
    apiUrl: "https://your-api.com"
  };
</script>
<script src="https://your-api.com/widget.js"></script>
```

### 6. Rebuild Widget (after changes)

```bash
cd frontend/widget
npm run build
cp dist/widget.js ../../backend/src/ConstructionWidget.Api/wwwroot/widget.js
```

## API Reference

### Public Endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/widget/config` | Widget init config (requires `X-Tenant-ID`) |
| GET | `/healthz` | Health check |
| WS | `/hubs/chat?tenantId=...` | SignalR chat hub |

### Admin Endpoints (JWT Bearer required)

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/tenants/me` | Get tenant info |
| PUT | `/api/admin/tenants/me` | Update notification settings |
| POST | `/api/admin/pricelist` | Upload CSV price list |
| GET | `/api/admin/pricelist` | Get current pricing |
| GET | `/api/admin/leads` | List leads |
| GET | `/api/admin/leads/{id}` | Single lead |

### Tenant Creation (AdminSecret required)

```bash
curl -X POST http://localhost:5000/api/admin/tenants \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{"name":"My Company","ownerEmail":"owner@company.com","password":"SecurePass123!"}'
```

## Pricing CSV Format

```csv
Category,Material,BasePrice,PricePerSqFt,MinimumPrice
windows,vinyl,150,8.50,250
windows,aluminum,200,12.00,350
GLOBAL,MarkupPercentage,15,,
GLOBAL,LaborFixedCost,75,,
```

**Pricing formula:**
```
sqFt = width × height (normalized to feet)
price = (basePrice + sqFt × pricePerSqFt + laborFixedCost) × (1 + markup%)
final = max(price, minimumPrice)
```

**Supported units:** `mm`, `cm`, `m`, `ft`, `in` — the AI auto-detects from customer input.

## Multi-tenancy

Every widget request requires `X-Tenant-ID` header. EF Core Global Query Filters automatically scope all `Lead` and `Conversation` queries to the current tenant.

## Lead Notifications

When a customer provides their name and phone, the AI calls `save_lead` which:
1. Saves the lead to the database
2. Sends an email to `tenant.NotificationEmail` via SMTP

Configure SMTP in `appsettings.json` (global) or per-tenant via the Settings page.

## Development

```bash
# Run backend with hot reload
dotnet watch run --project backend/src/ConstructionWidget.Api

# Run admin dashboard
cd frontend/admin-dashboard && npm run dev

# Watch-rebuild widget
cd frontend/widget && npm run dev
```
