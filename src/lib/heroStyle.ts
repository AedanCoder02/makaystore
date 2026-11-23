import type { CSSProperties } from 'react';

/** Studio keys for the homepage hero title styling. */
export const HERO_KEYS = {
  size: 'page:home:hero:titleSize',            // max size in rem (2.5 – 9)
  color: 'page:home:hero:titleColor',          // hex
  opacity: 'page:home:hero:titleOpacity',      // 10 – 100
  weight: 'page:home:hero:titleWeight',        // 400 – 900
  italic: 'page:home:hero:titleItalic',        // '1' | '0'
  uppercase: 'page:home:hero:titleUppercase',  // '1' | '0'
  tracking: 'page:home:hero:titleTracking',    // em, -0.05 – 0.3
  gradient: 'page:home:hero:titleGradient',    // '1' | '0'
  gradientFrom: 'page:home:hero:gradientFrom', // hex
  gradientTo: 'page:home:hero:gradientTo',     // hex
  gradientAngle: 'page:home:hero:gradientAngle', // deg
  shadow: 'page:home:hero:titleShadow',        // '1' | '0'
  subtitleColor: 'page:home:hero:subtitleColor',
  overlay: 'page:home:hero:overlay',           // darken video/background, 0 – 80
  ctaHref: 'page:home:hero:ctaHref',
} as const;

export const HERO_DEFAULTS = {
  size: '5', color: '#1f2937', opacity: '100', weight: '800', italic: '0', uppercase: '0',
  tracking: '-0.02', gradient: '0', gradientFrom: '#D4A574', gradientTo: '#4A9FB5', gradientAngle: '120',
  shadow: '0', subtitleColor: '#4b5563', overlay: '0', ctaHref: '/reservations',
};

type Getter = (key: string) => string | undefined;

const HEX = /^#[0-9a-fA-F]{3,8}$/;
const num = (v: string | undefined, d: string, min: number, max: number) => {
  const n = Number(v ?? d);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : Number(d);
};
const hex = (v: string | undefined, d: string) => (v && HEX.test(v) ? v : d);

export function readHeroStyle(get: Getter) {
  const g = (k: keyof typeof HERO_KEYS) => get(HERO_KEYS[k]);
  return {
    size: num(g('size'), HERO_DEFAULTS.size, 2.5, 9),
    color: hex(g('color'), HERO_DEFAULTS.color),
    opacity: num(g('opacity'), HERO_DEFAULTS.opacity, 10, 100),
    weight: num(g('weight'), HERO_DEFAULTS.weight, 400, 900),
    italic: g('italic') === '1',
    uppercase: g('uppercase') === '1',
    tracking: num(g('tracking'), HERO_DEFAULTS.tracking, -0.05, 0.3),
    gradient: g('gradient') === '1',
    gradientFrom: hex(g('gradientFrom'), HERO_DEFAULTS.gradientFrom),
    gradientTo: hex(g('gradientTo'), HERO_DEFAULTS.gradientTo),
    gradientAngle: num(g('gradientAngle'), HERO_DEFAULTS.gradientAngle, 0, 360),
    shadow: g('shadow') === '1',
    subtitleColor: hex(g('subtitleColor'), HERO_DEFAULTS.subtitleColor),
    overlay: num(g('overlay'), HERO_DEFAULTS.overlay, 0, 80),
    ctaHref: safeHref(g('ctaHref')) ?? HERO_DEFAULTS.ctaHref,
  };
}

export type HeroStyle = ReturnType<typeof readHeroStyle>;

/** Internal paths or https links only. */
export function safeHref(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  if (/^\/(?!\/)/.test(s) || /^https:\/\//.test(s) || s.startsWith('#')) return s;
  return undefined;
}

export function heroTitleCss(h: HeroStyle): CSSProperties {
  const minRem = Math.min(2.25, h.size);
  const base: CSSProperties = {
    fontSize: `clamp(${minRem}rem, ${(h.size * 1.6).toFixed(2)}vw, ${h.size}rem)`,
    fontWeight: h.weight,
    fontStyle: h.italic ? 'italic' : 'normal',
    textTransform: h.uppercase ? 'uppercase' : 'none',
    letterSpacing: `${h.tracking}em`,
    opacity: h.opacity / 100,
    textShadow: h.shadow ? '0 6px 30px rgba(0,0,0,0.35)' : undefined,
  };
  if (h.gradient) {
    return {
      ...base,
      backgroundImage: `linear-gradient(${h.gradientAngle}deg, ${h.gradientFrom}, ${h.gradientTo})`,
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      color: 'transparent',
      textShadow: undefined,
      filter: h.shadow ? 'drop-shadow(0 6px 24px rgba(0,0,0,0.3))' : undefined,
    };
  }
  return { ...base, color: h.color };
}
