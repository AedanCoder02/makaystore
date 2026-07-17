# Makay Store — Improvement Plan 2
**Created:** 2026-07-17  
**Resume trigger:** "continue improvement plan 2"  
**Status at compact:** tutorialStore.skip() fix committed, TripoSR has_vertex_color fix committed (not yet deployed to Railway)

---

## What Was Already Fixed (do NOT redo)
- `tutorialStore.skip()` now marks tutorial as completed → auto-show will stop repeating
- `server.py` TripoSR: `extract_mesh(..., has_vertex_color=False)` — committed, deploy needed
- All `completed.includes()` calls replaced with `isCompleted()` in all panel components

---

## Deploy Queue (do these FIRST after compact)

### 1. Deploy TripoSR fix to Railway
```
cd D:/AP/projects/tripo-server
$env:RAILWAY_TOKEN = "abb684e5-f40b-431f-a166-866bb70f92e7"
npx @railway/cli up --detach
```
Railway project: stellar-manifestation / makay-tripo-server  
Public URL: makay-tripo-server-production.up.railway.app

### 2. Deploy makaystore to Vercel after all code changes
```
cd D:/AP/projects/makaystore
npx vercel --prod --token VERCEL_TOKEN_REDACTED --yes
```

---

## Issues To Fix (in order of priority)

### ISSUE 1 — Admin Sidebar: broken links + redundancy with dashboard
**Problem:** Sidebar links to /admin/products, /admin/orders, /admin/workers, /admin/settings — none exist. Dashboard nav cards duplicate the sidebar but point to different routes. Causes confusion.

**Fix — AdminSidebar.tsx (`src/components/AdminSidebar.tsx`):**
Replace SIDEBAR_ITEMS with these 8 working routes:
```
{ label: 'Panel',      href: '/admin/dashboard',         icon: LayoutDashboard }
{ label: 'Productos',  href: '/admin/products/create-3d', icon: Package }
{ label: 'Pedidos',    href: '/admin/orders',             icon: ShoppingBag }   ← NEW page
{ label: 'Usuarios',   href: '/admin/users',              icon: Users }          ← NEW page
{ label: 'Reportes',   href: '/admin/reports',            icon: BarChart2 }
{ label: 'Rotación',   href: '/admin/rotation',           icon: RefreshCw }
{ label: 'Marketing',  href: '/admin/editor',             icon: Pencil }
{ label: 'Tema',       href: '/admin/theme',              icon: Palette }
```
Use lucide-react icons (no emoji). Add i18n via `useTranslations('admin')` keys.

**Fix — AdminDashboard.tsx (`src/components/AdminDashboard.tsx`):**
Nav cards must match sidebar exactly (same 7 sections minus Panel = 7 cards).
Each card links to the same href as the sidebar. Remove old broken links.
Live stats strip already works — keep it.
Add "Usuarios" card with description "Gestionar roles y permisos".

---

### ISSUE 2 — Create /admin/orders page
**File:** `src/app/admin/orders/page.tsx`  
**API:** `src/app/api/admin/orders/route.ts`

API — GET all seller_orders with seller name lookup from Clerk:
```sql
SELECT so.*, u.name FROM seller_orders so ORDER BY created_at DESC LIMIT 200
```
Use `clerkClient().users.getUser(seller_id)` to get seller name.

Page — table with columns: Order #, Seller, Client, Total, Items, Date, Payment Method  
Filter by seller dropdown (Clerk users with seller/worker role).  
No delete/edit needed — read-only admin view.  
Wrap in AdminSidebar layout. Add help-button for admin-tour tutorial replay.

---

### ISSUE 3 — Create /admin/users page (role management)
**File:** `src/app/admin/users/page.tsx`  
**API:** `src/app/api/admin/users/route.ts` (GET list) + `src/app/api/admin/users/[id]/route.ts` (PATCH role)

**API GET:** Use `clerkClient().users.getUserList({ limit: 200 })` — return id, fullName, email, role from publicMetadata, createdAt.

**API PATCH:** `clerkClient().users.updateUserMetadata(id, { publicMetadata: { role } })` — allowed roles: customer, seller, supervisor, admin.

**Page UI:**
- Title: "Gestión de Usuarios / User Management"
- Search input to filter by name/email
- Table: Avatar, Name, Email, Role badge (color-coded), Role dropdown select, Save button
- Role colors: customer=teal, seller=gold, supervisor=orange, admin=purple
- Show confirmation toast after save
- Wrap in AdminSidebar layout

---

### ISSUE 4 — Reports: Wire CostMarginReport to real data
**File:** `src/components/CostMarginReport.tsx`  
**API:** `src/app/api/admin/reports/cost/route.ts`

Strategy: Use actual revenue from seller_orders + a stored cost_percentage from theme_settings (default 40%). Admin can adjust the cost % via a small input on the report page.

API:
```sql
SELECT SUM(subtotal::numeric) AS revenue FROM seller_orders WHERE created_at >= date_trunc('month', NOW())
-- Also fetch cost_percentage from theme_settings WHERE key = 'cost_percentage' (default '40')
```
Returns: { revenue, costPercent, totalCost, grossMargin, profit }

Component changes:
- Add useEffect to fetch from /api/admin/reports/cost
- Add small "Cost % settings" input (save to theme_settings via PATCH /api/admin/theme)
- Show real numbers for revenue/cost/margin/profit
- Chart: last 30-day revenue trend used to project margin (same endpoint as sales chart data)

---

### ISSUE 5 — Reports: Wire GoalsReport to real data
**File:** `src/components/GoalsReport.tsx`  
**API:** `src/app/api/admin/reports/goals/route.ts`

Strategy: Monthly target stored in theme_settings key='monthly_target' (default 400000). Actual = sum of seller_orders this month.

API:
```sql
SELECT SUM(subtotal::numeric) AS actual FROM seller_orders WHERE created_at >= date_trunc('month', NOW())
-- fetch monthly_target from theme_settings WHERE key = 'monthly_target'
```
Returns: { target, actual, progress, daysLeft, daysInMonth, projectedMonthEnd }

Component changes:
- Fetch real data on mount
- Show editable target input (PUT to theme_settings via /api/admin/theme)
- Milestones: keep 3-4 meaningful ones tied to actual data (e.g., "First 50k", "100 orders" — mark done based on actual data)
- Remove hardcoded "in June" — use current month name from JS Date

---

### ISSUE 6 — Seller Dashboard: English labels when page is Spanish
**File:** `src/components/seller/SellerDashboard.tsx`  
Also affects: SellerSell.tsx, SellerProducts.tsx, SellerStock.tsx header labels

**Add to en.json under "seller" key:**
```json
"seller": {
  "dashboard": "Dashboard",
  "welcome": "Welcome back — here's your overview.",
  "revenue": "Total Revenue",
  "recentOrders": "Recent Orders",
  "productsTracked": "Products Tracked",
  "unitsInStock": "Units in Stock",
  "quickActions": "Quick Actions",
  "sellToClient": "Sell to Client",
  "sellToClientDesc": "Process a sale on behalf of a customer",
  "manageProducts": "Manage Products",
  "manageProductsDesc": "Edit prices, descriptions and images",
  "updateStock": "Update Stock",
  "updateStockDesc": "Adjust inventory quantities",
  "myActivity": "My Activity",
  "myActivityDesc": "Track your shifts and clock in/out",
  "recentSales": "Recent Sales",
  "noSales": "No sales yet.",
  "items": "item(s)",
  "showTutorial": "Show tutorial"
}
```

**Add to es.json under "seller" key:**
```json
"seller": {
  "dashboard": "Panel",
  "welcome": "Bienvenido — aquí está tu resumen.",
  "revenue": "Ingresos Totales",
  "recentOrders": "Pedidos Recientes",
  "productsTracked": "Productos Rastreados",
  "unitsInStock": "Unidades en Stock",
  "quickActions": "Acciones Rápidas",
  "sellToClient": "Vender a Cliente",
  "sellToClientDesc": "Procesa una venta en nombre del cliente",
  "manageProducts": "Gestionar Productos",
  "manageProductsDesc": "Editar precios, descripciones e imágenes",
  "updateStock": "Actualizar Stock",
  "updateStockDesc": "Ajustar cantidades de inventario",
  "myActivity": "Mi Actividad",
  "myActivityDesc": "Registra tus turnos y fichaje",
  "recentSales": "Ventas Recientes",
  "noSales": "Aún no hay ventas.",
  "items": "artículo(s)",
  "showTutorial": "Mostrar tutorial"
}
```

**Update SellerDashboard.tsx:** Replace all hardcoded English strings with `t('...')` using `useTranslations('seller')`.

---

### ISSUE 7 — Supervisor panel: scrolling problem
**File:** `src/styles/supervisor-dashboard.css`

The `.supervisor-dashboard-container` currently uses `min-height: 100vh` which can cause overflow. The supervisor page renders inside a flex layout that may restrict height.

**Fix:** 
```css
.supervisor-dashboard-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem 4rem;   /* add bottom padding */
  background: #f9f7f4;
  min-height: 100vh;
  overflow-x: hidden;
}
```

Also check if the supervisor page is wrapped in a parent with `overflow: hidden` — if so, set `height: auto` on the parent.

---

### ISSUE 8 — Tutorials: Expand all to be comprehensive

**Supervisor tutorial** (supervisor-approve) — expand from 4 steps to 10:
```
step-1: Dashboard overview → .dashboard-header
step-2: Team chips (who's clocked in) → .worker-profile-list
step-3: Worker status cards → .worker-status-overview
step-4: Live activity feed → .dashboard-content (first .sup-section)
step-5: Sales performance section → .sup-section:nth-child(2) or just .dashboard-content
step-6: Task board → .task-board (assign + track tasks)
step-7: Performance rankings → .performance-rankings or .dashboard-content
step-8: Alerts panel → .alerts-panel
step-9: Approve activity entries → .activity-approval-list
step-10: Help button → .help-button (actionText: "Got it")
```

**Admin tutorial** (admin-tour) — expand from 5 steps to 8:
```
step-1: Welcome → .dashboard-header
step-2: Live stats strip → .admin-stats-strip
step-3: Products & 3D → .admin-nav-card:first-child
step-4: Orders → .admin-nav-card:nth-child(2)
step-5: Users & Roles → .admin-nav-card:nth-child(3)
step-6: Reports → .admin-nav-card:nth-child(4)
step-7: Sidebar navigation → .admin-sidebar
step-8: Help button → .help-button (actionText: "Let's go")
```

**Seller dashboard tutorial** (seller-dashboard-tour) — expand from 4 to 7:
```
step-1: Stats grid → .seller-stats-grid
step-2: Revenue card → .seller-stat-card:first-child
step-3: Quick actions → .seller-action-grid
step-4: Sell to Client → .seller-action-card.primary
step-5: Recent sales table → .seller-recent (or .seller-orders-list)
step-6: Sidebar navigation → .seller-sidebar-nav
step-7: Help button → .help-button (actionText: "Let's sell")
```

**For all new steps:** add i18n strings to en.json + es.json under `tutorials.tours.{id}.steps.{step-id}`.

---

### ISSUE 9 — Admin dashboard: section overview before entering
Each admin section card should show a live mini-stat:
- Productos card → show "15 products" from stats
- Pedidos card → show "X orders" from stats  
- Usuarios card → show "X users" from Clerk
- Reportes card → show "this month: $X" from stats

This requires updating `AdminNavCard.tsx` to accept an optional `stat` string prop.

**File:** `src/components/AdminNavCard.tsx` — add optional `stat?: string` prop, render as small badge on card.

---

## File Reference Map

| What | File path |
|------|-----------|
| Tutorial store | src/stores/tutorialStore.ts |
| Tutorial definitions | src/lib/tutorials.ts |
| Tutorial overlay | src/components/TutorialOverlay.tsx |
| Admin sidebar | src/components/AdminSidebar.tsx |
| Admin dashboard | src/components/AdminDashboard.tsx |
| Admin nav card | src/components/AdminNavCard.tsx |
| Admin layout wrapping | None — each page includes AdminSidebar |
| Admin orders page | src/app/admin/orders/page.tsx (CREATE) |
| Admin users page | src/app/admin/users/page.tsx (CREATE) |
| Admin users API | src/app/api/admin/users/route.ts (CREATE) |
| Admin users PATCH | src/app/api/admin/users/[id]/route.ts (CREATE) |
| Admin orders API | src/app/api/admin/orders/route.ts (CREATE) |
| Cost report | src/components/CostMarginReport.tsx |
| Goals report | src/components/GoalsReport.tsx |
| Cost API | src/app/api/admin/reports/cost/route.ts (CREATE) |
| Goals API | src/app/api/admin/reports/goals/route.ts (CREATE) |
| Seller dashboard | src/components/seller/SellerDashboard.tsx |
| en.json | src/i18n/en.json |
| es.json | src/i18n/es.json |
| Supervisor CSS | src/styles/supervisor-dashboard.css |
| TripoSR server | D:/AP/projects/tripo-server/server.py (DONE, deploy needed) |

---

## Build Order After Compact

1. Deploy TripoSR to Railway (token above)
2. Fix AdminSidebar.tsx
3. Update AdminDashboard.tsx nav cards
4. Create /admin/orders page + API
5. Create /admin/users page + API (GET + PATCH)
6. Wire CostMarginReport (create /api/admin/reports/cost)
7. Wire GoalsReport (create /api/admin/reports/goals)
8. Add "seller" namespace to en.json + es.json
9. Update SellerDashboard.tsx with i18n
10. Expand tutorials in tutorials.ts (supervisor to 10 steps, admin to 8, seller dashboard to 7)
11. Add new tutorial step strings to en.json + es.json
12. Fix supervisor-dashboard.css scrolling
13. Build check: npx tsc --noEmit 2>&1 | grep "^src/"
14. Deploy makaystore to Vercel

---

## Key Tokens / Config (do NOT ask user for these)
- Vercel token: `VERCEL_TOKEN_REDACTED`
- Railway TripoSR token: `abb684e5-f40b-431f-a166-866bb70f92e7`
- Makaystore live URL: `https://makaystore-sandy.vercel.app`
- TripoSR Railway URL: `https://makay-tripo-server-production.up.railway.app`
- DB: Neon (ep-raspy-forest-at258m7w-pooler.c-9.us-east-1.aws.neon.tech)
- Makaystore path: `D:/AP/projects/makaystore`
- TripoSR server path: `D:/AP/projects/tripo-server`
