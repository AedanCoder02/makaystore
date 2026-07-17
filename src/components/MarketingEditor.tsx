'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Check, Globe, ShoppingBag, Package, CreditCard, Palette, Type, FileText, HelpCircle, ExternalLink } from 'lucide-react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

// ── Page definitions ─────────────────────────────────────────────
const PAGES = [
  { id: 'home',           label: 'Home',           icon: Globe,        src: '/',            desc: 'Hero, featured collection, marketing sections' },
  { id: 'products',       label: 'All Products',   icon: ShoppingBag,  src: '/products',    desc: 'Product grid with filters and sorting' },
  { id: 'product-detail', label: 'Product Detail', icon: Package,      src: '/products/1',  desc: 'Single product — click any product card to navigate' },
  { id: 'checkout',       label: 'Checkout',       icon: CreditCard,   src: '/cart',        desc: 'Cart and checkout flow' },
];

// ── Color controls ───────────────────────────────────────────────
const COLOR_CONTROLS = [
  { key: 'bg',        label: 'Page Background',   cssVar: '--makay-premium-cream', extra: '--background',  default: '#FFF8F0' },
  { key: 'sectionBg', label: 'Section Background', cssVar: '--makay-sand-cream',   extra: null,            default: '#F5EFE5' },
  { key: 'primary',   label: 'Primary / Buttons', cssVar: '--makay-peachy-rose',   extra: null,            default: '#D4A574' },
  { key: 'accent',    label: 'Accent',            cssVar: '--makay-soft-coral',    extra: null,            default: '#E8B4A6' },
  { key: 'text',      label: 'Body Text',         cssVar: '--makay-dark-navy',     extra: '--foreground',  default: '#2C2C2C' },
  { key: 'muted',     label: 'Muted / Labels',    cssVar: '--makay-mauve',         extra: null,            default: '#A89080' },
];

// ── Typography ───────────────────────────────────────────────────
const FONT_OPTIONS = [
  { id: 'playfair',   label: 'Playfair Display', value: "'Playfair Display', Georgia, serif",    sample: 'Aa' },
  { id: 'montserrat', label: 'Montserrat',        value: "'Montserrat', sans-serif",              sample: 'Aa' },
  { id: 'georgia',    label: 'Georgia',           value: 'Georgia, "Times New Roman", serif',     sample: 'Aa' },
  { id: 'system',     label: 'System UI',         value: 'system-ui, -apple-system, sans-serif', sample: 'Aa' },
];

const SCALE_OPTIONS = [
  { id: 'xs', label: 'XS', value: '0.82' },
  { id: 'sm', label: 'SM', value: '0.92' },
  { id: 'md', label: 'MD', value: '1.0'  },
  { id: 'lg', label: 'LG', value: '1.12' },
  { id: 'xl', label: 'XL', value: '1.28' },
];

const BODY_SIZE_OPTIONS = [
  { id: 'sm', label: 'Small',  value: '0.9rem' },
  { id: 'md', label: 'Medium', value: '1rem'   },
  { id: 'lg', label: 'Large',  value: '1.1rem' },
];

const LETTER_SPACING_OPTIONS = [
  { id: 'tight',  label: 'Tight',  value: '-0.01em' },
  { id: 'normal', label: 'Normal', value: '0.02em'  },
  { id: 'wide',   label: 'Wide',   value: '0.08em'  },
];

// ── Content fields ───────────────────────────────────────────────
type FieldType = 'text' | 'textarea';
interface ContentField { key: string; label: string; type: FieldType; placeholder: string; }

const CONTENT_FIELDS: Record<string, ContentField[]> = {
  home: [
    { key: 'heroTitle',        label: 'Hero Headline',             type: 'text',     placeholder: 'Welcome to Makay Beach Club' },
    { key: 'heroSubtitle',     label: 'Hero Subtitle',             type: 'textarea', placeholder: 'Your luxury beach destination...' },
    { key: 'ctaText',          label: 'CTA Button',                type: 'text',     placeholder: 'Shop the Collection' },
    { key: 'featuredTitle',    label: 'Featured Section Title',    type: 'text',     placeholder: 'Featured Collection' },
    { key: 'featuredSubtitle', label: 'Featured Section Subtitle', type: 'text',     placeholder: 'Handpicked for the season' },
  ],
  products: [
    { key: 'pageTitle',    label: 'Page Heading',       type: 'text', placeholder: 'Our Collection'          },
    { key: 'pageSubtitle', label: 'Page Subheading',    type: 'text', placeholder: 'Discover our full range' },
    { key: 'emptyState',   label: 'No Results Message', type: 'text', placeholder: 'No products match your filters.' },
  ],
  'product-detail': [
    { key: 'addToCart',    label: 'Add to Cart Button',     type: 'text', placeholder: 'Add to Cart'       },
    { key: 'reviewsTitle', label: 'Reviews Section Title',  type: 'text', placeholder: 'Customer Reviews'  },
    { key: 'relatedTitle', label: 'Related Products Title', type: 'text', placeholder: 'You May Also Like' },
  ],
  checkout: [
    { key: 'pageTitle',     label: 'Checkout Title',         type: 'text', placeholder: 'Checkout'        },
    { key: 'shippingTitle', label: 'Shipping Section Title', type: 'text', placeholder: 'Shipping Info'   },
    { key: 'paymentTitle',  label: 'Payment Section Title',  type: 'text', placeholder: 'Payment Details' },
    { key: 'summaryTitle',  label: 'Order Summary Title',    type: 'text', placeholder: 'Order Summary'   },
    { key: 'placeOrderBtn', label: 'Place Order Button',     type: 'text', placeholder: 'Place Order'     },
  ],
};

// ── State ────────────────────────────────────────────────────────
interface Typography { headingFont: string; headingScale: string; bodySize: string; letterSpacing: string; }
interface PageState  { colors: Record<string, string>; typography: Typography; content: Record<string, string>; }

const DEFAULT_COLORS     = Object.fromEntries(COLOR_CONTROLS.map(c => [c.key, c.default]));
const DEFAULT_TYPOGRAPHY: Typography = { headingFont: 'playfair', headingScale: 'md', bodySize: 'md', letterSpacing: 'normal' };

function makeDefault(): PageState {
  return { colors: { ...DEFAULT_COLORS }, typography: { ...DEFAULT_TYPOGRAPHY }, content: {} };
}

// ── CSS var string builder (injected into iframe) ────────────────
function buildVarString(state: PageState): string {
  const parts: string[] = [];

  COLOR_CONTROLS.forEach(ctrl => {
    const val = state.colors[ctrl.key] ?? ctrl.default;
    parts.push(`${ctrl.cssVar}:${val}`);
    if (ctrl.extra) parts.push(`${ctrl.extra}:${val}`);
  });

  const fontVal = FONT_OPTIONS.find(f => f.id === state.typography.headingFont)?.value;
  if (fontVal) parts.push(`--mkt-heading-font:${fontVal}`);

  const scaleVal = SCALE_OPTIONS.find(s => s.id === state.typography.headingScale)?.value;
  if (scaleVal) parts.push(`--mkt-heading-scale:${scaleVal}`);

  const bodySize = BODY_SIZE_OPTIONS.find(s => s.id === state.typography.bodySize)?.value;
  if (bodySize) parts.push(`--mkt-body-size:${bodySize}`);

  const tracking = LETTER_SPACING_OPTIONS.find(s => s.id === state.typography.letterSpacing)?.value;
  if (tracking) parts.push(`--mkt-letter-spacing:${tracking}`);

  return parts.join(';');
}

// ── Main component ───────────────────────────────────────────────
export default function MarketingEditor() {
  const [activePage, setActivePage] = useState('home');
  const [activeTab, setActiveTab]   = useState<'colors' | 'typography' | 'content'>('colors');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [loading, setLoading]       = useState(true);
  const [iframeReady, setIframeReady] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [pageStates, setPageStates] = useState<Record<string, PageState>>(() =>
    Object.fromEntries(PAGES.map(p => [p.id, makeDefault()]))
  );

  const tutorialStore = useTutorialStore();
  const tutorialUI    = useTutorialOverlay('editor-tour');

  const current    = pageStates[activePage] ?? makeDefault();
  const activeDef  = PAGES.find(p => p.id === activePage)!;

  // ── Inject CSS vars into iframe ──────────────────────────────
  const injectStyles = useCallback((state: PageState) => {
    const iframe = iframeRef.current;
    try {
      const doc = iframe?.contentDocument;
      if (!doc?.head) return;
      let style = doc.getElementById('mkt-live-vars') as HTMLStyleElement | null;
      if (!style) {
        style = doc.createElement('style');
        style.id = 'mkt-live-vars';
        doc.head.appendChild(style);
      }
      style.textContent = `:root{${buildVarString(state)}}`;
    } catch {
      // Cross-origin guard — should not happen on same domain
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeReady(true);
    injectStyles(current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectStyles, activePage]);

  // Re-inject whenever settings change and iframe is ready
  useEffect(() => {
    if (iframeReady) injectStyles(current);
  }, [current, iframeReady, injectStyles]);

  // Reset ready state when page changes (iframe remounts due to key)
  useEffect(() => {
    setIframeReady(false);
  }, [activePage]);

  // ── Load saved settings from Neon ───────────────────────────
  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setPageStates(prev => {
          const next = { ...prev };
          PAGES.forEach(({ id: pageId }) => {
            const colors     = { ...DEFAULT_COLORS };
            const typography = { ...DEFAULT_TYPOGRAPHY };
            const content: Record<string, string> = {};

            Object.entries(data).forEach(([k, v]) => {
              const cm = k.match(new RegExp(`^page:${pageId}:colors:(.+)$`));
              if (cm) { colors[cm[1]] = v; return; }
              const tm = k.match(new RegExp(`^page:${pageId}:typography:(.+)$`));
              if (tm) { (typography as Record<string, string>)[tm[1]] = v; return; }
              const nm = k.match(new RegExp(`^page:${pageId}:content:(.+)$`));
              if (nm) { content[nm[1]] = v; }
            });

            next[pageId] = { colors, typography, content };
          });
          return next;
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Auto-show tutorial once
  useEffect(() => {
    if (!tutorialStore.isCompleted('editor-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('editor-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Setters ──────────────────────────────────────────────────
  const updateColors = (key: string, value: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], colors: { ...s[activePage].colors, [key]: value } } }));

  const updateTypography = (key: string, value: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], typography: { ...s[activePage].typography, [key]: value } } }));

  const updateContent = (key: string, value: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], content: { ...s[activePage].content, [key]: value } } }));

  // ── Publish to Neon ──────────────────────────────────────────
  const publish = async () => {
    setSaving(true);
    try {
      const existingRes = await fetch('/api/theme');
      const existing: Record<string, string> = await existingRes.json();
      const merged = Object.fromEntries(Object.entries(existing).filter(([k]) => !k.startsWith('page:')));

      PAGES.forEach(({ id: pageId }) => {
        const state = pageStates[pageId];
        COLOR_CONTROLS.forEach(c => {
          merged[`page:${pageId}:colors:${c.key}`] = state.colors[c.key] ?? c.default;
        });
        merged[`page:${pageId}:typography:headingFont`]   = state.typography.headingFont;
        merged[`page:${pageId}:typography:headingScale`]  = state.typography.headingScale;
        merged[`page:${pageId}:typography:bodySize`]      = state.typography.bodySize;
        merged[`page:${pageId}:typography:letterSpacing`] = state.typography.letterSpacing;
        Object.entries(state.content).forEach(([ck, cv]) => {
          if (cv) merged[`page:${pageId}:content:${ck}`] = cv;
        });
      });

      await fetch('/api/admin/theme', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="mkt-editor">
      {tutorialUI}

      {/* Top bar */}
      <div className="mkt-topbar">
        <div className="mkt-topbar-left">
          <h1 className="mkt-title">Marketing Editor</h1>
          <p className="mkt-subtitle">Customize colors, typography, and content for each store page</p>
        </div>
        <div className="mkt-topbar-right">
          <a
            href={activeDef.src}
            target="_blank"
            rel="noreferrer"
            className="mkt-open-btn"
            title="Open page in new tab"
          >
            <ExternalLink size={14} /> Open page
          </a>
          <button
            className="mkt-help-btn help-button"
            onClick={() => tutorialStore.showTutorial('editor-tour')}
            aria-label="Show tutorial"
          >
            <HelpCircle size={16} />
          </button>
          <button
            className={`mkt-publish-btn${saved ? ' saved' : ''}`}
            onClick={publish}
            disabled={saving || loading}
          >
            {saved ? <><Check size={16} /> Published</> : saving ? 'Publishing...' : 'Publish Changes'}
          </button>
        </div>
      </div>

      <div className="mkt-body">
        {/* ── Left panel ───────────────────────────────────── */}
        <aside className="mkt-panel">

          {/* Page selector */}
          <div className="mkt-section">
            <div className="mkt-section-label">Page</div>
            <div className="mkt-page-list">
              {PAGES.map(p => {
                const Icon = p.icon;
                return (
                  <button
                    key={p.id}
                    className={`mkt-page-btn${activePage === p.id ? ' active' : ''}`}
                    onClick={() => setActivePage(p.id)}
                  >
                    <Icon size={15} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mkt-page-desc">{activeDef.desc}</p>
          </div>

          {/* Tabs */}
          <div className="mkt-tabs">
            {(['colors', 'typography', 'content'] as const).map(tab => (
              <button
                key={tab}
                className={`mkt-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'colors'     && <Palette size={13} />}
                {tab === 'typography' && <Type size={13} />}
                {tab === 'content'    && <FileText size={13} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Colors */}
          {activeTab === 'colors' && (
            <div className="mkt-controls">
              {COLOR_CONTROLS.map(ctrl => (
                <div key={ctrl.key} className="mkt-color-row">
                  <label className="mkt-color-label">{ctrl.label}</label>
                  <div className="mkt-color-input-wrap">
                    <input
                      type="color"
                      className="mkt-color-swatch"
                      value={current.colors[ctrl.key] ?? ctrl.default}
                      onChange={e => updateColors(ctrl.key, e.target.value)}
                    />
                    <input
                      type="text"
                      className="mkt-color-hex"
                      value={current.colors[ctrl.key] ?? ctrl.default}
                      onChange={e => {
                        if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) updateColors(ctrl.key, e.target.value);
                      }}
                    />
                  </div>
                </div>
              ))}
              <button
                className="mkt-reset-btn"
                onClick={() => setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], colors: { ...DEFAULT_COLORS } } }))}
              >
                Reset to defaults
              </button>
            </div>
          )}

          {/* Typography */}
          {activeTab === 'typography' && (
            <div className="mkt-controls">
              <div className="mkt-control-group">
                <label className="mkt-control-label">Heading Font</label>
                <div className="mkt-font-list">
                  {FONT_OPTIONS.map(f => (
                    <button
                      key={f.id}
                      className={`mkt-font-btn${current.typography.headingFont === f.id ? ' active' : ''}`}
                      onClick={() => updateTypography('headingFont', f.id)}
                    >
                      <span className="mkt-font-sample" style={{ fontFamily: f.value }}>{f.sample}</span>
                      <span className="mkt-font-name">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mkt-control-group">
                <label className="mkt-control-label">Heading Scale</label>
                <div className="mkt-scale-row">
                  {SCALE_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      className={`mkt-scale-btn${current.typography.headingScale === s.id ? ' active' : ''}`}
                      onClick={() => updateTypography('headingScale', s.id)}
                    >{s.label}</button>
                  ))}
                </div>
              </div>

              <div className="mkt-control-group">
                <label className="mkt-control-label">Body Text Size</label>
                <div className="mkt-scale-row">
                  {BODY_SIZE_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      className={`mkt-scale-btn${current.typography.bodySize === s.id ? ' active' : ''}`}
                      onClick={() => updateTypography('bodySize', s.id)}
                    >{s.label}</button>
                  ))}
                </div>
              </div>

              <div className="mkt-control-group">
                <label className="mkt-control-label">Letter Spacing</label>
                <div className="mkt-scale-row">
                  {LETTER_SPACING_OPTIONS.map(s => (
                    <button
                      key={s.id}
                      className={`mkt-scale-btn${current.typography.letterSpacing === s.id ? ' active' : ''}`}
                      onClick={() => updateTypography('letterSpacing', s.id)}
                    >{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {activeTab === 'content' && (
            <div className="mkt-controls">
              <p className="mkt-content-note">
                Text overrides are saved to the database. Components will read them once wired to the content API.
              </p>
              {CONTENT_FIELDS[activePage]?.map(field => (
                <div key={field.key} className="mkt-control-group">
                  <label className="mkt-control-label">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className="mkt-input"
                      rows={3}
                      placeholder={field.placeholder}
                      value={current.content[field.key] ?? ''}
                      onChange={e => updateContent(field.key, e.target.value)}
                    />
                  ) : (
                    <input
                      type="text"
                      className="mkt-input"
                      placeholder={field.placeholder}
                      value={current.content[field.key] ?? ''}
                      onChange={e => updateContent(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── Right: real page iframe ───────────────────────── */}
        <div className="mkt-preview-pane">
          <div className="mkt-preview-label">
            <span>Live Preview — {activeDef.label}</span>
            <span className="mkt-preview-url">{activeDef.src}</span>
          </div>
          <div className="mkt-iframe-wrap">
            {loading && <div className="mkt-iframe-loading">Loading settings...</div>}
            <iframe
              key={activePage}
              ref={iframeRef}
              src={activeDef.src}
              className="mkt-iframe"
              onLoad={handleIframeLoad}
              title={`Preview: ${activeDef.label}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
