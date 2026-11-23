# Apex Selector Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new, standalone premium landing page at `makaybeachclub.com` that lets a visitor choose between the Guacuco and La Marina storefronts, built to the mandatory Web Excellence standard (ShaderGradient background, Lenis scroll, anime.js entrance, StringTune magnetic cards) — not a reuse of the Roulette app's flat-card selector pattern.

**Architecture:** A brand-new, minimal Next.js 16 app (`makay-selector`) with exactly one real route: the selector itself. No database, no auth, no API routes — it only renders two outbound links to the two subdomains. Mirrors `makaystore`'s dependency versions and conventions (Tailwind 4, Jest + RTL, the same `ShaderGradientCanvasWrapper`/`LenisProvider` patterns) so it's a familiar codebase, scoped down to the absolute minimum this one page needs.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, Tailwind CSS 4, `lenis` 1.3.25, `animejs` 4.5.0, `@fiddle-digital/string-tune` 1.2.0, `@shadergradient/react` 2.4.20 + `three`/`@react-three/fiber`/`@react-three/drei`, `lucide-react`, Jest 30 + React Testing Library 16.

**Spec:** `D:\AP\projects\makaystore\docs\superpowers\specs\2026-10-10-location-selector-and-la-marina-design.md`

## Global Constraints

- Exactly two destination links: `NEXT_PUBLIC_GUACUCO_URL` (default `https://guacuco.makaybeachclub.com`) and `NEXT_PUBLIC_MARINA_URL` (default `https://marina.makaybeachclub.com`) — both read from env vars with those literal defaults, never hardcoded elsewhere in the component tree.
- `prefers-reduced-motion` must be respected — anime.js entrance and StringTune magnetic effects skip when it's set.
- The WebGL ShaderGradient background is disabled below 768px width, per the project's standing mobile rule (same pattern as `makaystore`'s `ShaderGradientCanvas.tsx`).
- **StringTune gotcha (logged 2026-10-08):** modules must be explicitly registered via `.use(StringMagnetic)` before `.start()` — attributes are silently inert otherwise. `StringMagnetic` only sets `--magnetic-x`/`--magnetic-y` CSS variables; the host CSS must translate those into a visible `transform`.
- **Lenis × StringTune gotcha (logged 2026-08-23):** StringTune's desktop scroll mode defaults to its own `'smooth'` engine, which fights Lenis for scroll ownership. Must explicitly set `scrollDesktopMode: 'default'` (and `scrollMobileMode: 'default'`) before `.start()` so Lenis stays the sole scroll-physics owner.
- **ShaderGradient `waterPlane` gotcha (logged 2026-08-23):** needs manual camera framing to fill its container; `type="plane"` is the simpler, screen-space-filling variant that needs no camera props. Use `type="plane"` here.

## Review Focus

- A visitor has `prefers-reduced-motion` enabled — the page must still be fully usable (both links visible and clickable) with no animation, not broken or blank. Covered in Task 4.
- A visitor on a phone (under 768px) — the WebGL canvas must not load at all (battery/perf), replaced by a static gradient. Covered in Task 2.
- `NEXT_PUBLIC_GUACUCO_URL`/`NEXT_PUBLIC_MARINA_URL` are unset (e.g. a preview deploy without env vars configured) — the page must still render working links via the hardcoded defaults, not crash or render `href="undefined"`. Covered in Task 3.
- A visitor tabs through the page with a keyboard, no mouse — both destination cards must be reachable and activatable (they're real `<a>` elements, not `onClick`-only `<div>`s depending on StringTune's hover state to be usable). Covered in Task 3.
- StringTune's magnetic effect is applied to an element whose module was never `.use()`-registered — this exact bug has already shipped silently once in another project. Covered in Task 5 with an explicit `getComputedStyle` assertion under a simulated hover, not just "the attribute is present."

---

## File Structure

- `D:\AP\projects\makay-selector\` — new repo root.
- `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `jest.config.cjs`, `jest.setup.cjs` — scaffold, mirroring `makaystore`'s.
- `src/app/layout.tsx` — root layout: fonts, global CSS import, `<LenisProvider>` wrapper.
- `src/app/globals.css` — Tailwind import + the subset of `--makay-*` CSS variables both palettes need (copied from `makaystore/src/app/globals.css`) + the StringTune magnetic consumer CSS rule.
- `src/app/page.tsx` — the selector page itself (headline, two `<LocationCard>`s).
- `src/components/providers/LenisProvider.tsx` — copied verbatim from `makaystore`.
- `src/components/SelectorBackground.tsx` — the mobile-disabled ShaderGradient background (adapted from `makaystore`'s `ShaderGradientCanvas.tsx`).
- `src/components/LocationCard.tsx` — one destination card (link, headline, palette swatch).
- `src/components/providers/StringTuneProvider.tsx` — registers `StringMagnetic`, sets scroll modes, starts the engine.
- `__tests__/mocks/` — `fileMock.js`, `shaderGradient.js`, `three.js`, `reactThree.js`, `shaderGradientCanvas.js`, `animejs.js` — copied verbatim from `makaystore`'s equivalents.
- `__tests__/components/LocationCard.test.tsx`
- `__tests__/components/SelectorBackground.test.tsx`
- `__tests__/app/page.test.tsx`

---

### Task 1: Scaffold the `makay-selector` Next.js app

**Files:**
- Create: `D:\AP\projects\makay-selector\package.json`
- Create: `D:\AP\projects\makay-selector\tsconfig.json`
- Create: `D:\AP\projects\makay-selector\next.config.mjs`
- Create: `D:\AP\projects\makay-selector\postcss.config.mjs`
- Create: `D:\AP\projects\makay-selector\jest.config.cjs`
- Create: `D:\AP\projects\makay-selector\jest.setup.cjs`
- Create: `D:\AP\projects\makay-selector\src\app\layout.tsx`
- Create: `D:\AP\projects\makay-selector\src\app\globals.css`
- Create: `D:\AP\projects\makay-selector\src\app\page.tsx` (placeholder — Task 4 replaces the body)
- Create: `D:\AP\projects\makay-selector\__tests__\mocks\fileMock.js`, `shaderGradient.js`, `three.js`, `reactThree.js`, `shaderGradientCanvas.js`, `animejs.js`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm run dev` / `npm test` setup every later task builds on.

- [ ] **Step 1: Create the directory and initialize git**

```bash
mkdir "D:\AP\projects\makay-selector"
cd "D:\AP\projects\makay-selector"
git init
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "makay-selector",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest --config jest.config.cjs",
    "test:watch": "jest --config jest.config.cjs --watch"
  },
  "dependencies": {
    "@fiddle-digital/string-tune": "^1.2.0",
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.6.1",
    "@shadergradient/react": "^2.4.20",
    "animejs": "^4.5.0",
    "camera-controls": "^3.1.2",
    "lenis": "^1.3.25",
    "lucide-react": "^1.23.0",
    "next": "16.2.10",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "three": "^0.185.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "babel-jest": "^30.4.1",
    "identity-obj-proxy": "^3.0.0",
    "jest": "^30.4.2",
    "jest-environment-jsdom": "^30.4.2",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `next.config.mjs`**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 5: Write `postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 6: Write `jest.config.cjs`**

```js
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__tests__/mocks/fileMock.js',
    '^animejs$': '<rootDir>/__tests__/mocks/animejs.js',
    '^@shadergradient/react$': '<rootDir>/__tests__/mocks/shaderGradient.js',
    '^three$': '<rootDir>/__tests__/mocks/three.js',
    '^@react-three/(.*)$': '<rootDir>/__tests__/mocks/reactThree.js',
    '^@/components/SelectorBackground$': '<rootDir>/__tests__/mocks/shaderGradientCanvas.js',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

module.exports = config;
```

- [ ] **Step 7: Write `jest.setup.cjs`**

```js
require('@testing-library/jest-dom');

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.IntersectionObserver = class IntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => jest.clearAllMocks());
```

- [ ] **Step 8: Copy the Jest mock files from `makaystore` verbatim**

```bash
mkdir -p __tests__/mocks
cp "D:\AP\projects\makaystore\__tests__\mocks\fileMock.js" __tests__/mocks/
cp "D:\AP\projects\makaystore\__tests__\mocks\shaderGradient.js" __tests__/mocks/
cp "D:\AP\projects\makaystore\__tests__\mocks\three.js" __tests__/mocks/
cp "D:\AP\projects\makaystore\__tests__\mocks\reactThree.js" __tests__/mocks/
cp "D:\AP\projects\makaystore\__tests__\mocks\shaderGradientCanvas.js" __tests__/mocks/
cp "D:\AP\projects\makaystore\__tests__\mocks\animejs.js" __tests__/mocks/
```

- [ ] **Step 9: Write a minimal `src/app/layout.tsx` and `src/app/globals.css`**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import LenisProvider from "@/components/providers/LenisProvider";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });

export const metadata: Metadata = {
  title: "Makay Beach Club",
  description: "Choose your Makay location",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${montserrat.variable}`}>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
```

```css
/* src/app/globals.css */
@import "tailwindcss";

:root {
  --makay-peachy-rose: #D4A574;
  --makay-soft-coral: #E8B4A6;
  --makay-sand-cream: #F5EFE5;
  --makay-premium-cream: #FFF8F0;
  --makay-ocean-teal: #4A9FB5;
  --makay-warm-gold: #D4AF37;
  --makay-dark-navy: #2C2C2C;
  --makay-mauve: #A89080;
}

body {
  font-family: var(--font-montserrat), sans-serif;
  background: var(--makay-dark-navy);
  color: var(--makay-premium-cream);
}

/* StringTune magnetic consumer rule — StringMagnetic only sets CSS vars,
   it never applies a transform itself. See Global Constraints. */
[data-string="magnetic"] {
  transform: translate(calc(var(--magnetic-x, 0) * 1px), calc(var(--magnetic-y, 0) * 1px));
}
```

```tsx
// src/app/page.tsx (placeholder — replaced in Task 4)
export default function Home() {
  return <main />;
}
```

- [ ] **Step 10: Copy `LenisProvider.tsx` verbatim from `makaystore`**

```bash
mkdir -p src/components/providers
cp "D:\AP\projects\makaystore\src\components\providers\LenisProvider.tsx" src/components/providers/
```

- [ ] **Step 11: Install dependencies and verify the scaffold boots**

```bash
cd "D:\AP\projects\makay-selector"
npm install
npm run dev
```

Expected: dev server starts on `localhost:3000` with no errors; visiting it shows a blank page (the placeholder `<main />`).

Stop the dev server, then:

```bash
npm test
```

Expected: `No tests found` (exit code non-zero is fine here — there are no test files yet; this just confirms Jest itself runs without a config error).

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold makay-selector Next.js app"
```

---

### Task 2: `SelectorBackground` — mobile-disabled ShaderGradient

**Files:**
- Create: `src/components/SelectorBackground.tsx`
- Test: `__tests__/components/SelectorBackground.test.tsx`

**Interfaces:**
- Consumes: `ShaderGradientCanvas`/`ShaderGradient` from `@shadergradient/react` (mocked in tests via `__tests__/mocks/shaderGradient.js`, copied in Task 1).
- Produces: `export default function SelectorBackground()` — no props, renders either the WebGL canvas (desktop) or a static gradient div (mobile), per the project's standing rule.

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/SelectorBackground.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import SelectorBackground from '@/components/SelectorBackground';

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
}

describe('SelectorBackground', () => {
  it('renders the WebGL canvas above 768px', () => {
    setViewportWidth(1200);
    const { container } = render(<SelectorBackground />);
    expect(container.querySelector('[data-testid="shader-gradient-canvas"]')).toBeInTheDocument();
  });

  it('renders a static gradient below 768px, not the WebGL canvas', () => {
    setViewportWidth(600);
    const { container } = render(<SelectorBackground />);
    expect(container.querySelector('[data-testid="shader-gradient-canvas"]')).not.toBeInTheDocument();
    expect(container.querySelector('.selector-mobile-gradient')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/SelectorBackground.test.tsx`
Expected: FAIL — `Cannot find module '@/components/SelectorBackground'`

- [ ] **Step 3: Write the component**

Adapted from `makaystore/src/components/ShaderGradientCanvas.tsx`, using `type="plane"` (not `waterPlane` — see Global Constraints) and a palette that blends both locations' tones:

```tsx
// src/components/SelectorBackground.tsx
'use client';

import { useEffect, useState } from 'react';
import { ShaderGradientCanvas as SGCanvas, ShaderGradient } from '@shadergradient/react';

export default function SelectorBackground() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return <div className="absolute inset-0 w-full h-full selector-mobile-gradient" />;
  }

  return (
    <SGCanvas
      data-testid="shader-gradient-canvas"
      className="absolute inset-0 w-full h-full"
      style={{ position: 'absolute', inset: 0 }}
      pointerEvents="none"
    >
      <ShaderGradient
        control="props"
        type="plane"
        animate="on"
        uSpeed={0.25}
        uStrength={2.2}
        uDensity={1.6}
        color1="#D4A574"
        color2="#4A9FB5"
        color3="#2C2C2C"
        brightness={1.1}
        grain="on"
      />
    </SGCanvas>
  );
}
```

Add the matching mobile-gradient CSS to `src/app/globals.css`:

```css
.selector-mobile-gradient {
  background: linear-gradient(135deg, var(--makay-peachy-rose), var(--makay-ocean-teal), var(--makay-dark-navy));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/components/SelectorBackground.test.tsx`
Expected: PASS (both cases)

- [ ] **Step 5: Commit**

```bash
git add src/components/SelectorBackground.tsx src/app/globals.css __tests__/components/SelectorBackground.test.tsx
git commit -m "feat: add mobile-disabled ShaderGradient background"
```

---

### Task 3: `LocationCard` component

**Files:**
- Create: `src/components/LocationCard.tsx`
- Test: `__tests__/components/LocationCard.test.tsx`

**Interfaces:**
- Consumes: nothing external.
- Produces: `export default function LocationCard({ href, name, tagline, accentColor }: LocationCardProps)` — a real `<a>` link, keyboard-reachable, with `data-string="magnetic"` for Task 5 to animate.

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/components/LocationCard.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import LocationCard from '@/components/LocationCard';

describe('LocationCard', () => {
  it('renders as a real anchor pointing at href', () => {
    render(<LocationCard href="https://guacuco.makaybeachclub.com" name="Guacuco" tagline="Tropical beach club" accentColor="#D4A574" />);
    const link = screen.getByRole('link', { name: /Guacuco/ });
    expect(link).toHaveAttribute('href', 'https://guacuco.makaybeachclub.com');
  });

  it('renders the tagline text', () => {
    render(<LocationCard href="https://marina.makaybeachclub.com" name="La Marina" tagline="Nautical waterfront" accentColor="#4A9FB5" />);
    expect(screen.getByText('Nautical waterfront')).toBeInTheDocument();
  });

  it('marks itself as magnetic for StringTune', () => {
    render(<LocationCard href="https://marina.makaybeachclub.com" name="La Marina" tagline="Nautical waterfront" accentColor="#4A9FB5" />);
    expect(screen.getByRole('link', { name: /La Marina/ })).toHaveAttribute('data-string', 'magnetic');
  });

  it('is keyboard-reachable (no tabindex=-1, no onClick-only div)', () => {
    render(<LocationCard href="https://guacuco.makaybeachclub.com" name="Guacuco" tagline="Tropical beach club" accentColor="#D4A574" />);
    const link = screen.getByRole('link', { name: /Guacuco/ });
    expect(link.tagName).toBe('A');
    expect(link).not.toHaveAttribute('tabindex', '-1');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/LocationCard.test.tsx`
Expected: FAIL — `Cannot find module '@/components/LocationCard'`

- [ ] **Step 3: Write the component**

```tsx
// src/components/LocationCard.tsx
interface LocationCardProps {
  href: string;
  name: string;
  tagline: string;
  accentColor: string;
}

export default function LocationCard({ href, name, tagline, accentColor }: LocationCardProps) {
  return (
    <a
      href={href}
      data-string="magnetic"
      className="location-card group flex flex-col items-start gap-3 rounded-3xl px-10 py-9 w-full max-w-[380px] border-2 border-transparent transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{ background: 'rgba(255,248,240,0.08)', borderColor: `${accentColor}33` }}
    >
      <span
        className="w-12 h-12 rounded-full flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: accentColor }}
        aria-hidden="true"
      />
      <span className="font-playfair text-3xl font-bold tracking-wide" style={{ fontFamily: 'var(--font-playfair)' }}>
        {name}
      </span>
      <span className="text-xs uppercase tracking-[0.2em] opacity-70">{tagline}</span>
    </a>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/components/LocationCard.test.tsx`
Expected: PASS (all 4 cases)

- [ ] **Step 5: Commit**

```bash
git add src/components/LocationCard.tsx __tests__/components/LocationCard.test.tsx
git commit -m "feat: add LocationCard component"
```

---

### Task 4: Compose the selector page

**Files:**
- Modify: `src/app/page.tsx`
- Test: `__tests__/app/page.test.tsx`

**Interfaces:**
- Consumes: `SelectorBackground` (Task 2), `LocationCard` (Task 3), `process.env.NEXT_PUBLIC_GUACUCO_URL`, `process.env.NEXT_PUBLIC_MARINA_URL`.
- Produces: the rendered page other tasks don't depend on further (terminal).

- [ ] **Step 1: Write the failing test**

```tsx
// __tests__/app/page.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home (selector page)', () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => { process.env = ORIGINAL_ENV; });

  it('renders both destination cards using the default URLs when env vars are unset', () => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NEXT_PUBLIC_GUACUCO_URL;
    delete process.env.NEXT_PUBLIC_MARINA_URL;
    render(<Home />);
    expect(screen.getByRole('link', { name: /Guacuco/ })).toHaveAttribute('href', 'https://guacuco.makaybeachclub.com');
    expect(screen.getByRole('link', { name: /La Marina/ })).toHaveAttribute('href', 'https://marina.makaybeachclub.com');
  });

  it('uses the env var URLs when they are set', () => {
    process.env = { ...ORIGINAL_ENV, NEXT_PUBLIC_GUACUCO_URL: 'https://preview-guacuco.vercel.app', NEXT_PUBLIC_MARINA_URL: 'https://preview-marina.vercel.app' };
    render(<Home />);
    expect(screen.getByRole('link', { name: /Guacuco/ })).toHaveAttribute('href', 'https://preview-guacuco.vercel.app');
    expect(screen.getByRole('link', { name: /La Marina/ })).toHaveAttribute('href', 'https://preview-marina.vercel.app');
  });

  it('renders a headline', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/app/page.test.tsx`
Expected: FAIL — no links/heading rendered by the current placeholder

- [ ] **Step 3: Write the page**

```tsx
// src/app/page.tsx
import SelectorBackground from '@/components/SelectorBackground';
import LocationCard from '@/components/LocationCard';

export default function Home() {
  const guacucoUrl = process.env.NEXT_PUBLIC_GUACUCO_URL || 'https://guacuco.makaybeachclub.com';
  const marinaUrl = process.env.NEXT_PUBLIC_MARINA_URL || 'https://marina.makaybeachclub.com';

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-8 py-16 overflow-hidden">
      <SelectorBackground />

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="h-px w-10" style={{ background: 'rgba(255,248,240,0.4)' }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Makay Beach Club
          </span>
          <div className="h-px w-10" style={{ background: 'rgba(255,248,240,0.4)' }} />
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-center mb-4 tracking-wide leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
          Elige tu Makay
        </h1>
        <p className="text-xs tracking-[0.2em] uppercase mb-12 text-center opacity-70">
          Dos lugares, una misma experiencia
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          <LocationCard href={guacucoUrl} name="Guacuco" tagline="Playa tropical" accentColor="#D4A574" />
          <LocationCard href={marinaUrl} name="La Marina" tagline="Vista al puerto" accentColor="#4A9FB5" />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/app/page.test.tsx`
Expected: PASS (all 3 cases)

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx __tests__/app/page.test.tsx
git commit -m "feat: compose the selector landing page"
```

---

### Task 5: Motion layer — anime.js entrance + StringTune magnetic, with reduced-motion handling

**Files:**
- Create: `src/components/providers/StringTuneProvider.tsx`
- Modify: `src/app/layout.tsx` — wrap children in `<StringTuneProvider>`, inside `<LenisProvider>`.
- Modify: `src/app/page.tsx` — add the anime.js staggered entrance.
- Test: `__tests__/components/StringTuneProvider.test.tsx`

**Interfaces:**
- Consumes: `@fiddle-digital/string-tune`'s `StringTune`, `StringMagnetic` exports; `animejs`'s `animate`, `stagger`.
- Produces: nothing new consumed elsewhere (terminal motion wiring).

- [ ] **Step 1: Write the failing test for `StringTuneProvider`**

This pins exactly the bug already hit once in another project — module registration before `.start()`, and the correct scroll-mode handoff to Lenis:

```tsx
// __tests__/components/StringTuneProvider.test.tsx
const useMock = jest.fn();
const startMock = jest.fn();
let scrollDesktopModeSet: string | undefined;
let scrollMobileModeSet: string | undefined;

jest.mock('@fiddle-digital/string-tune', () => {
  class FakeStringMagnetic {}
  return {
    StringTune: jest.fn().mockImplementation(() => ({
      use: useMock,
      start: startMock,
      set scrollDesktopMode(v: string) { scrollDesktopModeSet = v; },
      set scrollMobileMode(v: string) { scrollMobileModeSet = v; },
    })),
    StringMagnetic: FakeStringMagnetic,
  };
});

import React from 'react';
import { render } from '@testing-library/react';
import StringTuneProvider from '@/components/providers/StringTuneProvider';

describe('StringTuneProvider', () => {
  beforeEach(() => {
    useMock.mockClear();
    startMock.mockClear();
    scrollDesktopModeSet = undefined;
    scrollMobileModeSet = undefined;
  });

  it('registers StringMagnetic before starting', () => {
    render(<StringTuneProvider><div /></StringTuneProvider>);
    expect(useMock).toHaveBeenCalled();
    const useOrder = useMock.mock.invocationCallOrder[0];
    const startOrder = startMock.mock.invocationCallOrder[0];
    expect(useOrder).toBeLessThan(startOrder);
  });

  it('sets both scroll modes to "default" so Lenis stays the scroll owner', () => {
    render(<StringTuneProvider><div /></StringTuneProvider>);
    expect(scrollDesktopModeSet).toBe('default');
    expect(scrollMobileModeSet).toBe('default');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/StringTuneProvider.test.tsx`
Expected: FAIL — `Cannot find module '@/components/providers/StringTuneProvider'`

- [ ] **Step 3: Write the provider**

```tsx
// src/components/providers/StringTuneProvider.tsx
'use client';

import { useEffect } from 'react';
import { StringTune, StringMagnetic } from '@fiddle-digital/string-tune';

export default function StringTuneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const instance = new StringTune();
    instance.use(StringMagnetic);
    // StringTune's default desktop scroll engine is its own 'smooth' interpolation,
    // which fights Lenis for scroll ownership — force 'default' on both so Lenis
    // stays the sole scroll-physics owner (see Global Constraints).
    instance.scrollDesktopMode = 'default';
    instance.scrollMobileMode = 'default';
    instance.start(60);

    return () => {
      // StringTune has no documented destroy(); nothing to tear down beyond
      // letting the instance fall out of scope on unmount.
    };
  }, []);

  return <>{children}</>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/components/StringTuneProvider.test.tsx`
Expected: PASS (both cases)

- [ ] **Step 5: Wire it into `src/app/layout.tsx`**

```tsx
import StringTuneProvider from "@/components/providers/StringTuneProvider";
// ...
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${montserrat.variable}`}>
        <LenisProvider>
          <StringTuneProvider>{children}</StringTuneProvider>
        </LenisProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Add the anime.js entrance to `src/app/page.tsx`**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';
import SelectorBackground from '@/components/SelectorBackground';
import LocationCard from '@/components/LocationCard';

export default function Home() {
  const guacucoUrl = process.env.NEXT_PUBLIC_GUACUCO_URL || 'https://guacuco.makaybeachclub.com';
  const marinaUrl = process.env.NEXT_PUBLIC_MARINA_URL || 'https://marina.makaybeachclub.com';
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !contentRef.current) return;

    const els = contentRef.current.querySelectorAll('[data-entrance]');
    animate(els, {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(120),
      duration: 500,
      ease: 'outCubic',
    });
  }, []);

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen px-8 py-16 overflow-hidden">
      <SelectorBackground />

      <div ref={contentRef} className="relative z-10 flex flex-col items-center">
        <div data-entrance style={{ opacity: 0 }} className="flex items-center justify-center gap-3 mb-5">
          <div className="h-px w-10" style={{ background: 'rgba(255,248,240,0.4)' }} />
          <span className="text-[10px] tracking-[0.25em] uppercase" style={{ fontFamily: 'var(--font-montserrat)' }}>
            Makay Beach Club
          </span>
          <div className="h-px w-10" style={{ background: 'rgba(255,248,240,0.4)' }} />
        </div>

        <h1 data-entrance style={{ opacity: 0, fontFamily: 'var(--font-playfair)' }} className="text-5xl md:text-6xl font-bold text-center mb-4 tracking-wide leading-tight">
          Elige tu Makay
        </h1>
        <p data-entrance style={{ opacity: 0 }} className="text-xs tracking-[0.2em] uppercase mb-12 text-center opacity-70">
          Dos lugares, una misma experiencia
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          <div data-entrance style={{ opacity: 0 }}>
            <LocationCard href={guacucoUrl} name="Guacuco" tagline="Playa tropical" accentColor="#D4A574" />
          </div>
          <div data-entrance style={{ opacity: 0 }}>
            <LocationCard href={marinaUrl} name="La Marina" tagline="Vista al puerto" accentColor="#4A9FB5" />
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Re-run the page test from Task 4 to confirm no regression**

Run: `npm test -- __tests__/app/page.test.tsx`
Expected: PASS — the reduced-motion branch means `jest.setup.cjs`'s `matchMedia` mock (which returns `matches: false`) still triggers the animation path, but since `animejs` itself is mocked (per `jest.config.cjs`'s `moduleNameMapper`), this doesn't assert pixel output, only that the links/heading still render.

- [ ] **Step 8: Run the full test suite**

Run: `npm test`
Expected: PASS (all files)

- [ ] **Step 9: Commit**

```bash
git add src/components/providers/StringTuneProvider.tsx src/app/layout.tsx src/app/page.tsx \
        __tests__/components/StringTuneProvider.test.tsx
git commit -m "feat: add anime.js entrance and StringTune magnetic cards"
```

---

## Deploy

```bash
cd "D:\AP\projects\makay-selector"
gh repo create AedanCoder02/makay-selector --private --source=. --remote=origin --push
```

Then, in the Vercel dashboard (Kryptyk account, `kryptycstore-6214s-projects`): import the new GitHub repo as a new project, set `NEXT_PUBLIC_GUACUCO_URL=https://guacuco.makaybeachclub.com` and `NEXT_PUBLIC_MARINA_URL=https://marina.makaybeachclub.com` as production env vars, deploy, then attach the apex domain `makaybeachclub.com` to this project (moving it off whichever project currently holds it).
