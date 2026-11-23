# Location Data Model + Panel Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `products`, `orders`, and `seller_orders` a `location` column (`'guacuco' | 'la_marina'`), add a staff-facing location switcher to the admin/seller/supervisor panels, and make every storefront and backoffice query in this repo respect the right location.

**Architecture:** One shared `src/lib/location.ts` module defines the two valid locations and two separate resolution strategies: `STORE_LOCATION` (a build-time env var — which location *this deployment's public storefront* serves) and `getPanelLocation()` (a cookie staff can switch at runtime, for the shared backoffice). Public storefront routes stamp/filter by `STORE_LOCATION`; backoffice routes stamp/filter by the cookie. A DB migration script adds the column and backfills existing rows to `'guacuco'`.

**Tech Stack:** Next.js 16 App Router, `postgres` npm package (tagged-template SQL, no ORM), Jest + React Testing Library, Clerk auth, lucide-react icons.

**Spec:** `D:\AP\projects\makaystore\docs\superpowers\specs\2026-10-10-location-selector-and-la-marina-design.md`

## Global Constraints

- Two valid location values only: `'guacuco'` and `'la_marina'` — no other strings are ever valid.
- Existing rows in `products`, `orders`, `seller_orders` backfill to `'guacuco'` — never left NULL, never defaulted to anything else.
- No shared SKUs between locations (catalogs are fully separate per the spec) — this plan does not attempt to let one product belong to both locations.
- Membership, wallet, credit, and user-profile data stay global — this plan must not add a `location` column to any table outside `products`, `orders`, `seller_orders`.
- Follow the codebase's existing migration convention (`scripts/migrate-NNN.mjs`, one-off Node scripts using the `postgres` package) rather than introducing a new migration framework.
- Follow the codebase's existing inline-`ensureColumns()`/`ensureTable()` convention inside API routes for forward-compatible schema guards, rather than relying solely on the one-off script.

## Review Focus

- A staff member switches the panel location, then immediately creates a seller order — the order must be stamped with the *new* location, not whatever was cached from the previous page load. Covered in Task 5's seller-orders POST test.
- A request arrives with no `panel_location` cookie set at all (first-ever visit to the backoffice) — `getPanelLocation()` must default to `'guacuco'`, not throw or return `undefined`. Covered in Task 1.
- A request arrives with a tampered/invalid cookie value (e.g. `panel_location=drop-table`) — must fall back to `'guacuco'`, never be interpolated into SQL. Covered in Task 1 and Task 5.
- The storefront `/api/products` and `/api/orders` routes must never read the panel-location cookie — a customer browsing shouldn't be able to see the other location's catalog by forging that cookie. Covered in Task 4 (asserts `STORE_LOCATION`, not cookie, is used).
- Existing seller/admin/supervisor order and product rows created before this migration must still show up after it ships (backfilled to `'guacuco'`, not hidden by a `NOT NULL` filter that excludes legacy NULLs). Covered in Task 2's migration script and its verification query.

---

## File Structure

- `src/lib/location.ts` — **create**. Location type, validator, `STORE_LOCATION` constant, `getPanelLocation()`.
- `__tests__/lib/location.test.ts` — **create**. Unit tests for the above.
- `scripts/migrate-009.mjs` — **create**. One-off DB migration: add + backfill `location` columns.
- `src/components/LocationSwitcher.tsx` — **create**. Shared switcher UI used by all three sidebars.
- `__tests__/components/LocationSwitcher.test.tsx` — **create**.
- `src/styles/location-switcher.css` — **create**. Styles for the switcher.
- `src/app/layout.tsx` — **modify**. Import the new CSS file (alongside the other `@/styles/*.css` imports).
- `src/components/AdminSidebar.tsx` — **modify**. Render `<LocationSwitcher />`.
- `src/components/seller/SellerSidebar.tsx` — **modify**. Render `<LocationSwitcher />`.
- `src/components/SupervisorSidebar.tsx` — **modify**. Render `<LocationSwitcher />`.
- `src/app/api/products/route.ts` — **modify**. Filter by `STORE_LOCATION`.
- `src/app/api/orders/route.ts` — **modify**. Stamp + filter by `STORE_LOCATION`.
- `src/app/api/seller/products/route.ts` — **modify**. Stamp + filter by `getPanelLocation()`.
- `src/app/api/seller/orders/route.ts` — **modify**. Stamp + filter by `getPanelLocation()`.
- `src/app/api/admin/orders/route.ts` — **modify**. Filter both sub-queries by `getPanelLocation()`.
- `src/app/api/supervisor/orders/route.ts` — **modify**. Filter by `getPanelLocation()`.
- `src/app/api/admin/reports/sales/route.ts` — **modify**. Filter each sub-query by `getPanelLocation()`.
- `src/app/api/admin/reports/stock/route.ts` — **modify**. Filter by `getPanelLocation()`.
- `src/app/api/admin/reports/cost/route.ts` — **modify**. Filter by `getPanelLocation()`.
- `src/app/api/admin/reports/goals/route.ts` — **modify**. Filter actuals by `getPanelLocation()`.

---

### Task 1: `src/lib/location.ts` — location type, validator, resolvers

**Files:**
- Create: `src/lib/location.ts`
- Test: `__tests__/lib/location.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces: `StoreLocation` type (`'guacuco' | 'la_marina'`), `LOCATIONS: StoreLocation[]`, `isStoreLocation(value: unknown): value is StoreLocation`, `STORE_LOCATION: StoreLocation` (module-level constant), `PANEL_LOCATION_COOKIE: string`, `async function getPanelLocation(): Promise<StoreLocation>`.

- [ ] **Step 1: Write the failing tests**

```ts
// __tests__/lib/location.test.ts
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

import { cookies } from 'next/headers';

describe('isStoreLocation', () => {
  it('accepts guacuco and la_marina', async () => {
    const { isStoreLocation } = await import('@/lib/location');
    expect(isStoreLocation('guacuco')).toBe(true);
    expect(isStoreLocation('la_marina')).toBe(true);
  });

  it('rejects anything else', async () => {
    const { isStoreLocation } = await import('@/lib/location');
    expect(isStoreLocation('madrid')).toBe(false);
    expect(isStoreLocation(undefined)).toBe(false);
    expect(isStoreLocation(null)).toBe(false);
    expect(isStoreLocation(123)).toBe(false);
  });
});

describe('LOCATIONS', () => {
  it('lists exactly the two valid locations', async () => {
    const { LOCATIONS } = await import('@/lib/location');
    expect(LOCATIONS).toEqual(['guacuco', 'la_marina']);
  });
});

describe('STORE_LOCATION', () => {
  const ORIGINAL_ENV = process.env.STORE_LOCATION;

  afterEach(() => {
    process.env.STORE_LOCATION = ORIGINAL_ENV;
    jest.resetModules();
  });

  it('defaults to guacuco when STORE_LOCATION is unset', async () => {
    delete process.env.STORE_LOCATION;
    jest.resetModules();
    const { STORE_LOCATION } = await import('@/lib/location');
    expect(STORE_LOCATION).toBe('guacuco');
  });

  it('uses STORE_LOCATION when it is a valid location', async () => {
    process.env.STORE_LOCATION = 'la_marina';
    jest.resetModules();
    const { STORE_LOCATION } = await import('@/lib/location');
    expect(STORE_LOCATION).toBe('la_marina');
  });

  it('falls back to guacuco when STORE_LOCATION is invalid', async () => {
    process.env.STORE_LOCATION = 'nonsense';
    jest.resetModules();
    const { STORE_LOCATION } = await import('@/lib/location');
    expect(STORE_LOCATION).toBe('guacuco');
  });
});

describe('getPanelLocation', () => {
  afterEach(() => jest.resetModules());

  it('defaults to guacuco when no cookie is set', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => undefined });
    const { getPanelLocation } = await import('@/lib/location');
    expect(await getPanelLocation()).toBe('guacuco');
  });

  it('returns la_marina when the cookie is set to la_marina', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => ({ value: 'la_marina' }) });
    const { getPanelLocation } = await import('@/lib/location');
    expect(await getPanelLocation()).toBe('la_marina');
  });

  it('falls back to guacuco when the cookie value is invalid', async () => {
    (cookies as jest.Mock).mockResolvedValue({ get: () => ({ value: 'drop-table' }) });
    const { getPanelLocation } = await import('@/lib/location');
    expect(await getPanelLocation()).toBe('guacuco');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- __tests__/lib/location.test.ts`
Expected: FAIL — `Cannot find module '@/lib/location'`

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/location.ts
import { cookies } from 'next/headers';

export type StoreLocation = 'guacuco' | 'la_marina';

export const LOCATIONS: StoreLocation[] = ['guacuco', 'la_marina'];

export function isStoreLocation(value: unknown): value is StoreLocation {
  return value === 'guacuco' || value === 'la_marina';
}

/**
 * Which location this deployment's public storefront serves.
 * Set via STORE_LOCATION env var per app (the Guacuco app leaves it unset/'guacuco';
 * the La Marina fork sets STORE_LOCATION=la_marina).
 */
export const STORE_LOCATION: StoreLocation = isStoreLocation(process.env.STORE_LOCATION)
  ? process.env.STORE_LOCATION
  : 'guacuco';

/** Backoffice-only: cookie name staff use to switch which location's data they're viewing. */
export const PANEL_LOCATION_COOKIE = 'panel_location';

/** Backoffice-only: which location the current admin/seller/supervisor session is viewing. */
export async function getPanelLocation(): Promise<StoreLocation> {
  const store = await cookies();
  const value = store.get(PANEL_LOCATION_COOKIE)?.value;
  return isStoreLocation(value) ? value : 'guacuco';
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- __tests__/lib/location.test.ts`
Expected: PASS (all 10 cases)

- [ ] **Step 5: Commit**

```bash
git add src/lib/location.ts __tests__/lib/location.test.ts
git commit -m "feat: add location type, validator, and resolvers"
```

---

### Task 2: DB migration — add and backfill `location` columns

**Files:**
- Create: `scripts/migrate-009.mjs`

**Interfaces:**
- Consumes: `process.env.DATABASE_URL` (same Neon connection string every other script in `scripts/` uses).
- Produces: `products.location`, `orders.location`, `seller_orders.location` columns, `TEXT NOT NULL DEFAULT 'guacuco'`, with indexes for the filtered queries later tasks add.

- [ ] **Step 1: Write the migration script**

```js
// scripts/migrate-009.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

await sql.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'guacuco';`);
await sql.unsafe(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'guacuco';`);
await sql.unsafe(`ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS location TEXT NOT NULL DEFAULT 'guacuco';`);

await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);`);
await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location);`);
await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_seller_orders_location ON seller_orders(location);`);

console.log('products/orders/seller_orders.location columns ready, backfilled to guacuco');

await sql.end();
console.log('Migration 009 complete');
```

- [ ] **Step 2: Run it against the dev DB**

Run: `DATABASE_URL="<Neon connection string from credentials_makay_resend.md / project memory>" node scripts/migrate-009.mjs`
Expected output: `products/orders/seller_orders.location columns ready, backfilled to guacuco` then `Migration 009 complete`

- [ ] **Step 3: Verify manually**

Run a one-off check (same `DATABASE_URL`):

```bash
node -e "
import('postgres').then(async ({ default: postgres }) => {
  const sql = postgres(process.env.DATABASE_URL);
  const rows = await sql\`SELECT location, COUNT(*) FROM products GROUP BY location\`;
  console.log(rows);
  await sql.end();
});
"
```

Expected: a single row `{ location: 'guacuco', count: <existing product count> }` — confirms every pre-existing row was backfilled and no row is NULL or any other value.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-009.mjs
git commit -m "feat: migrate products/orders/seller_orders to add location column"
```

---

### Task 3: `LocationSwitcher` component + wire into the three sidebars

**Files:**
- Create: `src/components/LocationSwitcher.tsx`
- Create: `src/styles/location-switcher.css`
- Test: `__tests__/components/LocationSwitcher.test.tsx`
- Modify: `src/app/layout.tsx:32` (seller.css import line — add the new CSS import next to it)
- Modify: `src/components/AdminSidebar.tsx`
- Modify: `src/components/seller/SellerSidebar.tsx`
- Modify: `src/components/SupervisorSidebar.tsx`

**Interfaces:**
- Consumes: `LOCATIONS`, `PANEL_LOCATION_COOKIE`, `isStoreLocation`, `StoreLocation` from `@/lib/location` (Task 1).
- Produces: `export default function LocationSwitcher({ collapsed }: { collapsed?: boolean })` — a client component with no other props, safe to drop into any sidebar.

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/LocationSwitcher.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LocationSwitcher from '@/components/LocationSwitcher';

function setCookie(value: string) {
  document.cookie = `panel_location=${value}`;
}

beforeEach(() => {
  document.cookie = 'panel_location=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload: jest.fn() },
    writable: true,
  });
});

describe('LocationSwitcher', () => {
  it('renders both location buttons', () => {
    render(<LocationSwitcher />);
    expect(screen.getByRole('button', { name: 'Guacuco' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'La Marina' })).toBeInTheDocument();
  });

  it('defaults to Guacuco as active when no cookie is set', () => {
    render(<LocationSwitcher />);
    expect(screen.getByRole('button', { name: 'Guacuco' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('reflects an existing la_marina cookie as active', () => {
    setCookie('la_marina');
    render(<LocationSwitcher />);
    expect(screen.getByRole('button', { name: 'La Marina' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('writes the cookie and reloads when a location is clicked', () => {
    render(<LocationSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'La Marina' }));
    expect(document.cookie).toContain('panel_location=la_marina');
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('renders nothing when collapsed', () => {
    render(<LocationSwitcher collapsed />);
    expect(screen.queryByRole('button', { name: 'Guacuco' })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/LocationSwitcher.test.tsx`
Expected: FAIL — `Cannot find module '@/components/LocationSwitcher'`

- [ ] **Step 3: Write the component**

```tsx
// src/components/LocationSwitcher.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { LOCATIONS, PANEL_LOCATION_COOKIE, isStoreLocation, type StoreLocation } from '@/lib/location';

const LOCATION_LABELS: Record<StoreLocation, string> = {
  guacuco: 'Guacuco',
  la_marina: 'La Marina',
};

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

interface Props {
  collapsed?: boolean;
}

export default function LocationSwitcher({ collapsed }: Props) {
  const [location, setLocation] = useState<StoreLocation>('guacuco');

  useEffect(() => {
    const stored = readCookie(PANEL_LOCATION_COOKIE);
    if (isStoreLocation(stored)) setLocation(stored);
  }, []);

  function selectLocation(next: StoreLocation) {
    document.cookie = `${PANEL_LOCATION_COOKIE}=${next}; path=/; max-age=31536000`;
    setLocation(next);
    window.location.reload();
  }

  if (collapsed) return null;

  return (
    <div className="location-switcher" role="group" aria-label="Ubicación">
      <MapPin size={14} className="location-switcher-icon" />
      {LOCATIONS.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => selectLocation(loc)}
          className={`location-switcher-btn${location === loc ? ' active' : ''}`}
          aria-pressed={location === loc}
        >
          {LOCATION_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
```

```css
/* src/styles/location-switcher.css */
.location-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin: 0 8px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
}

.location-switcher-icon {
  color: var(--makay-mauve, #a89080);
  flex-shrink: 0;
}

.location-switcher-btn {
  flex: 1;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 5px 8px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--makay-mauve, #a89080);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.location-switcher-btn.active {
  background: var(--makay-warm-gold, #d4af37);
  color: #2c2c2c;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/components/LocationSwitcher.test.tsx`
Expected: PASS (all 5 cases)

- [ ] **Step 5: Wire into `src/app/layout.tsx`**

Add, next to the existing `import "@/styles/seller.css";` line:

```ts
import "@/styles/location-switcher.css";
```

- [ ] **Step 6: Wire into `AdminSidebar.tsx`**

In `src/components/AdminSidebar.tsx`, import it at the top (`import LocationSwitcher from './LocationSwitcher';`) and render it right after the brand div and before `<nav>`:

```tsx
<div className="sidebar-brand">
  {!collapsed && <span className="sidebar-brand-name">Makay Admin</span>}
</div>
<LocationSwitcher collapsed={collapsed} />
<nav className="sidebar-nav" aria-label="Admin navigation">
```

- [ ] **Step 7: Wire into `SellerSidebar.tsx`**

In `src/components/seller/SellerSidebar.tsx`, import it (`import LocationSwitcher from '../LocationSwitcher';`) and render after the brand div:

```tsx
<div className="seller-sidebar-brand">
  {!collapsed && <span className="seller-sidebar-role">{t('role')}</span>}
  {!collapsed && <span className="seller-sidebar-sub">{t('storeName')}</span>}
</div>
<LocationSwitcher collapsed={collapsed} />
<nav className="seller-sidebar-nav">
```

- [ ] **Step 8: Wire into `SupervisorSidebar.tsx`**

In `src/components/SupervisorSidebar.tsx`, import it (`import LocationSwitcher from './LocationSwitcher';`) and render after the brand div:

```tsx
<div className="sup-sidebar-brand">
  {!collapsed && <span className="sup-sidebar-role">Supervisor</span>}
  {!collapsed && <span className="sup-sidebar-sub">MAKAY STORE</span>}
</div>
<LocationSwitcher collapsed={collapsed} />
<nav className="sup-sidebar-nav">
```

- [ ] **Step 9: Run the full test suite to check for regressions**

Run: `npm test`
Expected: PASS — no existing sidebar snapshot/test breaks (none of the three sidebars currently have dedicated tests, so this just confirms nothing else broke).

- [ ] **Step 10: Commit**

```bash
git add src/components/LocationSwitcher.tsx src/styles/location-switcher.css \
        __tests__/components/LocationSwitcher.test.tsx src/app/layout.tsx \
        src/components/AdminSidebar.tsx src/components/seller/SellerSidebar.tsx \
        src/components/SupervisorSidebar.tsx
git commit -m "feat: add location switcher to admin/seller/supervisor sidebars"
```

---

### Task 4: Storefront routes use `STORE_LOCATION` (deployment-fixed, never the cookie)

**Files:**
- Modify: `src/app/api/products/route.ts`
- Modify: `src/app/api/orders/route.ts`

**Interfaces:**
- Consumes: `STORE_LOCATION` from `@/lib/location` (Task 1).
- Produces: nothing new consumed elsewhere — these are terminal API routes.

- [ ] **Step 1: Write the failing test**

No existing test file covers these routes (none of this codebase's API routes have tests — only components do). Add the first one, following the component-test style already used elsewhere but exercising the route handler directly:

```ts
// __tests__/api/products.test.ts
const mockRows = [{ id: '1', title: 'Towel', location: 'guacuco' }];
const sqlMock = jest.fn(() => Promise.resolve(mockRows));
jest.mock('@/lib/db', () => ({ __esModule: true, default: sqlMock }));

describe('GET /api/products', () => {
  afterEach(() => jest.clearAllMocks());

  it('queries only STORE_LOCATION\'s catalog', async () => {
    const { GET } = await import('@/app/api/products/route');
    const res = await GET();
    const body = await res.json();
    expect(sqlMock).toHaveBeenCalled();
    const [strings, ...values] = sqlMock.mock.calls[0];
    const queryText = strings.join('?');
    expect(queryText).toContain('p.location =');
    expect(values).toContain('guacuco');
    expect(body).toEqual(mockRows.map((r) => ({ ...r, price: NaN, stock: NaN })).map(({ price, stock, ...rest }) => rest).map((r) => r)); // shape-only check below supersedes this
  });
});
```

Simplify that last loose assertion — the shape is already covered by existing component tests that consume `/api/products`; this test's job is only to pin the location filter:

```ts
  it('queries only STORE_LOCATION\'s catalog', async () => {
    const { GET } = await import('@/app/api/products/route');
    await GET();
    const [strings, ...values] = sqlMock.mock.calls[0];
    const queryText = strings.join('?');
    expect(queryText).toContain('p.location =');
    expect(values).toContain('guacuco');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/api/products.test.ts`
Expected: FAIL — query text does not contain `p.location =` yet

- [ ] **Step 3: Update `src/app/api/products/route.ts`**

```ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { STORE_LOCATION } from '@/lib/location';

export const revalidate = 60;

export async function GET() {
  try {
    const rows = await sql`
      SELECT
        p.id, p.title, p.description, p.category, p.variants, p.sku, p.status,
        COALESCE(po.price, p.price)::numeric AS price,
        COALESCE(po.image_url, p.image) AS image,
        COALESCE(po.product_type, 'storefront') AS product_type,
        COALESCE(SUM(ps.quantity), p.stock)::int AS stock
      FROM products p
      LEFT JOIN product_overrides po ON po.product_id = p.id
      LEFT JOIN product_stock ps ON ps.product_id = p.id
      WHERE p.status = 'active' AND p.location = ${STORE_LOCATION}
      GROUP BY p.id, p.title, p.description, p.category, p.variants, p.sku, p.status,
               po.price, po.image_url, po.product_type
      ORDER BY p.id ASC
    `;
    const parsed = rows.map((r: any) => ({
      ...r,
      variants: typeof r.variants === 'string' ? JSON.parse(r.variants) : r.variants,
      price: parseFloat(r.price),
      stock: Number(r.stock),
    }));
    return NextResponse.json(parsed);
  } catch (e: any) {
    console.error('[/api/products]', e?.message);
    return NextResponse.json({ error: 'Failed to fetch products', detail: e?.message }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/api/products.test.ts`
Expected: PASS

- [ ] **Step 5: Update `src/app/api/orders/route.ts`**

In `ensureTable()`, add the column to the `CREATE TABLE IF NOT EXISTS orders (...)` block (`location TEXT NOT NULL DEFAULT 'guacuco',` next to `status`), import `STORE_LOCATION` from `@/lib/location`, stamp it on every INSERT in this file, and add `AND location = ${STORE_LOCATION}` to the customer's-own-orders `GET` query:

```ts
import { STORE_LOCATION } from '@/lib/location';
// ...
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureTable();

  const rows = await sql`
    SELECT * FROM orders
    WHERE customer_id = ${userId} AND location = ${STORE_LOCATION}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}
```

Every `INSERT INTO orders (...)` further down this file gains a `location` column set to `${STORE_LOCATION}` alongside the other inserted fields.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/app/api/products/route.ts src/app/api/orders/route.ts __tests__/api/products.test.ts
git commit -m "feat: scope storefront products/orders routes to STORE_LOCATION"
```

---

### Task 5: Backoffice routes use `getPanelLocation()` (switchable, never deployment-fixed)

**Files:**
- Modify: `src/app/api/seller/products/route.ts`
- Modify: `src/app/api/seller/orders/route.ts`
- Modify: `src/app/api/admin/orders/route.ts`
- Modify: `src/app/api/supervisor/orders/route.ts`
- Test: `__tests__/api/seller-orders.test.ts`

**Interfaces:**
- Consumes: `getPanelLocation()` from `@/lib/location` (Task 1).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Write the failing test (representative — seller orders POST + GET)**

```ts
// __tests__/api/seller-orders.test.ts
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
const rowsReturned = [{ id: 1 }];
const sqlMock: any = jest.fn(() => Promise.resolve(rowsReturned));
jest.mock('@/lib/db', () => ({ __esModule: true, default: sqlMock }));
jest.mock('@/lib/location', () => ({
  getPanelLocation: jest.fn(() => Promise.resolve('la_marina')),
}));

import { auth } from '@clerk/nextjs/server';

describe('GET /api/seller/orders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters by the current panel location', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    const { GET } = await import('@/app/api/seller/orders/route');
    await GET();
    const [strings, ...values] = sqlMock.mock.calls[0];
    expect(strings.join('?')).toContain('location =');
    expect(values).toContain('la_marina');
  });
});

describe('POST /api/seller/orders', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stamps new orders with the current panel location', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'user_1' });
    const { POST } = await import('@/app/api/seller/orders/route');
    const req = {
      json: async () => ({
        client_id: 'c1', client_name: 'Jane', items: [{ id: 'p1', qty: 1 }], is_gift: true,
      }),
    } as any;
    await POST(req);
    const [strings, ...values] = sqlMock.mock.calls[0];
    expect(strings.join('?')).toContain('location');
    expect(values).toContain('la_marina');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/api/seller-orders.test.ts`
Expected: FAIL — neither query currently references `location`

- [ ] **Step 3: Update `src/app/api/seller/orders/route.ts`**

```ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

interface PaymentEntry {
  method: string;
  amount: number;
  transactionId?: string;
  description?: string;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const rows = await sql`
    SELECT * FROM seller_orders WHERE seller_id = ${userId} AND location = ${location} ORDER BY created_at DESC LIMIT 50
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const { client_id, client_name, client_email, items, subtotal, payment_methods, notes, is_gift } = await req.json();

  if (!client_id || !items?.length) {
    return NextResponse.json({ error: 'client_id y items son requeridos' }, { status: 400 });
  }

  if (is_gift) {
    const row = await sql`
      INSERT INTO seller_orders (seller_id, client_id, client_name, client_email, items, subtotal, payment_method, notes, is_gift, location)
      VALUES (
        ${userId},
        ${client_id},
        ${client_name ?? ''},
        ${client_email ?? ''},
        ${JSON.stringify(items)},
        0,
        ${'[]'},
        ${notes ?? ''},
        TRUE,
        ${location}
      )
      RETURNING *
    `;
    return NextResponse.json(row[0]);
  }

  if (!subtotal) {
    return NextResponse.json({ error: 'subtotal requerido' }, { status: 400 });
  }

  const payments: PaymentEntry[] = Array.isArray(payment_methods) ? payment_methods : [];
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  if (payments.length === 0) {
    return NextResponse.json({ error: 'Al menos un método de pago es requerido' }, { status: 400 });
  }
  if (Math.abs(totalPaid - Number(subtotal)) > 0.02) {
    return NextResponse.json(
      { error: `El total pagado ($${totalPaid.toFixed(2)}) no coincide con el subtotal ($${Number(subtotal).toFixed(2)})` },
      { status: 400 }
    );
  }

  const creditTotal = payments
    .filter(p => p.method === 'credit')
    .reduce((s, p) => s + Number(p.amount), 0);

  if (creditTotal > 0) {
    const profiles = await sql`
      SELECT dollar_balance FROM user_profiles WHERE clerk_id = ${client_id}
    `;
    const balance = Number(profiles[0]?.dollar_balance ?? 0);
    if (balance < creditTotal - 0.001) {
      return NextResponse.json(
        { error: `Saldo Makay insuficiente. Disponible: $${balance.toFixed(2)}, Requerido: $${creditTotal.toFixed(2)}` },
        { status: 400 }
      );
    }
    await sql`
      UPDATE user_profiles
      SET dollar_balance = dollar_balance - ${creditTotal}
      WHERE clerk_id = ${client_id}
    `;
  }

  let row;
  try {
    row = await sql`
      INSERT INTO seller_orders (seller_id, client_id, client_name, client_email, items, subtotal, payment_method, notes, is_gift, location)
      VALUES (
        ${userId},
        ${client_id},
        ${client_name ?? ''},
        ${client_email ?? ''},
        ${JSON.stringify(items)},
        ${subtotal},
        ${JSON.stringify(payments)},
        ${notes ?? ''},
        FALSE,
        ${location}
      )
      RETURNING *
    `;
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? 'DB error';
    console.error('[seller/orders POST insert]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const itemsDesc = (items as { title: string; quantity?: number }[])
    .slice(0, 2).map(i => `${i.title} ×${i.quantity ?? 1}`).join(', ')
    + (items.length > 2 ? ` +${items.length - 2} más` : '');
  await sql`
    INSERT INTO activities (seller_id, type, note, status)
    VALUES (${userId}, 'sale', ${`Venta a ${client_name ?? 'cliente'}: ${itemsDesc} — $${Number(subtotal).toFixed(2)}`}, 'approved')
  `.catch(() => {});

  return NextResponse.json(row[0]);
}
```

- [ ] **Step 4: Update `src/app/api/seller/products/route.ts`**

Import `getPanelLocation`, filter the `GET` list by it, and stamp it on the `POST` insert:

```ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

async function ensureColumns() {
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'`;
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT ''`;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureColumns();
  const location = await getPanelLocation();

  const rows = await sql`
    SELECT id, title, description, price, image, sku, stock, category, status,
           sizes, colors, variants, provider, markup_percent, markup_amount, created_at, updated_at
    FROM products
    WHERE location = ${location}
    ORDER BY provider ASC, title ASC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureColumns();
  const location = await getPanelLocation();

  const body = await req.json();
  const { title, price, description, image, sku, stock, category, status, sizes, colors, provider, markup_percent, markup_amount } = body;

  if (!title || price === undefined) {
    return NextResponse.json({ error: 'title and price required' }, { status: 400 });
  }

  const id = `custom-${Date.now()}`;
  const row = await sql`
    INSERT INTO products (id, title, description, price, image, sku, stock, category, status, sizes, colors, variants, provider, markup_percent, markup_amount, location)
    VALUES (
      ${id},
      ${title},
      ${description ?? ''},
      ${Number(price)},
      ${image ?? ''},
      ${sku ?? ''},
      ${Number(stock ?? 0)},
      ${category ?? ''},
      ${status ?? 'active'},
      ${sizes ?? []},
      ${JSON.stringify(colors ?? [])},
      '[]',
      ${provider ?? ''},
      ${markup_percent ?? false},
      ${Number(markup_amount ?? 0)},
      ${location}
    )
    RETURNING *
  `;
  return NextResponse.json(row[0], { status: 201 });
}
```

The `PATCH` handler further down this same file (bulk status update by `ids[]`) is unaffected — it updates existing rows by `id`, which already belong to a location, so no change is needed there.

- [ ] **Step 5: Update `src/app/api/admin/orders/route.ts`**

Filter both merged sub-queries by the panel location:

```ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();

  try {
    const [sellerOrders, storefrontOrders] = await Promise.all([
      sql`SELECT id, seller_id, client_name, subtotal, items, payment_method, created_at, 'in-person' AS source FROM seller_orders WHERE location = ${location} ORDER BY created_at DESC LIMIT 300`,
      sql`SELECT id, customer_id AS seller_id, customer_email AS client_name, total AS subtotal, items, shipping_method AS payment_method, created_at, 'storefront' AS source FROM orders WHERE location = ${location} ORDER BY created_at DESC LIMIT 300`.catch(() => []),
    ]);
    // ... rest of the function (seller-name lookup, merge, sort, slice) is unchanged ...
  } catch (error) {
    console.error('admin orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
```

- [ ] **Step 6: Update `src/app/api/supervisor/orders/route.ts`**

This route reads both `seller_orders` and `orders` with no existing `WHERE` clause (only `ORDER BY ... LIMIT 500`) before merging/normalizing them in JS. Add the import, resolve `location` once, and add a `WHERE location = ${location}` to each of the two raw queries:

```ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const { searchParams } = new URL(req.url);
  const method   = searchParams.get('method');
  const from     = searchParams.get('from');
  const to       = searchParams.get('to');
  const giftOnly = searchParams.get('gift') === 'true';

  try {
    const [sellerRaw, storefrontRaw] = await Promise.all([
      sql`SELECT * FROM seller_orders WHERE location = ${location} ORDER BY created_at DESC LIMIT 500`,
      sql`
        SELECT id, customer_id, customer_email, total AS subtotal, shipping_cost,
               items, status, shipping_method, payment_methods, created_at
        FROM orders
        WHERE location = ${location}
        ORDER BY created_at DESC LIMIT 500
      `.catch(() => []),
    ]);

    // ... every line below this point (parseJson, the OrderRow mapping, the
    // from/to/giftOnly/method filters, and the final JSON response) is
    // unchanged from the existing file ...
  } catch (e) {
    const msg = (e as Error)?.message ?? 'DB error';
    console.error('[supervisor/orders]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- __tests__/api/seller-orders.test.ts`
Expected: PASS

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/app/api/seller/products/route.ts src/app/api/seller/orders/route.ts \
        src/app/api/admin/orders/route.ts src/app/api/supervisor/orders/route.ts \
        __tests__/api/seller-orders.test.ts
git commit -m "feat: scope backoffice products/orders routes to the panel location switcher"
```

---

### Task 6: Admin reports (sales, stock, cost, goals) filtered by panel location

**Files:**
- Modify: `src/app/api/admin/reports/sales/route.ts`
- Modify: `src/app/api/admin/reports/stock/route.ts`
- Modify: `src/app/api/admin/reports/cost/route.ts`
- Modify: `src/app/api/admin/reports/goals/route.ts`
- Test: `__tests__/api/reports-stock.test.ts`

**Interfaces:**
- Consumes: `getPanelLocation()` from `@/lib/location` (Task 1).
- Produces: nothing new consumed elsewhere.

- [ ] **Step 1: Write the failing test (representative — stock report)**

```ts
// __tests__/api/reports-stock.test.ts
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
const sqlMock: any = jest.fn(() => ({ catch: () => Promise.resolve([]) }));
jest.mock('@/lib/db', () => ({ __esModule: true, default: sqlMock }));
jest.mock('@/lib/location', () => ({
  getPanelLocation: jest.fn(() => Promise.resolve('la_marina')),
}));

import { auth } from '@clerk/nextjs/server';

describe('GET /api/admin/reports/stock', () => {
  beforeEach(() => jest.clearAllMocks());

  it('filters product rows by the current panel location', async () => {
    (auth as jest.Mock).mockResolvedValue({ userId: 'admin_1' });
    const { GET } = await import('@/app/api/admin/reports/stock/route');
    await GET();
    const [strings, ...values] = sqlMock.mock.calls[0];
    expect(strings.join('?')).toContain('p.location =');
    expect(values).toContain('la_marina');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/api/reports-stock.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `src/app/api/admin/reports/stock/route.ts`**

```ts
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();

  const rows = await sql`
    SELECT
      p.id,
      p.title,
      p.sku,
      COALESCE(SUM(ps.quantity), p.stock, 0)::int AS qty
    FROM products p
    LEFT JOIN product_stock ps ON ps.product_id = p.id
    WHERE p.status = 'active' AND p.location = ${location}
    GROUP BY p.id, p.title, p.sku, p.stock
    ORDER BY qty DESC
  `.catch(() => []);

  // ... rest of the function (total/inStock/lowStock/outOfStock/topSKUs) is unchanged ...
}
```

- [ ] **Step 4: Update `src/app/api/admin/reports/sales/route.ts`**

Import `getPanelLocation` and resolve `location` once, after the auth check. Five sub-queries run in parallel here:

- `sellerDaily` (reads `seller_orders`) and `storefrontDaily` (reads `orders`) — both already shown in this plan's File Structure context; add `AND location = ${location}` to each one's `WHERE created_at >= ${cutoff}` clause.
- `totals` — a single query joining a `seller_orders` subquery (`s`) and an `orders` subquery (`o`); add `AND location = ${location}` inside **both** inner subqueries' `WHERE created_at >= ${cutoff}` clauses.
- `membershipRevenue` — reads `event_tickets`, not `products`/`orders`/`seller_orders`. Leave this one **unfiltered** — events/tickets are explicitly out of scope for location-splitting per this plan's Global Constraints and the spec.
- `topProducts` — reads `seller_orders` via `jsonb_array_elements`; add `AND location = ${location}` to its `WHERE created_at >= ${cutoff}` clause.

```ts
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

function rangeExpr(range: string) {
  switch (range) {
    case '7d':  return sql.unsafe("NOW() - INTERVAL '7 days'");
    case '3m':  return sql.unsafe("NOW() - INTERVAL '90 days'");
    case 'all': return sql.unsafe("'1970-01-01'::timestamptz");
    default:    return sql.unsafe("NOW() - INTERVAL '30 days'");
  }
}

function groupBy(range: string) {
  if (range === '3m' || range === 'all') return 'week';
  return 'day';
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const range  = req.nextUrl.searchParams.get('range') ?? '30d';
  const cutoff = rangeExpr(range);
  const bucket = groupBy(range);
  const trunc  = sql.unsafe(bucket === 'week' ? 'week' : 'day');

  const [sellerDaily, storefrontDaily, totals, membershipRevenue, topProducts] = await Promise.all([
    sql`
      SELECT
        DATE_TRUNC(${trunc}, created_at) AS bucket,
        SUM(subtotal::numeric) AS revenue,
        COUNT(*) AS orders
      FROM seller_orders
      WHERE created_at >= ${cutoff} AND location = ${location}
      GROUP BY DATE_TRUNC(${trunc}, created_at)
      ORDER BY bucket ASC
    `.catch(() => []),

    sql`
      SELECT
        DATE_TRUNC(${trunc}, created_at) AS bucket,
        SUM(total::numeric) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE created_at >= ${cutoff} AND location = ${location}
      GROUP BY DATE_TRUNC(${trunc}, created_at)
      ORDER BY bucket ASC
    `.catch(() => []),

    sql`
      SELECT
        COALESCE(s.rev, 0) + COALESCE(o.rev, 0) AS total_revenue,
        COALESCE(s.cnt, 0) + COALESCE(o.cnt, 0) AS total_orders,
        COALESCE(s.avg_v, 0)                     AS avg_seller,
        COALESCE(o.avg_v, 0)                     AS avg_storefront
      FROM
        (SELECT SUM(subtotal::numeric) AS rev, COUNT(*) AS cnt, AVG(subtotal::numeric) AS avg_v
         FROM seller_orders WHERE created_at >= ${cutoff} AND location = ${location}) s,
        (SELECT SUM(total::numeric) AS rev, COUNT(*) AS cnt, AVG(total::numeric) AS avg_v
         FROM orders WHERE created_at >= ${cutoff} AND location = ${location}) o
    `.catch(() => [{ total_revenue: 0, total_orders: 0, avg_seller: 0, avg_storefront: 0 }]),

    // Events/tickets are out of scope for location-splitting (see Global Constraints) — unfiltered.
    sql`
      SELECT COALESCE(SUM(total_paid::numeric), 0) AS membership_rev
      FROM event_tickets
      WHERE purchased_at >= ${cutoff}
    `.catch(() => [{ membership_rev: 0 }]),

    sql`
      SELECT
        p_items->>'title' AS title,
        SUM((p_items->>'price')::numeric * (p_items->>'quantity')::numeric) AS revenue,
        SUM((p_items->>'quantity')::numeric) AS units
      FROM seller_orders,
        jsonb_array_elements(
          CASE WHEN jsonb_typeof(items::jsonb) = 'array' THEN items::jsonb ELSE '[]'::jsonb END
        ) AS p_items
      WHERE created_at >= ${cutoff} AND location = ${location}
      GROUP BY p_items->>'title'
      ORDER BY revenue DESC
      LIMIT 5
    `.catch(() => []),
  ]);

  // ... the bucket-merging, response-shaping code below this point is unchanged ...
}
```

- [ ] **Step 5: Update `src/app/api/admin/reports/cost/route.ts`**

Add the import, resolve `location` once, and add `AND location = ${location}` to the `sellerRev` and `storefrontRev` queries. Leave the `theme_settings`-backed `cost_percentage` lookup (and its `PATCH` handler) untouched — that config is global, not location-scoped:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

function rangeExpr(range: string) {
  switch (range) {
    case '7d':  return sql.unsafe("NOW() - INTERVAL '7 days'");
    case '3m':  return sql.unsafe("NOW() - INTERVAL '90 days'");
    case 'all': return sql.unsafe("'1970-01-01'::timestamptz");
    default:    return sql.unsafe("NOW() - INTERVAL '30 days'");
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const range  = req.nextUrl.searchParams.get('range') ?? '30d';
  const cutoff = rangeExpr(range);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS theme_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const [sellerRev, storefrontRev, costRows, trend] = await Promise.all([
      sql`
        SELECT COALESCE(SUM(subtotal::numeric), 0) AS revenue
        FROM seller_orders
        WHERE created_at >= ${cutoff} AND location = ${location}
      `.catch(() => [{ revenue: 0 }]),

      sql`
        SELECT COALESCE(SUM(total::numeric), 0) AS revenue
        FROM orders
        WHERE created_at >= ${cutoff} AND location = ${location}
      `.catch(() => [{ revenue: 0 }]),

      sql`SELECT value FROM theme_settings WHERE key = 'cost_percentage'`.catch(() => []),

      sql`
        SELECT
          DATE_TRUNC('day', created_at) AS bucket,
          SUM(subtotal::numeric) AS revenue
        FROM seller_orders
        WHERE created_at >= ${cutoff} AND location = ${location}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY bucket ASC
      `.catch(() => []),
    ]);

    // ... costPercent/revenue/totalCost/grossMargin/profit calculation and the
    // JSON response below this point are unchanged. The PATCH handler in this
    // same file (cost_percentage config) is untouched — global, not location-scoped.
  } catch (error) {
    console.error('cost report error:', error);
    return NextResponse.json({ error: 'Failed to fetch cost data' }, { status: 500 });
  }
}
```

- [ ] **Step 6: Update `src/app/api/admin/reports/goals/route.ts`**

Add the import, resolve `location` once, and add `AND location = ${location}` to the three actuals queries and to the `weeks` query further down. Leave the `theme_settings`-backed target lookup and its `PATCH` handler untouched — targets are global, not location-scoped:

```ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location';

const DEFAULT_TARGETS: Record<string, number> = { daily_target: 357.14, weekly_target: 2500, monthly_target: 10000 };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS theme_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    const [targetRows, dailyActualRow, weeklyActualRow, monthlyActualRow] = await Promise.all([
      sql`SELECT key, value FROM theme_settings WHERE key IN ('daily_target', 'weekly_target', 'monthly_target')`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= CURRENT_DATE AND location = ${location}`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= date_trunc('week', NOW()) AND location = ${location}`,
      sql`SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual FROM seller_orders WHERE created_at >= date_trunc('month', NOW()) AND location = ${location}`,
    ]);

    const targetMap: Record<string, number> = { ...DEFAULT_TARGETS };
    for (const row of targetRows as unknown as { key: string; value: string }[]) targetMap[row.key] = Number(row.value);

    const build = (target: number, actual: number) => ({ target, actual, progress: target > 0 ? (actual / target) * 100 : 0 });

    const daily   = build(targetMap.daily_target,   Number((dailyActualRow as unknown as { actual: unknown }[])[0]?.actual)   || 0);
    const weekly  = build(targetMap.weekly_target,  Number((weeklyActualRow as unknown as { actual: unknown }[])[0]?.actual)  || 0);
    const monthly = build(targetMap.monthly_target, Number((monthlyActualRow as unknown as { actual: unknown }[])[0]?.actual) || 0);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - now.getDate();
    const daysPassed = now.getDate();
    const dailyRate = daysPassed > 0 ? monthly.actual / daysPassed : 0;
    const projectedMonthEnd = dailyRate * daysInMonth;

    const weeks = await sql`
      SELECT
        CEIL(EXTRACT(DAY FROM created_at) / 7.0) AS week,
        SUM(subtotal::numeric) AS actual
      FROM seller_orders
      WHERE created_at >= date_trunc('month', NOW()) AND location = ${location}
      GROUP BY week
      ORDER BY week ASC
    `;
    const weeklyChartTarget = monthly.target / (daysInMonth / 7);
    const chart = [1, 2, 3, 4].map((w) => {
      const row = weeks.find((r: any) => Number(r.week) === w);
      return { week: `W${w}`, target: Math.round(weeklyChartTarget), actual: row ? Number(row.actual) : 0 };
    });

    return NextResponse.json({
      target: monthly.target, actual: monthly.actual, progress: monthly.progress,
      daysLeft, daysInMonth, projectedMonthEnd, chart,
      daily, weekly, monthly,
    });
  } catch (error) {
    console.error('goals report error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals data' }, { status: 500 });
  }
}
```

The `PATCH` handler in this same file (daily/weekly/monthly target config) is untouched — global, not location-scoped.

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test -- __tests__/api/reports-stock.test.ts`
Expected: PASS

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/app/api/admin/reports/sales/route.ts src/app/api/admin/reports/stock/route.ts \
        src/app/api/admin/reports/cost/route.ts src/app/api/admin/reports/goals/route.ts \
        __tests__/api/reports-stock.test.ts
git commit -m "feat: scope admin reports to the panel location switcher"
```

---

## Deploy

After all six tasks are committed:

```bash
cd D:\AP\projects\makaystore
npm run build
git push origin master:main
npx vercel deploy --prod --token <KRYPTYK_VERCEL_TOKEN> --scope kryptycstore-6214s-projects
```

Attach `guacuco.makaybeachclub.com` to this Vercel project's domains (in addition to, or instead of, the current apex binding — the apex is being handed to the selector app in a separate plan). Leave `STORE_LOCATION` unset in this project's env vars (it defaults to `'guacuco'`).
