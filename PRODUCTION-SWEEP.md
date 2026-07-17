# Makay Store — Production Sweep Plan
**Created:** 2026-07-17  
**Resume trigger:** "continue production sweep" or "start production sweep"

---

## Context

The store is live at `makaystore-sandy.vercel.app`. All seller/admin/worker panels are built and deployed. Before removing mockup data and finishing production wiring, we need a full audit of every page for visual correctness, animations, scrolling, and button interactions.

**Stack:** Next.js 16 (App Router) · Clerk auth · Neon PostgreSQL · Stripe · anime.js · Lenis · ShaderGradient · Turbopack

---

## Phase 1 — Full Page Audit (visit every page, fix what's broken)

Work through each page systematically. For each: animations, scroll behavior, all buttons/links, empty states, loading states, mobile layout.

### 1A. Storefront (customer-facing)

| Page | URL | Things to verify |
|------|-----|-----------------|
| Home | `/` | ShaderGradient hero background; anime.js char-stagger headline; Lenis smooth scroll; section entrance animations; CTA button hover; FeaturedCollection carousel/grid; scroll-color engine (body bg changes per section); Footer links |
| All Products | `/products` | Filter sidebar (desktop + mobile drawer); sort dropdown; ProductGrid renders; ProductCard hover; add to cart; empty state when no results; mobile filter toggle/overlay |
| Product Detail | `/products/[id]` | VariantSelector toggles; QuantitySelector +/- buttons; Add to Cart → cart badge updates; ProductModel3D (if 3D model exists); ProductReviewsSection; RelatedProducts grid; image gallery |
| Cart | `/cart` | CartItem quantity controls; remove item; CartSummary totals update; Proceed to Checkout button |
| Checkout | `/checkout` | ShippingForm validation; ShippingMethodSelector toggles; StripePaymentForm loads (test mode); OrderSummaryCheckout shows correct items; Place Order → order-confirmation redirect |
| Order Confirmation | `/order-confirmation/[id]` | Shows correct order; all fields populated |
| Profile | `/profile` | ClientProfile loads; bio edit; wallet balance; member card renders; share/download card buttons; QR code; card designer link |
| Member Card | `/member/[userId]` | Public member card renders for any user ID |

**Animations checklist (every page):**
- [ ] anime.js entrance animations fire on load (not just on re-render)
- [ ] Scroll-triggered reveals work (IntersectionObserver on each section)
- [ ] No animation flicker on page navigation
- [ ] `prefers-reduced-motion` respected (no animation when set)
- [ ] ShaderGradient WebGL loads without error (Hero section)
- [ ] Lenis scroll is smooth (no scroll jank)
- [ ] ScrollColorEngine body background transitions correctly

### 1B. Seller Panel

| Page | URL | Things to verify |
|------|-----|-----------------|
| Dashboard | `/seller/dashboard` | Stats cards render; recent orders table; Quick Action buttons navigate correctly; tutorial auto-show first visit |
| Sell | `/seller/sell` | Client search fetches from `/api/seller/clients`; selecting client + products + checkout full flow; cart badge updates; tutorial overlay |
| Products | `/seller/products` | Product list loads; edit modal opens with correct data; price/image/type save via `/api/seller/products`; Add Product modal; tutorial overlay |
| Stock | `/seller/stock` | Quantities load from `/api/seller/stock`; +1/-1/+5/-5 buttons; save per row; low-stock alert; tutorial overlay |

### 1C. Admin Panel

| Page | URL | Things to verify |
|------|-----|-----------------|
| Dashboard | `/admin/dashboard` | Nav cards render; tutorial auto-show; all nav cards link to correct routes |
| Marketing Editor | `/admin/editor` | Page selector tabs; Colors tab — color pickers update iframe in real time; Typography tab — font/scale buttons apply to iframe; Content tab — fields save; Publish saves to Neon; iframe loads real pages; Open page button |
| Theme Editor | `/admin/theme` | Preset buttons apply all 8 color vars; color pickers work; scroll colors editor; image overrides upload; card designer; Publish saves; live preview reflects changes |
| 3D Products | `/admin/products/create-3d` | Product selector step; image upload; generation progress polling; 3D preview (ModelPreviewStep); save/confirm; tutorial overlay |
| Reports | `/admin/reports` | All 5 tabs (Sales, Costs, Goals, Inventory, Rotation) render charts; date range works; export if present; tutorial overlay |
| Rotation | `/admin/rotation` | Product table renders; status badges; BulkRotationActions; schedule form; tutorial overlay |

### 1D. Worker / Supervisor

| Page | URL | Things to verify |
|------|-----|-----------------|
| Worker Activity | `/worker/activity` | Clock in/out buttons; activity log updates in real time; task list renders |
| Supervisor Dashboard | `/supervisor/dashboard` | Worker profile list; all 7 section panels render; QuickActions; ShiftOverview; AlertsPanel; PerformanceRankings; worker detail click-through |

### 1E. Auth + Navigation

- [ ] Sign-in → redirects to correct role-based page (admin→/admin/dashboard, seller→/seller/dashboard, worker→/worker/activity, customer→/)
- [ ] Sign-up flow works
- [ ] NavBar renders correctly for each role (logged out, customer, seller, admin)
- [ ] LanguageSwitcher toggles EN/ES correctly and persists
- [ ] All sidebar navigation items link to correct routes
- [ ] Role guard redirects (non-admin accessing /admin/*)
- [ ] Tutorial overlays: auto-show first visit, help button replays, mark completed correctly

---

## Phase 2 — Remove Mock Data + Wire Real Database

### 2A. Create `products` table in Neon

```sql
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL,
  image       TEXT,
  sku         TEXT,
  stock       INTEGER DEFAULT 0,
  category    TEXT,
  variants    JSONB DEFAULT '[]',
  reviews     JSONB DEFAULT '[]',
  model_3d    TEXT,
  status      TEXT DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 2B. Seed products table from mockData

Run a one-time seed script: `src/scripts/seed-products.ts`  
Uses the existing `mockProducts` array → inserts each as a row.  
After seed: mockData.ts stays as fallback but is no longer the primary source.

### 2C. Create API routes for storefront products

**`/api/products`** (GET) — returns all active products, merged with `product_overrides`  
**`/api/products/[id]`** (GET) — returns single product by ID, merged with overrides

Merge logic (same as seller pages already do):
```
base product from `products` table
+ price/image/type override from `product_overrides` if exists
+ stock quantity from `product_stock` if exists
```

### 2D. Update all consumers to use API instead of mockData

Files to update after API routes exist:

| File | Current source | Replace with |
|------|---------------|-------------|
| `src/app/products/page.tsx` | `mockProducts` (direct import) | fetch `/api/products` (server component) |
| `src/app/products/[id]/page.tsx` | `getProductById` from mockData | fetch `/api/products/[id]` |
| `src/components/RelatedProducts.tsx` | `mockProducts` import | prop from parent or fetch `/api/products` |
| `src/components/ProductSelectionStep.tsx` | inline mock array | fetch `/api/products` |
| `src/components/ThemeEditor.tsx` | `mockProducts` for image picker | fetch `/api/products` (useEffect on mount) |
| `src/app/seller/sell/page.tsx` | `mockProducts` base + DB overrides | fetch from `/api/seller/products` (already returns merged) |
| `src/app/seller/products/page.tsx` | `mockProducts` base + DB overrides | same — `/api/seller/products` |
| `src/app/seller/stock/page.tsx` | `mockProducts` base + DB stock | `/api/products` + `/api/seller/stock` merge |

After all consumers updated, `mockData.ts` import can be removed from each file.  
Keep `mockData.ts` as fallback / dev seed source — do NOT delete.

### 2E. Wire Marketing Editor content to real components

The Marketing Editor stores content overrides in Neon under `page:{pageId}:content:{field}` keys.  
These need to be applied to the real components:

| Content field | Component | How to wire |
|--------------|-----------|-------------|
| `heroTitle`, `heroSubtitle`, `ctaText` | `Hero.tsx` | Server: fetch `/api/theme`, pass as props |
| `featuredTitle`, `featuredSubtitle` | `FeaturedCollection.tsx` | Same |
| `pageTitle`, `pageSubtitle` | `src/app/products/page.tsx` | Fetch theme settings server-side |
| `addToCart`, `reviewsTitle`, `relatedTitle` | `ProductDetail.tsx` | Prop from page.tsx |
| `pageTitle`, `shippingTitle`, `paymentTitle`, `summaryTitle`, `placeOrderBtn` | `CheckoutPage.tsx` | Prop from checkout page.tsx |

**Pattern for each (server component):**
```typescript
// In page.tsx (server component):
const themeRows = await sql`SELECT settings FROM theme_settings WHERE id = 1`;
const settings = themeRows[0]?.settings as Record<string,string> ?? {};
const content = {
  heroTitle: settings['page:home:content:heroTitle'] ?? undefined,
  heroSubtitle: settings['page:home:content:heroSubtitle'] ?? undefined,
  // ...
};
// Pass as props to the client component
```

**Components need to accept optional override props** that fall back to i18n defaults:
```typescript
// Hero.tsx
interface HeroProps { titleOverride?: string; subtitleOverride?: string; ctaOverride?: string; }
// If override provided, use it. Otherwise use useTranslations('hero').
```

---

## Phase 3 — Production Hardening

### 3A. Error boundaries
- [ ] Wrap each major section in an `<ErrorBoundary>` (create `src/components/ErrorBoundary.tsx`)
- [ ] Stripe payment form error handling (card declined, network error)
- [ ] 3D generation failure states (MuAPI timeout, invalid image)
- [ ] DB connection failure — all SQL calls already have try/catch; verify fallbacks

### 3B. Loading states
- [ ] Products page: skeleton grid while fetching
- [ ] Product detail: skeleton while fetching
- [ ] Seller clients: spinner in SellerSell step 1
- [ ] Reports: skeleton charts while loading
- [ ] Profile: spinner already exists — verify works

### 3C. Auth guards audit
- [ ] `/admin/*` — confirm `currentUser()` role check is `admin` on every route
- [ ] `/seller/*` — confirm role check is `seller`
- [ ] `/worker/*` and `/supervisor/*` — confirm role checks
- [ ] Middleware handles unauthenticated redirects to `/sign-in`
- [ ] Check `middleware.ts` covers all protected paths

### 3D. Empty states
- [ ] No products match filter → show "No results" message
- [ ] Empty cart → show "Your cart is empty" with link to /products
- [ ] No orders in seller dashboard → placeholder
- [ ] No workers in supervisor dashboard → placeholder

### 3E. Mobile audit
- [ ] NavBar hamburger menu (if exists) or mobile nav pattern
- [ ] Product grid: 1 col on mobile, 2 col on tablet
- [ ] Seller sell: layout reflows on mobile
- [ ] Admin editor: show panel-only on mobile (iframe hidden or scaled)
- [ ] Tutorial overlay: positions correctly on mobile
- [ ] Cart and checkout: full-width on mobile

---

## Phase 4 — Final Pre-Launch Checklist

- [ ] All environment variables set in Vercel (DATABASE_URL, CLERK keys, STRIPE keys, MUAPI key)
- [ ] Neon DB connection pooling configured (pgbouncer)
- [ ] Stripe webhook endpoint configured at `/api/webhooks/stripe`
- [ ] Clerk webhook at `/api/webhooks/clerk` (sets user roles)
- [ ] `NEXT_PUBLIC_APP_URL` env var set for member card QR codes
- [ ] Image domains whitelisted in `next.config.js` for all product image sources
- [ ] Remove `tutorial-test` page (`/tutorial-test`) — dev artifact
- [ ] Set `NODE_ENV=production` confirmed on Vercel
- [ ] Run Lighthouse audit on `/` (target: Performance > 80, Accessibility > 90)

---

## Execution Order After Compaction

1. **Start Phase 1** — audit every page top to bottom in the table above, fix bugs as found
2. **Phase 2A–2C** — create products table, seed, build API routes
3. **Phase 2D** — swap all mockData consumers to real API
4. **Phase 2E** — wire Marketing Editor content to components
5. **Phase 3** — hardening pass
6. **Phase 4** — final checklist before owner handoff

---

## Key Files Reference

| What | Where |
|------|-------|
| Mock data source | `src/lib/mockData.ts` |
| Payload abstraction (swap point) | `src/lib/payload.ts` |
| DB client | `src/lib/db.ts` |
| All API routes | `src/app/api/**` |
| Theme/marketing settings GET | `GET /api/theme` |
| Theme/marketing settings PATCH | `PATCH /api/admin/theme` (admin only) |
| Products table (to create) | Neon — `products` |
| Existing real tables | `product_stock`, `product_overrides`, `seller_orders`, `theme_settings`, `user_profiles`, `activities` |
| Vercel project | `makaystore` on kryptycstore-6214 account |
| Deploy command | `vercel deploy --prod --scope kryptycstore-6214s-projects --token vcp_40zDH...` |
