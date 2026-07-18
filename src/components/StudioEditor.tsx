'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Check, RotateCcw, HelpCircle, Palette, Layers, ImageIcon, CreditCard,
  Globe, ShoppingBag, Package, FileText, Type, ChevronDown, ChevronRight,
  Loader, ExternalLink, Wand2,
} from 'lucide-react';
import { mockProducts, type Product } from '@/lib/mockData';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import CardDesigner, { CardLayout, CardColors, DEFAULT_CARD_LAYOUT, DEFAULT_CARD_COLORS } from '@/components/CardDesigner';

// ── Brand presets ──────────────────────────────────────────────────────────
const PRESETS: Record<string, Record<string, string>> = {
  'makay-default':  { '--makay-peachy-rose': '#D4A574', '--makay-soft-coral': '#E8B4A6', '--makay-sand-cream': '#F5EFE5', '--makay-premium-cream': '#FFF8F0', '--makay-ocean-teal': '#4A9FB5', '--makay-warm-gold': '#D4AF37', '--makay-dark-navy': '#2C2C2C', '--makay-mauve': '#A89080' },
  'dark-luxury':    { '--makay-peachy-rose': '#C9A96E', '--makay-soft-coral': '#B8956A', '--makay-sand-cream': '#1E1A14', '--makay-premium-cream': '#141210', '--makay-ocean-teal': '#6B9FAF', '--makay-warm-gold': '#D4AF37', '--makay-dark-navy': '#F5F0E8', '--makay-mauve': '#9E8E7E' },
  'ocean-breeze':   { '--makay-peachy-rose': '#4A9FB5', '--makay-soft-coral': '#6BB5C8', '--makay-sand-cream': '#EAF5F8', '--makay-premium-cream': '#F0FAFC', '--makay-ocean-teal': '#2A7B8C', '--makay-warm-gold': '#7BB8C6', '--makay-dark-navy': '#1A3A4A', '--makay-mauve': '#6A8A96' },
  'sunset-coral':   { '--makay-peachy-rose': '#E8856A', '--makay-soft-coral': '#F0A090', '--makay-sand-cream': '#FDF0EC', '--makay-premium-cream': '#FEF8F6', '--makay-ocean-teal': '#D4826A', '--makay-warm-gold': '#E8A080', '--makay-dark-navy': '#2A1A16', '--makay-mauve': '#B07868' },
  'minimal-white':  { '--makay-peachy-rose': '#1A1A1A', '--makay-soft-coral': '#555555', '--makay-sand-cream': '#F2F2F2', '--makay-premium-cream': '#FFFFFF', '--makay-ocean-teal': '#333333', '--makay-warm-gold': '#888888', '--makay-dark-navy': '#0A0A0A', '--makay-mauve': '#777777' },
};
const PRESET_LABELS: Record<string, string> = { 'makay-default': 'Makay Default', 'dark-luxury': 'Dark Luxury', 'ocean-breeze': 'Ocean Breeze', 'sunset-coral': 'Sunset Coral', 'minimal-white': 'Minimal White' };
const COLOR_LABELS: Record<string, string> = {
  '--makay-peachy-rose': 'Primary — buttons & headings',
  '--makay-soft-coral':  'Secondary accent',
  '--makay-sand-cream':  'Card & section background',
  '--makay-premium-cream': 'Page background',
  '--makay-ocean-teal':  'Teal accent',
  '--makay-warm-gold':   'Gold highlight',
  '--makay-dark-navy':   'Body text & dark elements',
  '--makay-mauve':       'Secondary / muted text',
};
const DEFAULT_SCROLL_COLORS = ['#FFF8F0','#F5EFE5','#FFFFFF','#FFF8F0','#F5EFE5','#FFF8F0','#F5EFE5'];
const SECTION_NAMES = ['Hero','Featured Collection','Why Makay','Testimonials','How It Works','Categories','Newsletter'];

// ── Pages ──────────────────────────────────────────────────────────────────
const PAGES = [
  { id: 'home',           label: 'Home',           icon: Globe,       src: '/'            },
  { id: 'products',       label: 'Products',        icon: ShoppingBag, src: '/products'    },
  { id: 'product-detail', label: 'Product Detail',  icon: Package,     src: '/products/1'  },
  { id: 'checkout',       label: 'Checkout',        icon: CreditCard,  src: '/cart'        },
];
const FONT_OPTIONS = [
  { id: 'playfair',   label: 'Playfair Display', value: "'Playfair Display', Georgia, serif",   sample: 'Aa' },
  { id: 'montserrat', label: 'Montserrat',        value: "'Montserrat', sans-serif",             sample: 'Aa' },
  { id: 'georgia',    label: 'Georgia',           value: 'Georgia, serif',                       sample: 'Aa' },
  { id: 'system',     label: 'System UI',         value: 'system-ui, sans-serif',               sample: 'Aa' },
];
const SCALE_OPTIONS = [{ id:'xs',label:'XS',value:'0.82'},{id:'sm',label:'SM',value:'0.92'},{id:'md',label:'MD',value:'1.0'},{id:'lg',label:'LG',value:'1.12'},{id:'xl',label:'XL',value:'1.28'}];
const BODY_SIZE_OPTIONS = [{ id:'sm',label:'Small',value:'0.9rem'},{id:'md',label:'Medium',value:'1rem'},{id:'lg',label:'Large',value:'1.1rem'}];
const LETTER_SPACING_OPTIONS = [{ id:'tight',label:'Tight',value:'-0.01em'},{id:'normal',label:'Normal',value:'0.02em'},{id:'wide',label:'Wide',value:'0.08em'}];
const PAGE_COLOR_CONTROLS = [
  { key: 'bg',       label: 'Page Background',    cssVar: '--makay-premium-cream', default: '#FFF8F0' },
  { key: 'sectionBg',label: 'Section Background', cssVar: '--makay-sand-cream',    default: '#F5EFE5' },
  { key: 'primary',  label: 'Primary / Buttons',  cssVar: '--makay-peachy-rose',   default: '#D4A574' },
  { key: 'text',     label: 'Body Text',          cssVar: '--makay-dark-navy',     default: '#2C2C2C' },
  { key: 'muted',    label: 'Muted / Labels',     cssVar: '--makay-mauve',         default: '#A89080' },
];
const CONTENT_FIELDS: Record<string, {key:string;label:string;type:'text'|'textarea';placeholder:string}[]> = {
  home: [
    { key:'heroTitle',       label:'Hero Headline',           type:'text',     placeholder:'Your Connection Refuge'    },
    { key:'heroSubtitle',    label:'Hero Subtitle',           type:'textarea', placeholder:'Discover clothing...'      },
    { key:'ctaText',         label:'CTA Button',              type:'text',     placeholder:'Explore Collection'        },
    { key:'featuredTitle',   label:'Featured Section Title',  type:'text',     placeholder:'Featured Collection'       },
    { key:'featuredSubtitle',label:'Featured Subtitle',       type:'text',     placeholder:'Handpicked for the season' },
  ],
  products: [
    { key:'pageTitle',   label:'Page Heading',      type:'text', placeholder:'Our Collection'          },
    { key:'pageSubtitle',label:'Page Subheading',   type:'text', placeholder:'Discover our full range' },
    { key:'emptyState',  label:'No Results Message',type:'text', placeholder:'No products found.'      },
  ],
  'product-detail': [
    { key:'addToCart',   label:'Add to Cart Button',    type:'text', placeholder:'Add to Cart'       },
    { key:'reviewsTitle',label:'Reviews Section Title', type:'text', placeholder:'Customer Reviews'  },
    { key:'relatedTitle',label:'Related Products Title',type:'text', placeholder:'You May Also Like' },
  ],
  checkout: [
    { key:'pageTitle',    label:'Checkout Title',          type:'text', placeholder:'Checkout'       },
    { key:'shippingTitle',label:'Shipping Section Title',  type:'text', placeholder:'Shipping Info'  },
    { key:'summaryTitle', label:'Order Summary Title',     type:'text', placeholder:'Order Summary'  },
    { key:'placeOrderBtn',label:'Place Order Button',      type:'text', placeholder:'Place Order'    },
  ],
};
interface PageState { colors: Record<string,string>; typography: Record<string,string>; content: Record<string,string>; }
function makeDefaultPage(): PageState {
  return { colors: Object.fromEntries(PAGE_COLOR_CONTROLS.map(c=>[c.key,c.default])), typography: { headingFont:'playfair', headingScale:'md', bodySize:'md', letterSpacing:'normal' }, content: {} };
}

type StudioSection = 'brand' | 'scroll' | 'pages' | 'images' | 'card';
type SaveState = 'idle' | 'saving' | 'saved';

export default function StudioEditor() {
  const [section, setSection] = useState<StudioSection>('brand');
  const [activePreset, setActivePreset] = useState('makay-default');
  const [colors, setColors] = useState<Record<string,string>>(
    Object.keys(COLOR_LABELS).reduce((a,k) => ({ ...a, [k]: PRESETS['makay-default'][k] }), {})
  );
  const [scrollColors, setScrollColors] = useState<string[]>(DEFAULT_SCROLL_COLORS);
  const [pageStates, setPageStates] = useState<Record<string,PageState>>(
    Object.fromEntries(PAGES.map(p=>[p.id, makeDefaultPage()]))
  );
  const [imgOverrides, setImgOverrides] = useState<Record<string,string>>({});
  const [cardLayout, setCardLayout] = useState<CardLayout>(DEFAULT_CARD_LAYOUT);
  const [cardColors, setCardColors] = useState<CardColors>(DEFAULT_CARD_COLORS);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [activePage, setActivePage] = useState('home');
  const [pageSubTab, setPageSubTab] = useState<'colors'|'typography'|'content'>('colors');
  const [brandSubSection, setBrandSubSection] = useState<'presets'|'colors'>('presets');
  const [iframeReady, setIframeReady] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('/');
  const [saves, setSaves] = useState<Record<string, SaveState>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('theme-editor-tour');

  // ── Load settings ───────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/theme').then(r=>r.json()).then((data: Record<string,string>) => {
      // Brand colors
      const loaded: Record<string,string> = {};
      Object.keys(COLOR_LABELS).forEach(k => { if (data[k]) loaded[k] = data[k]; });
      if (Object.keys(loaded).length) setColors(c => ({ ...c, ...loaded }));
      // Scroll colors
      if (data['--scroll-colors']) {
        try { setScrollColors(JSON.parse(data['--scroll-colors'])); } catch {}
      }
      // Card
      if (data['card_layout']) { try { setCardLayout(JSON.parse(data['card_layout'])); } catch {} }
      if (data['card_colors']) { try { setCardColors(JSON.parse(data['card_colors'])); } catch {} }
      // Pages
      setPageStates(prev => {
        const next = { ...prev };
        PAGES.forEach(({ id: pid }) => {
          const ps = makeDefaultPage();
          Object.entries(data).forEach(([k, v]) => {
            const cm = k.match(new RegExp(`^page:${pid}:colors:(.+)$`));   if (cm) { ps.colors[cm[1]] = v; return; }
            const tm = k.match(new RegExp(`^page:${pid}:typography:(.+)$`));if (tm) { ps.typography[tm[1]] = v; return; }
            const nm = k.match(new RegExp(`^page:${pid}:content:(.+)$`));  if (nm) { ps.content[nm[1]] = v; }
          });
          next[pid] = ps;
        });
        return next;
      });
    }).catch(() => {});
    fetch('/api/products').then(r=>r.json()).then((d: unknown) => { if (Array.isArray(d)) setProducts(d as Product[]); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tutorialStore.isCompleted('theme-editor-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('theme-editor-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Iframe injection ────────────────────────────────────────────────
  const injectStyles = useCallback((ps: PageState) => {
    const iframe = iframeRef.current;
    try {
      const doc = iframe?.contentDocument;
      if (!doc?.head) return;
      let style = doc.getElementById('studio-vars') as HTMLStyleElement | null;
      if (!style) { style = doc.createElement('style'); style.id = 'studio-vars'; doc.head.appendChild(style); }
      const parts: string[] = [];
      PAGE_COLOR_CONTROLS.forEach(ctrl => { parts.push(`${ctrl.cssVar}:${ps.colors[ctrl.key] ?? ctrl.default}`); });
      const fontVal = FONT_OPTIONS.find(f=>f.id===ps.typography.headingFont)?.value;
      if (fontVal) parts.push(`--mkt-heading-font:${fontVal}`);
      const scaleVal = SCALE_OPTIONS.find(s=>s.id===ps.typography.headingScale)?.value;
      if (scaleVal) parts.push(`--mkt-heading-scale:${scaleVal}`);
      style.textContent = `:root{${parts.join(';')}}`;
    } catch {}
  }, []);

  useEffect(() => {
    const pageSrc = PAGES.find(p=>p.id===activePage)?.src ?? '/';
    setPreviewSrc(pageSrc);
    setIframeReady(false);
  }, [activePage, section]);

  useEffect(() => {
    if (iframeReady) injectStyles(pageStates[activePage] ?? makeDefaultPage());
  }, [pageStates, activePage, iframeReady, injectStyles]);

  // ── Save helpers ────────────────────────────────────────────────────
  const setSaveState = (key: string, state: SaveState) => {
    setSaves(s => ({ ...s, [key]: state }));
    if (state === 'saved') setTimeout(() => setSaves(s => ({ ...s, [key]: 'idle' })), 2500);
  };

  const getExistingSettings = async (): Promise<Record<string,string>> => {
    const r = await fetch('/api/theme');
    return r.ok ? r.json() : {};
  };

  const patchSettings = async (patch: Record<string,string>) => {
    const existing = await getExistingSettings();
    await fetch('/api/admin/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, ...patch }),
    });
  };

  const saveBrand = async () => {
    setSaveState('brand', 'saving');
    await patchSettings(colors);
    setSaveState('brand', 'saved');
  };

  const saveScroll = async () => {
    setSaveState('scroll', 'saving');
    await patchSettings({ '--scroll-colors': JSON.stringify(scrollColors) });
    setSaveState('scroll', 'saved');
  };

  const saveCard = async () => {
    setSaveState('card', 'saving');
    await patchSettings({ card_layout: JSON.stringify(cardLayout), card_colors: JSON.stringify(cardColors) });
    setSaveState('card', 'saved');
  };

  const saveCurrentPage = async () => {
    const key = `page-${activePage}`;
    setSaveState(key, 'saving');
    const ps = pageStates[activePage] ?? makeDefaultPage();
    const patch: Record<string,string> = {};
    PAGE_COLOR_CONTROLS.forEach(c => { patch[`page:${activePage}:colors:${c.key}`] = ps.colors[c.key] ?? c.default; });
    patch[`page:${activePage}:typography:headingFont`]   = ps.typography.headingFont;
    patch[`page:${activePage}:typography:headingScale`]  = ps.typography.headingScale;
    patch[`page:${activePage}:typography:bodySize`]      = ps.typography.bodySize;
    patch[`page:${activePage}:typography:letterSpacing`] = ps.typography.letterSpacing;
    Object.entries(ps.content).forEach(([k,v]) => { if (v) patch[`page:${activePage}:content:${k}`] = v; });
    await patchSettings(patch);
    setSaveState(key, 'saved');
  };

  const publishAll = async () => {
    setSaveState('all', 'saving');
    const patch: Record<string,string> = {
      ...colors,
      '--scroll-colors': JSON.stringify(scrollColors),
      'card_layout': JSON.stringify(cardLayout),
      'card_colors': JSON.stringify(cardColors),
    };
    PAGES.forEach(({ id: pid }) => {
      const ps = pageStates[pid] ?? makeDefaultPage();
      PAGE_COLOR_CONTROLS.forEach(c => { patch[`page:${pid}:colors:${c.key}`] = ps.colors[c.key] ?? c.default; });
      patch[`page:${pid}:typography:headingFont`]   = ps.typography.headingFont;
      patch[`page:${pid}:typography:headingScale`]  = ps.typography.headingScale;
      patch[`page:${pid}:typography:bodySize`]      = ps.typography.bodySize;
      patch[`page:${pid}:typography:letterSpacing`] = ps.typography.letterSpacing;
      Object.entries(ps.content).forEach(([k,v]) => { if (v) patch[`page:${pid}:content:${k}`] = v; });
    });
    const existing = await getExistingSettings();
    await fetch('/api/admin/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...existing, ...patch }),
    });
    setSaveState('all', 'saved');
  };

  const SaveBtn = ({ id, onClick }: { id: string; onClick: () => void }) => {
    const state = saves[id] ?? 'idle';
    return (
      <button className="studio-save-btn" onClick={onClick} disabled={state === 'saving'}>
        {state === 'saving' && <Loader size={13} className="studio-spin" />}
        {state === 'saved'  && <Check size={13} />}
        {state === 'saved' ? 'Saved' : state === 'saving' ? 'Saving…' : 'Save'}
      </button>
    );
  };

  const current = pageStates[activePage] ?? makeDefaultPage();
  const updatePageColor = (k: string, v: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], colors: { ...s[activePage].colors, [k]: v } } }));
  const updatePageTypography = (k: string, v: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], typography: { ...s[activePage].typography, [k]: v } } }));
  const updatePageContent = (k: string, v: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], content: { ...s[activePage].content, [k]: v } } }));

  const SECTIONS: { id: StudioSection; icon: React.FC<{ size?: number; className?: string }>; label: string }[] = [
    { id: 'brand',  icon: Palette,    label: 'Brand'    },
    { id: 'scroll', icon: Layers,     label: 'Scroll'   },
    { id: 'pages',  icon: Globe,      label: 'Pages'    },
    { id: 'images', icon: ImageIcon,  label: 'Images'   },
    { id: 'card',   icon: CreditCard, label: 'Card'     },
  ];

  const allSaveState = saves['all'] ?? 'idle';

  return (
    <div className="studio-root">
      {tutorialUI}

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <div className="studio-topbar">
        <div className="studio-topbar-left">
          <Wand2 size={18} className="studio-topbar-icon" />
          <div>
            <h1 className="studio-title">Storefront Studio</h1>
            <p className="studio-subtitle">Brand, pages, content — one editor</p>
          </div>
        </div>
        <nav className="studio-section-tabs">
          {SECTIONS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`studio-section-tab${section === id ? ' active' : ''}`}
              onClick={() => setSection(id)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
        <div className="studio-topbar-right">
          <button className="studio-btn-ghost" onClick={() => tutorialStore.showTutorial('theme-editor-tour')}>
            <HelpCircle size={15} />
          </button>
          <a href={PAGES.find(p=>p.id===activePage)?.src ?? '/'} target="_blank" rel="noreferrer" className="studio-btn-ghost">
            <ExternalLink size={14} /> Preview
          </a>
          <button
            className={`studio-publish-btn${allSaveState === 'saved' ? ' saved' : ''}`}
            onClick={publishAll}
            disabled={allSaveState === 'saving'}
          >
            {allSaveState === 'saving' && <Loader size={14} className="studio-spin" />}
            {allSaveState === 'saved'  && <Check size={14} />}
            {allSaveState === 'saved' ? 'Published' : allSaveState === 'saving' ? 'Publishing…' : 'Publish All'}
          </button>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="studio-body">

        {/* ── Left: controls ─────────────────────────────────────── */}
        <div className="studio-controls">

          {/* BRAND */}
          {section === 'brand' && (
            <div className="studio-panel">
              <div className="studio-panel-header">
                <span>Brand & Palette</span>
                <SaveBtn id="brand" onClick={saveBrand} />
              </div>

              {/* Sub-tabs */}
              <div className="studio-subtabs">
                <button className={`studio-subtab${brandSubSection==='presets'?' active':''}`} onClick={() => setBrandSubSection('presets')}>Presets</button>
                <button className={`studio-subtab${brandSubSection==='colors'?' active':''}`}  onClick={() => setBrandSubSection('colors')}>Custom</button>
              </div>

              {brandSubSection === 'presets' && (
                <div className="studio-preset-grid">
                  {Object.entries(PRESET_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      className={`studio-preset-btn${activePreset===key?' active':''}`}
                      onClick={() => {
                        setColors(PRESETS[key]);
                        setActivePreset(key);
                        Object.entries(PRESETS[key]).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
                      }}
                    >
                      <div className="studio-preset-swatches">
                        <span style={{ background: PRESETS[key]['--makay-peachy-rose'] }} />
                        <span style={{ background: PRESETS[key]['--makay-premium-cream'] }} />
                        <span style={{ background: PRESETS[key]['--makay-dark-navy'] }} />
                      </div>
                      <span className="studio-preset-label">{label}</span>
                      {activePreset===key && <Check size={11} className="studio-preset-check" />}
                    </button>
                  ))}
                </div>
              )}

              {brandSubSection === 'colors' && (
                <div className="studio-color-list">
                  {Object.entries(COLOR_LABELS).map(([key, label]) => (
                    <div key={key} className="studio-color-row">
                      <label className="studio-color-label">{label}</label>
                      <div className="studio-color-inputs">
                        <input type="color" value={colors[key]??'#000000'} onChange={e => {
                          const v = e.target.value;
                          setColors(c => ({ ...c, [key]: v }));
                          document.documentElement.style.setProperty(key, v);
                        }} className="studio-color-picker" />
                        <input type="text" value={colors[key]??''} onChange={e => {
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                            setColors(c => ({ ...c, [key]: e.target.value }));
                            if (e.target.value.length === 7) document.documentElement.style.setProperty(key, e.target.value);
                          }
                        }} className="studio-color-hex" />
                      </div>
                    </div>
                  ))}
                  <button className="studio-reset-btn" onClick={() => {
                    setColors(PRESETS['makay-default']);
                    setActivePreset('makay-default');
                    Object.entries(PRESETS['makay-default']).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
                  }}>
                    <RotateCcw size={12} /> Reset to Makay Default
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCROLL */}
          {section === 'scroll' && (
            <div className="studio-panel">
              <div className="studio-panel-header">
                <span>Scroll Section Colors</span>
                <SaveBtn id="scroll" onClick={saveScroll} />
              </div>
              <p className="studio-hint">Each section gets its own background color as the visitor scrolls down the homepage.</p>
              <div className="studio-color-list">
                {SECTION_NAMES.map((name, idx) => (
                  <div key={idx} className="studio-color-row">
                    <label className="studio-color-label">{name}</label>
                    <div className="studio-color-inputs">
                      <input type="color" value={scrollColors[idx]??'#ffffff'} onChange={e => {
                        const next = [...scrollColors]; next[idx] = e.target.value; setScrollColors(next);
                        document.documentElement.style.setProperty(`--scroll-section-${idx}`, e.target.value);
                      }} className="studio-color-picker" />
                      <input type="text" value={scrollColors[idx]??''} onChange={e => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                          const next = [...scrollColors]; next[idx] = e.target.value; setScrollColors(next);
                        }
                      }} className="studio-color-hex" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGES */}
          {section === 'pages' && (
            <div className="studio-panel">
              <div className="studio-panel-header">
                <span>Page Overrides — {PAGES.find(p=>p.id===activePage)?.label}</span>
                <SaveBtn id={`page-${activePage}`} onClick={saveCurrentPage} />
              </div>

              {/* Page selector */}
              <div className="studio-page-tabs">
                {PAGES.map(p => {
                  const Icon = p.icon;
                  return (
                    <button key={p.id} className={`studio-page-tab${activePage===p.id?' active':''}`} onClick={() => { setActivePage(p.id); setPreviewSrc(p.src); }}>
                      <Icon size={12} /> {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Sub-tabs */}
              <div className="studio-subtabs">
                {(['colors','typography','content'] as const).map(t => (
                  <button key={t} className={`studio-subtab${pageSubTab===t?' active':''}`} onClick={() => setPageSubTab(t)}>
                    {t === 'colors' && <Palette size={11} />}
                    {t === 'typography' && <Type size={11} />}
                    {t === 'content' && <FileText size={11} />}
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>

              {/* Colors */}
              {pageSubTab === 'colors' && (
                <div className="studio-color-list">
                  {PAGE_COLOR_CONTROLS.map(ctrl => (
                    <div key={ctrl.key} className="studio-color-row">
                      <label className="studio-color-label">{ctrl.label}</label>
                      <div className="studio-color-inputs">
                        <input type="color" value={current.colors[ctrl.key]??ctrl.default} onChange={e => updatePageColor(ctrl.key, e.target.value)} className="studio-color-picker" />
                        <input type="text" value={current.colors[ctrl.key]??ctrl.default} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) updatePageColor(ctrl.key, e.target.value); }} className="studio-color-hex" />
                      </div>
                    </div>
                  ))}
                  <button className="studio-reset-btn" onClick={() =>
                    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], colors: Object.fromEntries(PAGE_COLOR_CONTROLS.map(c=>[c.key,c.default])) } }))
                  }><RotateCcw size={12} /> Reset page colors</button>
                </div>
              )}

              {/* Typography */}
              {pageSubTab === 'typography' && (
                <div className="studio-typography-list">
                  <div className="studio-control-group">
                    <label className="studio-control-label">Heading Font</label>
                    <div className="studio-font-grid">
                      {FONT_OPTIONS.map(f => (
                        <button key={f.id} className={`studio-font-btn${current.typography.headingFont===f.id?' active':''}`} onClick={() => updatePageTypography('headingFont', f.id)}>
                          <span className="studio-font-sample" style={{ fontFamily: f.value }}>{f.sample}</span>
                          <span>{f.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="studio-control-group">
                    <label className="studio-control-label">Heading Scale</label>
                    <div className="studio-scale-row">
                      {SCALE_OPTIONS.map(s => <button key={s.id} className={`studio-scale-btn${current.typography.headingScale===s.id?' active':''}`} onClick={() => updatePageTypography('headingScale', s.id)}>{s.label}</button>)}
                    </div>
                  </div>
                  <div className="studio-control-group">
                    <label className="studio-control-label">Body Text Size</label>
                    <div className="studio-scale-row">
                      {BODY_SIZE_OPTIONS.map(s => <button key={s.id} className={`studio-scale-btn${current.typography.bodySize===s.id?' active':''}`} onClick={() => updatePageTypography('bodySize', s.id)}>{s.label}</button>)}
                    </div>
                  </div>
                  <div className="studio-control-group">
                    <label className="studio-control-label">Letter Spacing</label>
                    <div className="studio-scale-row">
                      {LETTER_SPACING_OPTIONS.map(s => <button key={s.id} className={`studio-scale-btn${current.typography.letterSpacing===s.id?' active':''}`} onClick={() => updatePageTypography('letterSpacing', s.id)}>{s.label}</button>)}
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {pageSubTab === 'content' && (
                <div className="studio-content-list">
                  <p className="studio-hint">Text overrides saved to database. Storefront reads them on next page load.</p>
                  {CONTENT_FIELDS[activePage]?.map(field => (
                    <div key={field.key} className="studio-control-group">
                      <label className="studio-control-label">{field.label}</label>
                      {field.type === 'textarea'
                        ? <textarea className="studio-input" rows={2} placeholder={field.placeholder} value={current.content[field.key]??''} onChange={e => updatePageContent(field.key, e.target.value)} />
                        : <input type="text" className="studio-input" placeholder={field.placeholder} value={current.content[field.key]??''} onChange={e => updatePageContent(field.key, e.target.value)} />
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* IMAGES */}
          {section === 'images' && (
            <div className="studio-panel">
              <div className="studio-panel-header">
                <span>Product Image Overrides</span>
              </div>
              <p className="studio-hint">Override the storefront image for any product. Enter a public URL.</p>
              <div className="studio-img-list">
                {products.map(p => (
                  <ProductImageRow
                    key={p.id}
                    product={p}
                    currentImage={imgOverrides[p.id] ?? p.image}
                    onSave={async (url) => {
                      await fetch('/api/seller/products', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ product_id: p.id, image_url: url }) });
                      setImgOverrides(o => ({ ...o, [p.id]: url }));
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* CARD */}
          {section === 'card' && (
            <div className="studio-panel">
              <div className="studio-panel-header">
                <span>Member Card Design</span>
                <SaveBtn id="card" onClick={saveCard} />
              </div>
              <CardDesigner layout={cardLayout} colors={cardColors} onLayoutChange={setCardLayout} onColorsChange={setCardColors} />
            </div>
          )}
        </div>

        {/* ── Right: live iframe preview ──────────────────────────── */}
        <div className="studio-preview">
          <div className="studio-preview-bar">
            <span className="studio-preview-label">Live Preview</span>
            <span className="studio-preview-url">{previewSrc}</span>
          </div>
          <div className="studio-iframe-wrap">
            <iframe
              key={`${section}-${activePage}`}
              ref={iframeRef}
              src={previewSrc}
              className="studio-iframe"
              onLoad={() => { setIframeReady(true); injectStyles(pageStates[activePage] ?? makeDefaultPage()); }}
              title="Storefront Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Product image row ─────────────────────────────────────────────────────
function ProductImageRow({ product, currentImage, onSave }: {
  product: { id: string; title: string; image: string };
  currentImage: string;
  onSave: (url: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentImage);
  const [saving, setSaving] = useState(false);

  return (
    <div className="studio-img-row">
      <img src={currentImage} alt={product.title} className="studio-img-thumb" onError={e => { (e.target as HTMLImageElement).src = '/images/product-tshirt.jpg'; }} />
      <div className="studio-img-info">
        <span className="studio-img-title">{product.title}</span>
        {editing ? (
          <div className="studio-img-edit">
            <input className="studio-input" value={draft} onChange={e => setDraft(e.target.value)} placeholder="https://... or /images/..." />
            <div style={{ display:'flex', gap:'0.4rem', marginTop:'0.4rem' }}>
              <button className="studio-save-btn" disabled={saving} onClick={async () => { setSaving(true); await onSave(draft); setSaving(false); setEditing(false); }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button className="studio-btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="studio-btn-sm" onClick={() => { setDraft(currentImage); setEditing(true); }}>Change Image</button>
        )}
      </div>
    </div>
  );
}
