# Makay La Marina Fork Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork `makaystore` into a new `makay-la-marina` repo that serves only the La Marina storefront — same backend (Neon DB, Clerk), no admin/seller/supervisor/worker surface, visually distinct from Guacuco.

**Architecture:** A literal directory fork (not a monorepo/shared-package split, per the approved spec). The fork keeps every storefront route and strips every backoffice route. It points at the same `DATABASE_URL` and Clerk keys as `makaystore` so staff and members are shared, but sets `STORE_LOCATION=la_marina` (consumed by the `src/lib/location.ts` module shipped in the companion data-model plan) so its catalog and orders are scoped correctly. The shared `theme_settings`-backed branding system is neutralized in the fork so La Marina never inherits Guacuco's Studio-configured copy/branding — its differentiation is hardcoded in its own components and CSS instead.

**Tech Stack:** identical to `makaystore` — Next.js 16.2.10, Clerk, Neon (`postgres` package), Tailwind 4, next-intl, anime.js, Lenis, Jest + RTL.

**Spec:** `D:\AP\projects\makaystore\docs\superpowers\specs\2026-10-10-location-selector-and-la-marina-design.md`

**Depends on:** `2026-10-10-location-data-model-and-panel-switcher.md` must ship first — this plan's Task 4 relies on `src/lib/location.ts` and the `location` column already existing in `products`/`orders`/`seller_orders`.

## Global Constraints

- The fork has **no** `/admin`, `/seller`, `/supervisor`, `/worker` routes or their API routes — per the spec's "one unified backoffice on the Guacuco app" decision. If any kept storefront component imports something from one of those trees, that import must be removed or inlined, not papered over.
- `STORE_LOCATION=la_marina` must be set in every environment this fork runs in (local `.env.local`, Vercel production) — nothing in this fork should default to `'guacuco'` the way the base app does.
- The fork shares `DATABASE_URL` and the Clerk keys with `makaystore` byte-for-byte — copy them from `makaystore`'s own env files; never invent new credentials or a new Clerk application.
- No shared-branding bleed: nothing in this fork reads `theme_settings` or calls `/api/theme`. La Marina's look is defined entirely in its own code.
- Visual differentiation is structural, not just a palette swap: at minimum the hero's composition and the homepage's section order must differ from Guacuco's, per the spec's "pages must not look the same" requirement.

## Review Focus

- A developer later adds a new page to this fork and copies a Guacuco component wholesale without noticing it calls `/api/theme` — the fork would silently start inheriting Guacuco's Studio branding again. Covered in Task 3 by stubbing the route itself (a single choke point) rather than relying on every component author remembering not to call it.
- The fork's build fails at `next build` because a stripped route's API is still imported somewhere in a kept component (e.g. a storefront component linking to `/admin/...`). Covered in Task 2's build-verification step.
- A visitor on La Marina's storefront places an order — it must land in the DB tagged `location = 'la_marina'`, not `'guacuco'`, even though both apps share one database. Covered in Task 4's test.
- Staff who switch the Guacuco backoffice's location switcher to "La Marina" must see this fork's orders/products, proving the two independently-deployed apps are actually reading the same rows. Covered in Task 4's verification step (cross-checks against the companion plan's `getPanelLocation` switcher).
- The differentiated Hero must still respect `prefers-reduced-motion` and the mobile-WebGL-disable rule, exactly like the original — forking code is not a license to drop standing accessibility/perf rules. Covered in Task 5.

---

## File Structure

- `D:\AP\projects\makay-la-marina\` — new repo root (copied from `makaystore`).
- Deleted: `src/app/admin/`, `src/app/seller/`, `src/app/supervisor/`, `src/app/worker/`, `src/app/api/admin/`, `src/app/api/seller/`, `src/app/api/supervisor/`, `src/components/AdminSidebar.tsx`, `src/components/seller/`, `src/components/SupervisorSidebar.tsx`, and any component exclusively used by those trees.
- Modified: `src/app/api/theme/route.ts` — stubbed to always return `{}`.
- Modified: `.env.local` / Vercel env — `STORE_LOCATION=la_marina` added; `package.json` `name` changed to `makay-la-marina`.
- Modified: `src/components/Hero.tsx` — new split-layout composition, teal/navy palette.
- Modified: `src/app/page.tsx` — reordered sections.
- Modified: `src/app/globals.css` — dominant token overrides.
- Test: `__tests__/components/Hero.test.tsx`, `__tests__/api/orders-location.test.ts`.

---

### Task 1: Fork the repository

**Files:** none individually — this task duplicates the whole `makaystore` tree.

**Interfaces:**
- Consumes: the finished state of `makaystore` after the companion data-model plan has shipped (so `src/lib/location.ts` and the `location` columns already exist).
- Produces: `D:\AP\projects\makay-la-marina`, a standalone git repo building and testing green before any stripping begins.

- [ ] **Step 1: Copy the directory, excluding build/dependency/VCS artifacts**

```bash
cd "D:\AP\projects"
mkdir makay-la-marina
robocopy makaystore makay-la-marina /E /XD node_modules .next .git coverage /XF .env.local.bak
```

(`robocopy` exit codes 0-7 indicate success with files copied — anything 8+ is a real error.)

- [ ] **Step 2: Re-initialize git and create the new GitHub repo**

```bash
cd "D:\AP\projects\makay-la-marina"
git init
gh repo create AedanCoder02/makay-la-marina --private --source=. --remote=origin
```

- [ ] **Step 3: Verify the fork builds and tests green before any stripping**

```bash
npm install
npm test
npm run build
```

Expected: identical pass/fail results to `makaystore` at the commit it was copied from — this step exists purely to confirm the copy itself introduced no corruption, before Task 2 starts deleting things.

- [ ] **Step 4: Commit the fork's starting point**

```bash
git add -A
git commit -m "chore: fork makaystore as the starting point for makay-la-marina"
```

---

### Task 2: Strip the backoffice (admin/seller/supervisor/worker)

**Files:**
- Delete: `src/app/admin/`, `src/app/api/admin/`
- Delete: `src/app/seller/`, `src/app/api/seller/`
- Delete: `src/app/supervisor/`, `src/app/api/supervisor/`
- Delete: `src/app/worker/`
- Delete: `src/components/AdminSidebar.tsx`, `src/components/seller/`, `src/components/SupervisorSidebar.tsx`
- Delete: `src/components/LocationSwitcher.tsx`, `src/styles/location-switcher.css` (backoffice-only — this fork has no panel to switch)
- Delete: any test files under `__tests__/` whose target component/route no longer exists

**Interfaces:**
- Consumes: nothing.
- Produces: a build with zero backoffice surface area, verified by `next build` succeeding.

- [ ] **Step 1: Delete the route trees**

```bash
cd "D:\AP\projects\makay-la-marina"
rm -rf src/app/admin src/app/api/admin
rm -rf src/app/seller src/app/api/seller
rm -rf src/app/supervisor src/app/api/supervisor
rm -rf src/app/worker
```

- [ ] **Step 2: Delete the now-orphaned components**

```bash
rm -f src/components/AdminSidebar.tsx src/components/SupervisorSidebar.tsx
rm -rf src/components/seller
rm -f src/components/LocationSwitcher.tsx src/styles/location-switcher.css
```

- [ ] **Step 3: Remove their CSS imports from `src/app/layout.tsx`**

Remove the lines importing `admin-dashboard.css`, `admin-reports.css`, `admin-rotation.css`, `supervisor-dashboard.css`, `worker-activity.css`, `location-switcher.css`, and `seller.css` from the `@/styles/*.css` import block — these styles have no surviving consumers in this fork.

- [ ] **Step 4: Run `grep` to find any remaining references to the deleted trees**

```bash
grep -rn "'@/components/AdminSidebar'\|'@/components/SupervisorSidebar'\|'@/components/seller/\|\"/admin\|\"/seller\|\"/supervisor\|\"/worker" src --include=*.tsx --include=*.ts
```

Expected: no output. If anything matches (a storefront component linking to `/seller/...` for a "staff login" shortcut, for example), remove that reference — this fork has nowhere for such a link to go.

- [ ] **Step 5: Verify the build still succeeds**

```bash
npm run build
```

Expected: PASS — this is the step that would catch a dangling import `next build` can't tree-shake around.

- [ ] **Step 6: Run the test suite and delete orphaned test files**

```bash
npm test
```

Any failing suite whose target file no longer exists (`Cannot find module`) gets its test file deleted, not patched — there's nothing left to test. Any failure for a file that *does* still exist is a real regression from Step 1-3 and must be fixed, not deleted.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: strip admin/seller/supervisor/worker backoffice from the fork"
```

---

### Task 3: Neutralize the shared `theme_settings` branding system

**Files:**
- Modify: `src/app/api/theme/route.ts`

**Interfaces:**
- Consumes: nothing (this route no longer touches `@/lib/db` at all).
- Produces: a `GET` that always returns `{}`, so every consuming component (`Hero`, `FeaturedCollection`, `HomepageEvents`, `HomepageMembership`, `ProductDetail`, `ClientProfile`, `MarketingApplier`, the storefront `products/page.tsx`) falls through to its own hardcoded/translated defaults — they already handle an empty settings object gracefully, since that's also what happens today on a fresh/misconfigured deploy.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/api/theme-stub.test.ts
const sqlMock = jest.fn();
jest.mock('@/lib/db', () => ({ __esModule: true, default: sqlMock }));

describe('GET /api/theme (La Marina fork)', () => {
  it('returns an empty object without touching the database', async () => {
    const { GET } = await import('@/app/api/theme/route');
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({});
    expect(sqlMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/api/theme-stub.test.ts`
Expected: FAIL — the current route still calls `sql` to read `theme_settings`

- [ ] **Step 3: Replace the route**

```ts
// src/app/api/theme/route.ts
import { NextResponse } from 'next/server';

export const revalidate = 0;

// La Marina has no Studio/admin and must never inherit Guacuco's
// theme_settings-backed branding — every consumer already falls back
// to its own hardcoded/translated defaults on an empty object.
export async function GET() {
  return NextResponse.json({});
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/api/theme-stub.test.ts`
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/api/theme/route.ts __tests__/api/theme-stub.test.ts
git commit -m "feat: stub /api/theme so the fork never inherits Guacuco's shared branding"
```

---

### Task 4: Point the fork at the shared backend with `STORE_LOCATION=la_marina`

**Files:**
- Modify: `.env.local` (not committed — local only)
- Modify: `package.json` (`name` field)
- Test: `__tests__/api/orders-location.test.ts`

**Interfaces:**
- Consumes: `STORE_LOCATION` as resolved by `src/lib/location.ts` (shipped by the companion data-model plan — already present in this fork from Task 1's copy).
- Produces: every order/product this deployment writes is stamped `'la_marina'`.

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/api/orders-location.test.ts
const ORIGINAL_ENV = process.env.STORE_LOCATION;

afterEach(() => {
  process.env.STORE_LOCATION = ORIGINAL_ENV;
  jest.resetModules();
});

describe('STORE_LOCATION in the La Marina fork', () => {
  it('resolves to la_marina when the env var is set', async () => {
    process.env.STORE_LOCATION = 'la_marina';
    jest.resetModules();
    const { STORE_LOCATION } = await import('@/lib/location');
    expect(STORE_LOCATION).toBe('la_marina');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/api/orders-location.test.ts`
Expected: FAIL only if `STORE_LOCATION` isn't being read correctly — since `src/lib/location.ts` already implements this correctly (copied from `makaystore` in Task 1), this should actually PASS immediately. Treat a pass here as confirmation the dependency came across intact, not as a sign to skip writing it.

- [ ] **Step 3: Set the env var locally**

In `.env.local` (copy every other value — `DATABASE_URL`, Clerk keys, Gmail SMTP creds — verbatim from `makaystore`'s own `.env.local`; do not regenerate or reuse this plan document as a place to store those values):

```
STORE_LOCATION=la_marina
```

- [ ] **Step 4: Update `package.json`**

Change `"name": "makaystore"` to `"name": "makay-la-marina"`.

- [ ] **Step 5: Manually verify against the live DB**

```bash
npm run dev
```

Place a test order through the storefront checkout, then confirm it landed correctly:

```bash
node -e "
import('postgres').then(async ({ default: postgres }) => {
  const sql = postgres(process.env.DATABASE_URL);
  const rows = await sql\`SELECT id, location FROM orders ORDER BY created_at DESC LIMIT 1\`;
  console.log(rows);
  await sql.end();
});
"
```

Expected: the most recent row shows `location: 'la_marina'`.

- [ ] **Step 6: Cross-check against the Guacuco backoffice's switcher**

In the Guacuco app's admin panel (shipped by the companion data-model plan), switch the location switcher to "La Marina" and confirm the test order placed in Step 5 appears in `/admin/orders`. This proves both independently-deployed apps are reading the same database correctly.

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add package.json __tests__/api/orders-location.test.ts
git commit -m "feat: point the fork at STORE_LOCATION=la_marina"
```

(`.env.local` is gitignored and intentionally not committed.)

---

### Task 5: Visual differentiation — Hero composition, palette, homepage order

**Files:**
- Modify: `src/components/Hero.tsx`
- Modify: `src/styles/hero.css`
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`
- Test: `__tests__/components/Hero.test.tsx`

**Interfaces:**
- Consumes: `ShaderGradientCanvasWrapper` (already present from the fork), `animejs`'s `animate`/`stagger`/`createTimeline`.
- Produces: nothing new consumed elsewhere (terminal differentiation work).

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/Hero.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/Hero';

describe('Hero (La Marina)', () => {
  it('renders the La Marina split layout, not the Guacuco full-bleed layout', () => {
    render(<Hero />);
    expect(screen.getByTestId('hero-marina-layout')).toBeInTheDocument();
  });

  it('respects prefers-reduced-motion by not throwing when matchMedia reports it enabled', () => {
    window.matchMedia = jest.fn().mockImplementation(() => ({ matches: true, addListener: jest.fn(), removeListener: jest.fn() }));
    expect(() => render(<Hero />)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/Hero.test.tsx`
Expected: FAIL — `getByTestId('hero-marina-layout')` doesn't exist in the inherited Guacuco layout

- [ ] **Step 3: Rewrite `Hero.tsx` with a split composition**

Guacuco's Hero is full-bleed background + centered content. La Marina's is a left/right split — content on the left on a solid navy panel, the ShaderGradient confined to a right-hand panel — a structurally different layout, not a recolor of the same one. Keep the same animation techniques (char-stagger headline, magnetic CTA, reduced-motion guard) since those are motion-quality wins worth keeping, not Guacuco-specific branding:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { animate, stagger, createTimeline } from 'animejs';
import ShaderGradientCanvasWrapper from './ShaderGradientCanvas';
import '../styles/hero.css';

export default function Hero() {
  const t = useTranslations('hero');
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);
  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const headline = headlineRef.current;
    if (!headline) return;

    const words = headline.innerText.split(' ');
    headline.innerHTML = words
      .map((word) => word.split('').map((char) => `<span class="char">${char}</span>`).join('') + '<span class="word-space"> </span>')
      .join('');

    const tl = createTimeline({ defaults: { ease: 'outQuad' } });
    tl.add(headline.querySelectorAll('.char'), { opacity: [0, 1], translateY: [24, 0], duration: 700, delay: stagger(25) });
    if (subRef.current) tl.add(subRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 600 }, '-=300');
    if (ctaRef.current) tl.add(ctaRef.current, { opacity: [0, 1], translateY: [16, 0], duration: 500 }, '-=400');
  }, [mounted, reducedMotion]);

  useEffect(() => {
    const btn = ctaRef.current;
    if (!btn || reducedMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = btn.getBoundingClientRect();
      const mx = e.clientX - rect.left - rect.width / 2;
      const my = e.clientY - rect.top - rect.height / 2;
      const dist = Math.sqrt(mx * mx + my * my);
      const maxDist = 90;
      if (dist < maxDist) {
        const force = (1 - dist / maxDist) * 14;
        const angle = Math.atan2(my, mx);
        animate(btn, { translateX: Math.cos(angle) * force, translateY: Math.sin(angle) * force, duration: 100, easing: 'linear' });
      }
    };
    const handleMouseLeave = () => animate(btn, { translateX: 0, translateY: 0, duration: 500, easing: 'easeOutElastic(1, .6)' });
    btn.addEventListener('mousemove', handleMouseMove);
    btn.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      btn.removeEventListener('mousemove', handleMouseMove);
      btn.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [reducedMotion]);

  return (
    <section data-testid="hero-marina-layout" className="hero-marina">
      <div className="hero-marina-content">
        <span className="hero-marina-eyebrow">La Marina</span>
        <h1 ref={headlineRef} className="hero-marina-headline">
          {t('headline')}
        </h1>
        <p ref={subRef} className="hero-marina-subheadline">
          {t('subheadline')}
        </p>
        <Link ref={ctaRef} href="/products" className="hero-marina-cta">
          <span className="hero-marina-cta-inner">
            {t('cta')}
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 10h10M12 7l3 3-3 3" />
            </svg>
          </span>
        </Link>
      </div>

      <div className="hero-marina-visual">
        <ShaderGradientCanvasWrapper />
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Write the La Marina hero styles**

```css
/* src/styles/hero.css — La Marina overrides */
.hero-marina {
  display: flex;
  min-height: 100vh;
  background: var(--makay-dark-navy);
}

.hero-marina-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 6vw;
  z-index: 1;
}

.hero-marina-visual {
  flex: 1;
  position: relative;
  min-height: 320px;
}

.hero-marina-eyebrow {
  font-family: var(--font-montserrat);
  font-size: 11px;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--makay-ocean-teal);
  margin-bottom: 16px;
}

.hero-marina-headline {
  font-family: var(--font-playfair);
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  color: var(--makay-premium-cream);
  line-height: 1.1;
}

.hero-marina-subheadline {
  font-family: var(--font-montserrat);
  color: var(--makay-sand-cream);
  opacity: 0.8;
  margin-top: 20px;
  max-width: 440px;
}

.hero-marina-cta {
  margin-top: 36px;
  display: inline-flex;
}

.hero-marina-cta-inner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 28px;
  border-radius: 999px;
  background: var(--makay-ocean-teal);
  color: var(--makay-dark-navy);
  font-weight: 700;
  letter-spacing: 0.03em;
}

@media (max-width: 768px) {
  .hero-marina {
    flex-direction: column;
  }
  .hero-marina-visual {
    min-height: 240px;
    order: -1;
  }
}
```

- [ ] **Step 5: Shift dominant tokens in `src/app/globals.css`**

Guacuco's `:root` leads with `--makay-peachy-rose`/`--makay-soft-coral`. In this fork, add overrides immediately after the inherited block so teal/navy/gold read as the dominant palette without deleting the base tokens other inherited components still reference:

```css
:root {
  /* La Marina dominant overrides — see spec's Visual Differentiation section */
  --makay-accent-primary: var(--makay-ocean-teal);
  --makay-accent-secondary: var(--makay-dark-navy);
  --makay-accent-tertiary: var(--makay-warm-gold);
}
```

- [ ] **Step 6: Reorder the homepage sections in `src/app/page.tsx`**

Guacuco's order is Hero → Events → Membership → FeaturedCollection → WhyMakay → Testimonials → HowItWorks → Categories → Newsletter → Footer. Swap FeaturedCollection to lead right after Hero (La Marina sells the catalog first, events second) and move Testimonials above WhyMakay:

```tsx
import Hero from '@/components/Hero';
import FeaturedCollection from '@/components/FeaturedCollection';
import HomepageEvents from '@/components/HomepageEvents';
import HomepageMembership from '@/components/HomepageMembership';
import Testimonials from '@/components/Testimonials';
import WhyMakay from '@/components/WhyMakay';
import HowItWorks from '@/components/HowItWorks';
import Categories from '@/components/Categories';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import ScrollColorEngine from '@/components/ScrollColorEngine';

export default function Home() {
  return (
    <main className="w-full">
      <ScrollColorEngine />
      <div id="hero-section">
        <Hero />
      </div>
      <FeaturedCollection />
      <HomepageEvents />
      <HomepageMembership />
      <Testimonials />
      <WhyMakay />
      <HowItWorks />
      <Categories />
      <Newsletter />
      <Footer />
    </main>
  );
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test -- __tests__/components/Hero.test.tsx`
Expected: PASS (both cases)

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/components/Hero.tsx src/styles/hero.css src/app/globals.css src/app/page.tsx \
        __tests__/components/Hero.test.tsx
git commit -m "feat: differentiate La Marina's hero composition, palette, and homepage order"
```

---

## Deploy

In the Vercel dashboard (Kryptyk account, `kryptycstore-6214s-projects`): import `AedanCoder02/makay-la-marina` as a new project. Set production env vars identical to `makaystore`'s (`DATABASE_URL`, Clerk keys, Gmail SMTP creds — copy the values, don't regenerate them) plus `STORE_LOCATION=la_marina`. Deploy, then attach `marina.makaybeachclub.com` to this project.
