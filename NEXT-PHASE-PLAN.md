# Makay Store — Next Phase Development Plan
**Updated:** 2026-07-18
**Resume trigger:** "continue next phase plan"

---

## What Was Shipped (Prior Session)

- **Storefront Studio** (`/admin/studio`) — merged ThemeEditor + MarketingEditor into one editor: Brand/Scroll/Pages/Images/Card with section-level Save buttons and live iframe preview
- **Admin tutorial** expanded to 10 steps (Rotation + Studio added)
- **Admin sidebar** consolidated to 7 entries (Marketing + Tema → Studio)
- **3D Generation** — FAL.ai TRELLIS.2 LoRA provider added ($0.02/model). Needs FAL account balance. Falls back to TripoSR (Railway, free, lower quality).
- **TripoSR improvements** — rembg background removal + has_vertex_color=True
- **Improvement Plan 2** — admin orders/users pages, real report data, seller i18n, supervisor tutorial, scrolling fix

---

## Pending Small Items

1. **FAL.ai balance** — add $5+ at fal.ai/dashboard/billing → TRELLIS.2 activates automatically (FAL_KEY already set)
2. **Studio "Pages → Content" not wired** — saves to DB but storefront components don't read those values yet
3. **Studio Brand tab preview** — iframe doesn't reflect color changes; needs inline ThemePreview for Brand/Scroll tabs
4. **Admin Profile quick link** says "Theme Editor" — should point to Studio

---

## Phase A — Panel Restructure & Section Overhauls

> Fix structural and quality gaps first. Everything in Phase B depends on a clean panel structure.

**Build order: A1 → A2 → A3 → A4 → A5 → A6 → A7**

---

### A1 — Seller Panel: Full Spanish i18n

**Problem:** Seller sidebar and all seller panel strings stay in English even when ES is selected.

**What's needed:**
- Audit every string in seller panel components: sidebar labels, dashboard stat cards, quick-action cards, page headings, empty states
- All must use `useTranslations()` and resolve from `es.json` under a `seller.*` namespace
- Sidebar items: Dashboard, Sell, Products, Stock, My Activity, 3D Models, Studio, Rotation → all translated
- Quick Actions: "Vender a Cliente", "Gestionar Productos", "Actualizar Stock", "Mi Actividad" — verify completeness
- Stat labels: INGRESOS TOTALES, PEDIDOS RECIENTES, PRODUCTOS RASTREADOS, UNIDADES EN STOCK — verify
- Empty states ("Aún no hay ventas") → confirm all translate

**Files:**
- `src/i18n/es.json` — complete `seller.*` namespace
- `src/i18n/en.json` — ensure parity
- All seller panel components with hardcoded strings

---

### A2 — Move Studio to Seller Panel + Fix It

**Problem:** Studio lives under Admin but is seller work. Also has visual/logic issues: Card and Brand tabs feel disconnected, live preview inconsistencies, no confirmation on publish.

**What to move:**
- Add "Studio" to Seller sidebar (last item)
- New route: `/seller/studio`
- `/admin/studio` → redirect to `/seller/studio`
- Update seller dashboard to add Studio quick-action card
- Remove Studio from Admin sidebar and Admin dashboard

**Studio improvements:**
- **Brand tab**: Replace iframe preview with inline ThemePreview component so color changes reflect immediately (iframe is cross-origin, colors won't apply)
- **Scroll tab**: Verify all 7 section keys match what storefront components actually read
- **Images tab**: Verify saves persist across page reload
- **Card tab**:
  - Element drag-and-drop positions must actually persist to DB on Save (verify write path)
  - Card preview must not overflow panel at any screen size
  - "Reset positions" button must work end-to-end
  - Visibility toggles (eye icons) must hide elements on the real member card render
- **Publish All**: Show success toast after publish, not just button state change
- **Consistency rule**: Remove any UI that doesn't have working save logic — dead controls are worse than missing controls

**Files:**
- `src/components/SellerSidebar.tsx` — add Studio item
- `src/app/seller/studio/page.tsx` — new route
- `src/app/admin/studio/page.tsx` — redirect
- `src/components/AdminSidebar.tsx` — remove Studio
- `src/components/AdminDashboard.tsx` — remove Studio card
- `src/components/StudioEditor.tsx` — fixes above
- `src/i18n/*.json` — studio key under seller namespace

---

### A3 — Remove Products from Admin Panel

**Problem:** Admin sidebar has "Productos" — product management is seller work. Having it in both places is confusing.

**What to remove:**
- Remove "Productos" nav item from Admin sidebar
- Remove "Productos" nav card from Admin dashboard
- Update admin tutorial: remove or reassign any step that references the Productos nav item
- Keep `/admin/products` route accessible (don't delete) — may be needed for admin-only overrides later, but don't surface it in nav

**Files:**
- `src/components/AdminSidebar.tsx`
- `src/components/AdminDashboard.tsx`
- `src/lib/tutorials.ts` — update admin-tour

---

### A4 — Move Rotation to Seller Panel + Fix Mock Data + Real Connections

**Problem:** Rotation lives in Admin but is operational seller work. Has hardcoded mock data. Not connected to real DB.

**What to move:**
- Add "Rotación" to Seller sidebar
- New route: `/seller/rotation`
- `/admin/rotation` → redirect or remove
- Remove Rotation from Admin sidebar

**Mock data → real connections:**
- Rotation table/list must query real `products` table for stock, last-updated timestamps
- "Productos Rastreados" stat on seller dashboard must count from real DB (currently hardcoded 0)
- "Unidades en Stock" must sum from real inventory records
- Stock adjustment actions must write to DB (not just UI state)
- Log movements to `stock_movements` table

**New table:**
```sql
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files:**
- `src/app/seller/rotation/page.tsx` — new route
- `src/app/admin/rotation/page.tsx` — redirect
- `src/components/SellerSidebar.tsx` — add Rotación
- `src/components/AdminSidebar.tsx` — remove Rotación
- `src/app/api/seller/rotation/route.ts` — real DB queries
- `src/i18n/*.json` — rotation keys under seller namespace

---

### A5 — Reports Section: Full Rebuild

**Problem:** Reports crashes between tabs. Data is partially mock. The section needs to be a real reporting tool for running a business — reliable, comprehensive, and visually consistent.

**Fix crashes first:**
- Identify which tab triggers the crash (likely null data reaching a chart before loading completes)
- Add loading states and null guards to every chart and table component
- Every tab must have a valid empty state — no tab should ever throw

**Tab: Ventas (Sales)**
- Revenue by day, last 30 days — area or bar chart from real `orders` table
- Week / month toggle
- Average order value
- Order count vs items sold count

**Tab: Productos (Product Performance)**
- Top 10 products by revenue
- Top 10 by units sold
- Products with zero sales (dead stock list)
- All from real `orders` + `order_items` join

**Tab: Clientes (Customers)**
- New customers per week
- Returning vs new ratio
- Top customers by lifetime spend
- From `orders` joined to Clerk user metadata

**Tab: Inventario (Inventory)**
- Current stock per product
- Low stock alerts (configurable threshold, default 5 units)
- Stock movement history (from `stock_movements` once A4 is done)

**Tab: Metas (Goals)**
- Revenue goal progress — editable inline (not just display)
- Units sold goal
- Visual progress bars

**General improvements:**
- Date range picker at top that all tabs respect
- Export CSV on at least the Sales tab
- Consistent color palette: brand gold + dark throughout
- Mobile-responsive: table fallback when charts overflow

**Files:**
- `src/app/admin/reports/page.tsx` — rebuild
- `src/components/reports/ReportsSales.tsx`
- `src/components/reports/ReportsProducts.tsx`
- `src/components/reports/ReportsCustomers.tsx`
- `src/components/reports/ReportsInventory.tsx`
- `src/components/reports/ReportsGoals.tsx`
- `src/app/api/admin/reports/route.ts` — unified endpoint with `?tab=&from=&to=` params

---

### A6 — Admin Profile: Major Overhaul

**Problem:** Profile section is thin. Shows role badge, system health, access level checklist, quick links — but no real configuration, no actionable controls. Quick link "Theme Editor" is stale.

**Header:**
- Avatar (Clerk profile image or initials)
- Name, role badge, email
- "Member since" date
- Edit button → inline form to update display name via Clerk `updateUser`

**System Health — expand:**
- Products in DB (real count)
- Orders this month (real count)
- Monthly revenue (real sum)
- Active users (Clerk user count)
- Pending orders (status = 'placed' or 'confirmed')

**Access Level:**
- Keep checklist but derive dynamically from the user's actual Clerk role metadata
- Different roles show different access lines — not a static list

**Configuration section (new):**
- Change password → link to Clerk account portal (`/user`)
- Store info: store name, contact email, timezone — editable, writes to `admin_settings` table
- Low stock alert threshold — number input, writes to settings
- Notification preferences (email on new order) — store in Clerk metadata or `admin_settings`

**Quick Links — fix:**
- Replace "Theme Editor" → "Studio" pointing to `/seller/studio`
- Keep: Admin Dashboard, Reports
- Remove stale links

**New table:**
```sql
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files:**
- `src/app/admin/profile/page.tsx`
- `src/app/api/admin/profile/route.ts` — GET/PATCH
- `src/app/api/admin/settings/route.ts` — GET/PATCH admin_settings

---

### A7 — Supervisor Section: Full Overhaul

**Problem:** Supervisor is the least developed section across the entire app. Weak visuals, minimal features, doesn't fulfill its core purpose: giving a supervisor real operational visibility and staff management capability.

**Core purpose:** Supervisor oversees sellers, monitors operations in real time, resolves order issues, and manages shifts. Should never need to go to Admin for day-to-day operational control.

**Dashboard overview (main page):**
- Active sellers right now (who is clocked in today)
- Sales today vs yesterday comparison
- Open / pending orders needing attention — count + quick link
- Low stock alerts — products below threshold
- Recent activity feed: last 10 actions across all sellers (sales, stock updates, 3D gens)

**Staff management (`/supervisor/staff`):**
- List of all seller accounts (Clerk users with role = 'seller')
- Per seller: name, status (active/inactive), last login, total sales this month
- Action: deactivate / reactivate (update Clerk metadata)
- Action: force logout / reset session via Clerk

**Order oversight (`/supervisor/orders`):**
- All pending and confirmed orders across all sellers
- Can update order status (confirm → shipped → delivered)
- Escalation flag: mark as "needs admin attention"

**Shift tracking (`/supervisor/shifts`):**
- Log of seller clock-in / clock-out events
- Today's summary per seller: hours worked, sales count, revenue
- Supervisor can manually add or correct a shift entry

**Visual standard:**
- Match admin panel quality — not a stripped-down version
- Same stat card components, table styles, color tokens as the rest of the app
- Sidebar same dark style as seller panel

**New tables:**
```sql
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  supervisor_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files:**
- `src/app/supervisor/page.tsx` — rebuilt dashboard
- `src/app/supervisor/staff/page.tsx`
- `src/app/supervisor/orders/page.tsx`
- `src/app/supervisor/shifts/page.tsx`
- `src/components/SupervisorSidebar.tsx` — update with new nav items
- `src/app/api/supervisor/` — new API routes per section
- `src/i18n/*.json` — supervisor namespace

---

## Phase B — Customer Experience & Sales Engine

> Build after Phase A is complete.

**Build order: B1 → B2 → B3 → B4 → B5**

---

### B1 — Real Product Admin (Seller-side)

Products now belong to the Seller panel (Admin Products removed in A3). Full CRUD for real DB products.

**What's needed:**
- `/seller/products` — table of all real products with edit/delete
- Full edit form: name, price, description, images, stock, variants (sizes/colors JSONB)
- Create product form (non-3D path)
- Bulk publish/unpublish
- Stock per variant

**DB changes:**
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}';
```

**Files:**
- `src/app/seller/products/page.tsx`
- `src/app/seller/products/[id]/edit/page.tsx`
- `src/app/api/seller/products/route.ts`
- `src/app/api/seller/products/[id]/route.ts`

---

### B2 — Customer Orders & Tracking

- `/orders` — customer's own order list
- `/orders/[id]` — status timeline: placed → confirmed → shipped → delivered
- Admin/supervisor updates status
- Optional: Resend email on status change

**Files:**
- `src/app/orders/page.tsx`
- `src/app/orders/[id]/page.tsx`
- `src/app/api/orders/route.ts`
- `src/app/api/admin/orders/[id]/route.ts` — PATCH status
- StatusTimeline component

---

### B3 — Memberships & Customer Accounts

Beach club membership system — core differentiator for Makay identity.

- Membership tiers: free / bronze / silver / gold / vip
- `/profile` expanded: wallet balance, membership badge, QR member card, order history, points
- Staff QR scan → membership level → apply discount
- Admin sets discount % per tier

**DB:**
```sql
CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT PRIMARY KEY,
  tier TEXT DEFAULT 'free',
  points INTEGER DEFAULT 0,
  wallet_balance NUMERIC(10,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files:**
- `src/app/api/profile/membership/route.ts`
- `src/app/api/admin/memberships/route.ts`
- `src/components/profile/MembershipCard.tsx` (QR stub already exists)

---

### B4 — Events System

Beach club events — Spoon & Moon experiences and similar.

- `/admin/events` — create, manage, ticket capacity
- `/events` storefront — upcoming grid + detail page
- Ticket purchase flow + QR ticket on confirmation
- Guest list management in admin

**DB:**
```sql
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  capacity INTEGER DEFAULT 100,
  tickets_sold INTEGER DEFAULT 0,
  price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  user_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  order_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### B5 — Analytics Dashboard (Nice to Have)

- Revenue charts extending Reports
- Top products by revenue
- Conversion funnel: visitors → cart → checkout → purchased
- CSV export
- Optional: Vercel Analytics for visitor counts

---

## DB Schema Summary (all new tables)

```sql
-- A4
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- A6
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A7
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  clock_in TIMESTAMPTZ NOT NULL,
  clock_out TIMESTAMPTZ,
  supervisor_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B1
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}';

-- B3
CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT PRIMARY KEY,
  tier TEXT DEFAULT 'free',
  points INTEGER DEFAULT 0,
  wallet_balance NUMERIC(10,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- B4
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  capacity INTEGER DEFAULT 100,
  tickets_sold INTEGER DEFAULT 0,
  price NUMERIC(10,2) DEFAULT 0,
  image_url TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  user_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  order_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Deployment Info

- **Makaystore:** `makaystore-sandy.vercel.app` | `D:/AP/projects/makaystore`
- **Vercel token:** in `credentials_vercel_kryptyk.md` (memory)
- **DB:** Neon — `ep-raspy-forest-at258m7w-pooler.c-9.us-east-1.aws.neon.tech`
- **FAL key:** `02893c1a-a829-4893-b89b-df1bd100c5f3:f5b9371cbd61883f410b40a677e9ed94` (needs balance top-up)
- **TripoSR Railway token:** `abb684e5-f40b-431f-a166-866bb70f92e7`
