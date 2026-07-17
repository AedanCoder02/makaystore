# Makay Store — Panel Improvement Plan
**Created:** 2026-07-17  
**Resume trigger:** "continue panel improvements"

---

## Role Structure (simplified)

| Role | Access | Profile |
|------|--------|---------|
| customer | Storefront, member card, bio, wallet | ClientProfile — already built, do not touch |
| seller | Seller panel + clock in/out + tasks (merged worker+seller) | SellerProfile (new) |
| supervisor | Team management + seller oversight | SupervisorProfile (new) |
| admin | Everything | AdminProfile (new) |

**Worker role migration:** `worker` role in Clerk treated as `seller` everywhere — middleware, layout guards, and sidebar all accept both. No breaking changes for existing accounts.

---

## Foundation Issues (fix first, affect all panels)

### A. Tutorial — first-visit-only, no repeat popups
- Auto-show pattern: `tutorialStore.isCompleted(id)` — standardize this across ALL components
- Some pages use `completed.includes(id)` (fragile) — replace all with `isCompleted(id)`
- After first visit: auto-show never fires again; HelpCircle button replays anytime
- Audit: every page that has a tutorial must have a visible HelpCircle button

### B. Tutorial i18n (EN/ES)
- Current: all tutorial strings hardcoded English in tutorials.ts
- Fix: move all title/description strings into en.json + es.default.json under `tutorials.tours.*`
- TutorialOverlay uses `useTranslations('tutorials')` at render time
- Overlay rendering/positioning logic unchanged — only the string source changes

---

## Panel 1 — Seller (merged seller + worker) — /seller/*

### Role access
- Seller layout accepts role === 'seller' || role === 'worker' (backward compat)
- Supervisor and admin can also access seller panel

### Current seller panel issues
- Missing tutorial definitions: seller-stock-tour, seller-products-tour
- Dashboard: no empty state for orders, no revenue trend visual
- SellerProducts: no thumbnail in table, no type badge color coding
- SellerStock: no visual low-stock warning on rows
- SellerSell: no product images in selection list
- Mixed button CSS classes — normalize to seller-btn-primary / seller-btn-ghost

### Worker (activity) — add to seller panel
- Add `/seller/activity` page (move from /worker/activity)
- Add "My Activity" to SellerSidebar (Clock icon)
- Clock in/out must persist to DB (activities table — currently only Zustand)
- API: POST /api/seller/clock-in, POST /api/seller/clock-out, GET /api/seller/activity

### Seller panel fixes list
1. Add seller-stock-tour, seller-products-tour to TUTORIAL_DEFINITIONS
2. Standardize all tutorial auto-show to tutorialStore.isCompleted()
3. SellerDashboard: revenue chart from seller_orders (last 7 days), empty state for orders table
4. SellerProducts: product thumbnail column + Storefront/Dropshipping color badge
5. SellerStock: red row highlight when currentStock < 5, green badge when > 20
6. SellerSell: product images in selection step
7. /seller/activity page: clock in/out wired to DB, activity log from DB, today's stats card

### SellerProfile (/profile when role=seller or worker)
Component: src/components/profile/SellerProfile.tsx
Sections:
- Personal info: avatar, name, role badge "Seller" (gold), member since
- Sales this month: revenue, units sold, avg order value (from seller_orders)
- Shift today: clocked-in time, hours worked, status dot
- Top 3 products sold this month
- Recent orders (last 5)
- Activity log (last 10 clock events from activities table)
- Quick links: /seller/dashboard, /seller/products, /seller/activity, /seller/products/create-3d

---

## Panel 2 — Supervisor (/supervisor/dashboard)

### Critical issue: ALL data is mock
supervisorStore.ts hardcodes Alice/Bob/Carol across all 9 sections.
Every section needs real DB wiring.

### DB changes needed
Create tasks table:
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,  -- clerk_id
  status      TEXT DEFAULT 'pending',
  priority    TEXT DEFAULT 'medium',
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### API routes to create
- GET /api/supervisor/sellers — sellers+workers from Clerk + today's activity from DB
- GET /api/supervisor/activity — recent activity from activities table (all sellers)
- GET /api/supervisor/sales — today's seller_orders grouped by seller
- GET /api/supervisor/tasks — tasks table
- POST /api/supervisor/tasks — create task (assigned_to = seller clerk_id)
- PATCH /api/supervisor/tasks/:id — update status
- POST /api/supervisor/approve — approve/reject activity entry in activities table

### Component fixes (replace mock with real data)
- WorkerStatusOverview → real sellers from /api/supervisor/sellers
- LiveActivityFeed → real from /api/supervisor/activity
- SalesPerformance → real from /api/supervisor/sales
- TaskBoard → real from /api/supervisor/tasks, POST/PATCH on changes
- AlertsPanel → derive from DB: low stock < 5 (products table), seller > 10h clocked with no clock-out
- ShiftOverview → calculate from activities table (clock-in/out pairs)
- ActivityApprovalList → real pending approvals from activities table
- QuickActions "Assign Task" → POST /api/supervisor/tasks

### Add missing tutorial definitions
- supervisor-approve already exists — verify it points to real elements
- Add supervisor-tasks-tour

### SupervisorProfile (/profile when role=supervisor)
Component: src/components/profile/SupervisorProfile.tsx
Sections:
- Personal info + "Supervisor" badge (orange)
- Team: X sellers active today / X total on roster
- Today's pending approvals count (with link to dashboard)
- Week summary: total team hours, total sales value
- Seller roster (name, status dot, today's hours) — read-only
- Quick links: /supervisor/dashboard
- Permissions: can view seller profiles; cannot edit products, marketing, financial config

---

## Panel 3 — Admin (/admin/*)

### Current issues
- Reports (/admin/reports): 5 tab placeholders, no real data
- Rotation (/admin/rotation): mock status badges, actions not wired
- AdminDashboard: nav cards plain, no live stat header
- Missing tutorials: admin-reports-tour, admin-rotation-tour

### Fixes
1. AdminDashboard header: live stats (total products, active sellers today, orders this month)
2. Reports — Sales tab: seller_orders grouped by date, last 30 days → AreaChart
3. Reports — Inventory tab: product_stock for all products → BarChart
4. Reports — Goals tab: actual revenue vs target (target stored in theme_settings as 'goals:monthly_target')
5. Reports — Rotation tab: keep placeholder, wire later
6. Rotation page: fetch products from /api/products; PATCH /api/admin/products/:id/status for rotation
7. BulkRotationActions: POST /api/admin/rotation/schedule (stored in theme_settings)
8. Add admin-reports-tour, admin-rotation-tour to TUTORIAL_DEFINITIONS

### AdminProfile (/profile when role=admin)
Component: src/components/profile/AdminProfile.tsx
Sections:
- Personal info + "Administrator" badge (purple, premium styling)
- System health: users by role count, total orders this month, products in DB
- Revenue this month vs last month (from seller_orders)
- User management: list all Clerk users with roles, change role button → PATCH /api/admin/users/:id/role
- Quick actions: links to all admin sections
- Full access: can view all data, all profiles, all controls

---

## Profile Route (src/app/profile/page.tsx)

```
customer    → ClientProfile (existing — do not modify)
seller      → SellerProfile (new)
worker      → SellerProfile (same component, backward compat)
supervisor  → SupervisorProfile (new)
admin       → AdminProfile (new)
```

All new components in: src/components/profile/

Role badge colors:
- customer: teal (#4A9FB5)
- seller/worker: gold (#D4AF37)
- supervisor: orange (#F97316)
- admin: purple (#7C3AED)

---

## Build Order After Compact

1. Foundation: tutorial i18n strings in JSON files, standardize isCompleted() across all pages
2. Seller panel: add activity page + DB wiring, add missing tutorials, polish UI
3. SellerProfile component
4. Supervisor: create tasks table, build API routes, replace all mock data
5. SupervisorProfile component
6. Admin: wire reports charts, rotation, admin header stats
7. AdminProfile component
8. Final audit: HelpCircle button on every panel page, tutorials in EN+ES, no repeat auto-popups

---

## Key Files Reference

| What | Where |
|------|-------|
| Tutorial definitions | src/lib/tutorials.ts |
| Tutorial store | src/stores/tutorialStore.ts |
| Tutorial overlay component | src/components/TutorialOverlay.tsx |
| Profile route | src/app/profile/page.tsx |
| Profile components | src/components/profile/ |
| Supervisor store (all mock — replace) | src/stores/supervisorStore.ts |
| Supervisor dashboard component | src/components/SupervisorDashboardPage.tsx |
| Worker activity hook (move to seller) | src/hooks/useWorkerActivity.ts |
| Seller layout (add worker role) | src/app/seller/layout.tsx |
| Seller sidebar (add My Activity) | src/components/seller/SellerSidebar.tsx |
| DB client | src/lib/db.ts |
| Activities table | Neon — activities (exists) |
| Tasks table | Neon — TO CREATE |
