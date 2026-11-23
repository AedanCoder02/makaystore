# Location Selector + Makay La Marina — Design Spec

**Date:** 2026-10-10
**Status:** Approved for planning

## Problem

Makay Beach Club currently operates a single storefront (internally "Guacuco") at the apex domain. The business is opening a second physical location, "La Marina," and needs:

1. A premium landing page at the apex domain that lets a visitor choose which location's store to enter.
2. A second storefront for La Marina — visually distinct from Guacuco but built on the same codebase, backend, and business entity.

The business is one entity: one Clerk auth instance, one Neon database, one staff/admin backoffice. Only the **storefront presentation** and **product catalogs** differ per location.

## Domain & Routing

- `makaybeachclub.com` (apex) — new selector landing page. No longer resolves directly to Guacuco.
- `guacuco.makaybeachclub.com` — existing `makaystore` app (this repo), now also bound to this subdomain. Keeps `/admin`, `/seller`, `/supervisor`, `/worker`.
- `marina.makaybeachclub.com` — new forked repo/Vercel project (`makay-la-marina`), storefront-only.

Both subdomain apps connect to the same Neon DB and the same Clerk application/keys, so one login works on either, and staff manage both locations from the single backoffice on the Guacuco app.

## Data Model

Add a `location` column to location-scoped tables:

- `products.location` — `'guacuco' | 'la_marina'`, NOT NULL. Catalogs are fully separate — no shared SKUs between locations.
- `orders.location`, `seller_orders.location` — stamped from the product(s)/session location at creation time, for reporting and backoffice filtering.

Tables that stay global (no location column, no split): `user_profiles`, Clerk users/roles, `membership_authorized_users`, `theme_settings` (each app gets its own theme row — see Visual Differentiation), `wallet_transactions`, `credit_lines`. Membership is a property of the person, not the location.

Events/reservations: out of scope for this spec unless later confirmed as location-specific — ship location-scoping for products/orders only; revisit if events need the same treatment.

## Backoffice Changes (Guacuco app)

- Admin, seller, and supervisor layouts gain a **location switcher** (a persistent session-scoped value, e.g. stored in a cookie or the panel's layout state) defaulting to `guacuco`.
- Every products/orders/reports query in `/admin`, `/seller`, `/supervisor` filters by the switcher's current location.
- No new admin routes are built on the La Marina app — it has none.

## Selector Landing Page (apex domain)

A new page, not a reuse of the Roulette `RouletteSelector` flat-card pattern — built to the mandatory Web Excellence standard:

- **Background:** ShaderGradient ambient gradient blending both locations' palettes (tropical coral/gold ↔ nautical navy/teal).
- **Scroll/feel:** Lenis smooth scroll even though the page is likely single-viewport; keeps consistent feel with the rest of the stack.
- **Entrance:** anime.js staggered reveal — logo, then headline, then the two destination cards.
- **Interaction:** StringTune magnetic cursor/hover behavior on the two cards; subtle parallax on background elements.
- **Content:** two large cards, one per location, each previewing that location's palette/mood, linking to its subdomain (`guacuco.makaybeachclub.com` / `marina.makaybeachclub.com`).
- **Reduced motion:** respect `prefers-reduced-motion`; disable WebGL background below 768px per the standing mobile rule.

This page lives in its own minimal app/route — implementation plan decides whether it's a third micro-deployment or a route inside one of the existing apps proxied at the apex; default assumption is a small standalone Next.js app at the apex, since neither storefront app should "own" the gate.

## Visual Differentiation — La Marina

Same design-token architecture as Guacuco (CSS variables, Playfair Display + Montserrat pairing) but a different mix, so pages never read as a palette-swapped clone:

- Dominant tokens shift toward `--makay-ocean-teal` and `--makay-dark-navy`, with `--makay-warm-gold` as the accent.
- De-emphasize `--makay-peachy-rose` / `--makay-soft-coral` (Guacuco's signature warm tones).
- Different hero composition, section order, and component choices from Guacuco's homepage — not just a recolor of the same layout.
- Exact palette values, imagery, and layout decisions are made during implementation, within this constraint.

## Build Strategy

1. Fork `D:\AP\projects\makaystore` → `D:\AP\projects\makay-la-marina` (new GitHub repo `AedanCoder02/makay-la-marina`).
2. In the fork, remove `/admin`, `/seller`, `/supervisor`, `/worker` routes and their API routes. Keep storefront, `/products`, `/cart`, `/checkout`, `/membership`, `/events`, `/profile`, `/orders`, `/sign-in`, `/sign-up`.
3. Point the fork's env vars at the same Neon DB connection string and same Clerk keys as `makaystore`.
4. New Vercel project under the Kryptyk account; attach `marina.makaybeachclub.com`.
5. Attach `guacuco.makaybeachclub.com` to the existing `makaystore` Vercel project (in addition to, or replacing, the apex binding currently there).
6. Build the new apex selector app/route and attach `makaybeachclub.com` to it.
7. Migrate `products`/`orders`/`seller_orders` to add and backfill the `location` column (existing rows backfill to `'guacuco'`).
8. Add the location switcher to the three backoffice layouts in the Guacuco app.

## Out of Scope

- Splitting membership, wallet, or loyalty systems per location.
- Location-specific staff roles/permissions (any admin/seller/supervisor can already switch locations).
- Events/reservations location-scoping (revisit later if needed).
- Changing the Roulette kiosk app.

## Open Questions for Implementation Plan

- Exact mechanism for serving the apex selector: standalone Next.js app vs. a route group in one existing app with domain-based rendering. Recommend standalone, given above.
- Whether `theme_settings` needs a `location` key or a second row keyed by app, so each Studio editor only ever edits its own app's theme.
