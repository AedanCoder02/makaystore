# Guacuco site (makaystore repo)

Public site and shared back office for Makay Beach Club, Playa Guacuco.
Live at guacuco.makaybeachclub.com. Last updated 2026-11-22.

## Stack

| Layer | What |
|---|---|
| Framework | Next.js 16.2 App Router, React 19.2, TypeScript. `src/proxy.ts` is the middleware (Next 16 name). |
| Styling | Plain CSS per area in `src/styles/*.css`, Tailwind 4 available. Motion with animejs v4. |
| Database | Neon Postgres through `postgres` (postgres.js), raw SQL in route handlers and `src/lib`. Tables are created on first use with `CREATE TABLE IF NOT EXISTS` guards (`ensureXSchema()` helpers). |
| Auth | Clerk is primary. Roles live in `publicMetadata.role`, `roles[]` and `permissions[]`. Neon Auth exists as a parallel test sign-in at `/neon-auth`. |
| i18n | next-intl, cookie `NEXT_LOCALE` (`es` default, `en`). Strings in `src/i18n/{es,en}.json`. |
| Payments | Stripe (card), Binance Pay, and manual methods (Pago Movil, transfer, Zelle) verified by staff. |
| Hosting | Vercel project `makaystore`. Production deploys from `master`. |

## Branches

`main` and `master` diverged in October 2026. Work branch `claude/project-thread-3vfblr` is based on `main` with `master` merged in; PR #5 targets `master`. Merge that PR before anything else lands on `master`.

## Areas

| Path | Who | Notes |
|---|---|---|
| `/` | Public | Hero, events, membership, experiences, why, a day at Makay, community reviews, newsletter, footer. All copy editable in Studio. |
| `/events`, `/events/[id]` | Public | Only active events that are not past (12 h grace). Paid tickets go through checkout as `event-<id>` cart items. |
| `/membership`, `/reservations`, `/products`, `/cart`, `/checkout` | Public | Prices are recomputed on the server (`src/lib/orderPricing.ts`); the client total is only a check. |
| `/legal/{privacy,terms,cookies}` | Public | EN/ES text in `legal.*` keys. Draft text: have it reviewed by a lawyer. |
| `/profile` | Signed in | Client profile, member card, wallet. |
| `/seller/*` | Seller, worker, supervisor, admin | POS, products, stock, activity, rotation, Studio, events, memberships, reservations. |
| `/supervisor/*` | Supervisor, admin | Overview, staff, orders, payments, shifts, reports. |
| `/admin/*` | Admin | Dashboard, orders, payments, users, customers, reports, goals, events, memberships, reviews, allies, payroll. |

API routes under `/api/seller`, `/api/supervisor`, `/api/admin` check roles with `requireAccess(level)` from `src/lib/apiAuth.ts`.

## Locations

One back office serves both clubs. `STORE_LOCATION` (env) fixes the location of the public site (`guacuco` here, `la_marina` in the La Marina app). Staff switch the location their panel shows with the location switcher (cookie `panel_location`).

## Studio

All editable content is one JSONB blob in `theme_settings` row `id = 1`.
Keys look like `page:<page>:content:<key>`, with optional `@es` / `@en` suffixes for per-language text, and `page:home:hero:<prop>` for hero style. Saving sends only the changed keys; the server merges them, and a `null` value removes a key. Read on the server once per request (`src/lib/siteSettings.ts`) and exposed to components with `useSiteContent()`.

If the hero or a section still shows an old English sentence in Spanish, that text was saved in Studio before per-language keys existed. Clear the field in Studio and save.

## Reports

Sales targets and cost % live in `report_settings` (`src/lib/reportSettings.ts`) and are shared by admin reports, supervisor reports, the seller dashboard and the emailed reports. Older rows in `theme_settings` (key/value) are still read as a fallback.

## Customers

`/admin/clients` (Customers) reads the shared `contacts` table. This app never writes it; rows are merged in from Yimi, Makay Roulette, store accounts and walk-ins, the CRM and a historical CSV, tagged in `sources`. `crm_contacts` (filled by `/api/admin/crm/sync-contacts`) is not read anywhere.

## Reviews and newsletter

- `club_reviews`: signed-in guests write one review per 30 days; staff approve or hide them at `/admin/reviews`. Only approved reviews show on the homepage.
- `newsletter_subscribers`: homepage form. Admin CSV export at `/api/admin/newsletter`.

## Environment variables

Names only. Values live in Vercel.

`DATABASE_URL`, `STORE_LOCATION`, `NEXT_PUBLIC_SITE_URL`, Clerk keys and `CLERK_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `BINANCE_PAY_API_KEY`, `BINANCE_PAY_SECRET_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `REPORT_EMAIL`, `CRON_SECRET`, `YIMI_REPORT_API_SECRET`, `AGENTIZAR_API_KEY`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, 3D generation (`GENERATION_PROVIDER`, `FAL_KEY`, `MESHY_API_KEY`, `TRIPO3D_API_KEY`, `TRIPO_LOCAL_URL`).

## Commands

```bash
npm install
npm run dev               # needs .env.local with at least DATABASE_URL and Clerk keys
npx tsc --noEmit -p .     # type check (test files report jest globals; ignore those)
npm test                  # jest
```

## Known gaps

- Studio editor labels and some customer-facing checkout components are not translated yet.
- The public `/events` listing still carries old fashion-store membership perks in `EventsListing.tsx` (`TIERS`).
- Unused homepage components kept for now: `FeaturedCollection`, `WhyMakay`, `Testimonials`, `HowItWorks`.
