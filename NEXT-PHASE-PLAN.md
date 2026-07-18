# Makay Store — Next Major Development Phase
**Created:** 2026-07-18
**Resume trigger:** "continue next phase plan"

---

## What Was Shipped (This Session)

- **Storefront Studio** (`/admin/studio`) — merged ThemeEditor + MarketingEditor into one unified editor: Brand/Scroll/Pages/Images/Card sections with section-level Save buttons and live iframe preview
- **Admin tutorial** expanded to 10 steps covering Rotation + Studio (was 8, missing both)
- **Admin sidebar** consolidated to 7 entries (removed Marketing + Tema duplicates, added Studio)
- **3D Generation** — FAL.ai TRELLIS.2 LoRA provider added ($0.02/model). Needs FAL account balance to activate. Falls back to TripoSR (Railway, free, low quality).
- **TripoSR improvements** — rembg background removal + has_vertex_color=True (better quality on free tier)
- **All previous improvement plan 2 items** — admin orders/users pages, real report data, seller i18n, supervisor tutorial 10 steps, scrolling fix

---

## Pending Small Items

1. **FAL.ai balance** — add $5+ at fal.ai/dashboard/billing → TRELLIS.2 activates automatically
2. **Content fields not wired to storefront** — Studio "Pages → Content" tab saves text to DB but storefront components don't read them yet. Need to wire hero title/subtitle/CTA and product page fields from theme_settings into the actual components.
3. **Studio live preview for Brand tab** — currently shows iframe (good for Pages), but Brand color changes apply to document root (same domain), not the iframe. Consider showing the inline ThemePreview component for Brand/Scroll tabs and iframe for Pages tab.
4. **`/admin/rotation` and `/admin/reports` need AdminSidebar** — check if they already include it or are standalone.

---

## Next Major Phase: Customer Experience & Sales Engine

### Priority 1 — Memberships & Customer Accounts (HIGH IMPACT)
Build the Makay Beach Club membership system.

**What's needed:**
- Membership tiers in DB (free, bronze, silver, gold, vip)
- `/profile` page expanded: wallet balance, membership badge, member card QR code (already partial), order history, points
- Member card: generate unique QR code per user, stored in DB
- Staff can scan QR → look up membership level → apply discount
- Admin can set discount % per tier

**Files to create:**
- `src/app/api/profile/membership/route.ts`
- `src/app/api/admin/memberships/route.ts`
- `src/components/profile/MembershipCard.tsx` (already has QR stub)
- DB: `memberships` table (user_id, tier, points, wallet_balance, joined_at)

---

### Priority 2 — Events System (HIGH IMPACT)
Beach club events — Spoon & Moon experiences etc.

**What's needed:**
- Events admin panel (`/admin/events`) — create, manage, ticket capacity
- Events storefront page (`/events`) — upcoming events grid
- Ticket purchase flow (checkout adapts for event tickets)
- QR ticket on purchase confirmation
- Guest list management in admin

**Files to create:**
- `src/app/admin/events/page.tsx` + management UI
- `src/app/events/page.tsx` + event detail page
- `src/app/api/admin/events/route.ts`
- DB: `events` table (id, title, date, capacity, tickets_sold, price, image_url, description)
- DB: `event_tickets` table (id, event_id, user_id, quantity, order_id, created_at)

---

### Priority 3 — Real Product Admin (CRITICAL FOR GO-LIVE)
Currently products are fixture-based mock data. Needs real product management.

**What's needed:**
- `/admin/products` list page — view all real products from DB
- Edit product: price, name, description, images, stock, variants (size/color)
- Create product form (without 3D — that's the create-3d page)
- Product variants: sizes array, colors array stored as JSONB
- Stock per variant (not just per product)
- Bulk publish/unpublish

**Files to create:**
- `src/app/admin/products/page.tsx` — product table with edit/delete
- `src/app/admin/products/[id]/edit/page.tsx` — full edit form
- `src/app/api/admin/products/route.ts` (GET all, POST create)
- `src/app/api/admin/products/[id]/route.ts` (GET, PATCH, DELETE)
- DB: extend `products` table with `variants`, `sizes`, `colors`, `is_published`

---

### Priority 4 — Customer Orders & Tracking
Currently customers can checkout but can't track their orders.

**What's needed:**
- `/orders` page (customer) — list their own orders
- `/orders/[id]` — order detail with status timeline
- Status progression: placed → confirmed → shipped → delivered
- Admin can update status per order
- Email notification on status change (optional: Resend API)

**Files to create:**
- `src/app/orders/page.tsx`
- `src/app/orders/[id]/page.tsx`
- `src/app/api/orders/route.ts` (GET customer's own orders)
- `src/app/api/admin/orders/[id]/route.ts` (PATCH status)
- Status timeline component

---

### Priority 5 — Analytics Dashboard (NICE TO HAVE)
Real-time data for admin.

**What's needed:**
- Visitor count (can use Vercel Analytics or simple page view counter)
- Revenue by day/week/month charts (already partially in reports)
- Top products by revenue
- Conversion funnel: visitors → cart → checkout → purchased
- Export CSV for any report

---

## DB Schema Changes Needed

```sql
-- Memberships
CREATE TABLE memberships (
  user_id TEXT PRIMARY KEY,
  tier TEXT DEFAULT 'free', -- free|bronze|silver|gold|vip
  points INTEGER DEFAULT 0,
  wallet_balance NUMERIC(10,2) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events
CREATE TABLE events (
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

CREATE TABLE event_tickets (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  user_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  order_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product variants
ALTER TABLE products ADD COLUMN IF NOT EXISTS sizes TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '{}';
```

---

## Build Order

1. Real Product Admin (Priority 3) — foundation, everything else depends on real products
2. Customer Orders & Tracking (Priority 4) — close the purchase loop
3. Memberships (Priority 1) — differentiator, beach club identity
4. Events System (Priority 2) — upsell channel
5. Analytics (Priority 5) — optional after launch

---

## Deployment Info
- Makaystore: `makaystore-sandy.vercel.app` | `D:/AP/projects/makaystore`
- Vercel token: in credentials_vercel_kryptyk.md
- DB: Neon (ep-raspy-forest-at258m7w-pooler.c-9.us-east-1.aws.neon.tech)
- FAL key: `02893c1a-a829-4893-b89b-df1bd100c5f3:f5b9371cbd61883f410b40a677e9ed94` (needs balance)
- TripoSR Railway token: `abb684e5-f40b-431f-a166-866bb70f92e7`
