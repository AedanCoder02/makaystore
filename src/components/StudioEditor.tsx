'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Check, RotateCcw, HelpCircle, Globe, ShoppingBag, Package, CreditCard,
  Loader, ExternalLink, Wand2, Globe2, Eye, EyeOff, CreditCard as CardIcon,
  PanelLeftClose, PanelLeftOpen, Calendar, Crown,
} from 'lucide-react';
import ImageUpload from '@/components/seller/ImageUpload';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { CardCanvas, type CardLayout, type CardColors, DEFAULT_CARD_LAYOUT, DEFAULT_CARD_COLORS } from '@/components/CardDesigner';

// ── Brand presets ──────────────────────────────────────────────────────────
const PRESETS: Record<string, Record<string, string>> = {
  'makay-default':  { '--makay-peachy-rose': '#D4A574', '--makay-soft-coral': '#E8B4A6', '--makay-sand-cream': '#F5EFE5', '--makay-premium-cream': '#FFF8F0', '--makay-ocean-teal': '#4A9FB5', '--makay-warm-gold': '#D4AF37', '--makay-dark-navy': '#2C2C2C', '--makay-mauve': '#A89080' },
  'dark-luxury':    { '--makay-peachy-rose': '#C9A96E', '--makay-soft-coral': '#B8956A', '--makay-sand-cream': '#1E1A14', '--makay-premium-cream': '#141210', '--makay-ocean-teal': '#6B9FAF', '--makay-warm-gold': '#D4AF37', '--makay-dark-navy': '#F5F0E8', '--makay-mauve': '#9E8E7E' },
  'ocean-breeze':   { '--makay-peachy-rose': '#4A9FB5', '--makay-soft-coral': '#6BB5C8', '--makay-sand-cream': '#EAF5F8', '--makay-premium-cream': '#F0FAFC', '--makay-ocean-teal': '#2A7B8C', '--makay-warm-gold': '#7BB8C6', '--makay-dark-navy': '#1A3A4A', '--makay-mauve': '#6A8A96' },
  'sunset-coral':   { '--makay-peachy-rose': '#E8856A', '--makay-soft-coral': '#F0A090', '--makay-sand-cream': '#FDF0EC', '--makay-premium-cream': '#FEF8F6', '--makay-ocean-teal': '#D4826A', '--makay-warm-gold': '#E8A080', '--makay-dark-navy': '#2A1A16', '--makay-mauve': '#B07868' },
  'minimal-white':  { '--makay-peachy-rose': '#1A1A1A', '--makay-soft-coral': '#555555', '--makay-sand-cream': '#F2F2F2', '--makay-premium-cream': '#FFFFFF', '--makay-ocean-teal': '#333333', '--makay-warm-gold': '#888888', '--makay-dark-navy': '#0A0A0A', '--makay-mauve': '#777777' },
};
const PRESET_LABELS: Record<string, string> = {
  'makay-default': 'Makay Default', 'dark-luxury': 'Dark Luxury',
  'ocean-breeze': 'Ocean Breeze', 'sunset-coral': 'Sunset Coral', 'minimal-white': 'Minimal White',
};
const COLOR_LABELS: Record<string, string> = {
  '--makay-peachy-rose':   'Primary — buttons & headings',
  '--makay-soft-coral':    'Secondary accent',
  '--makay-sand-cream':    'Card & section background',
  '--makay-premium-cream': 'Page background',
  '--makay-ocean-teal':    'Teal accent',
  '--makay-warm-gold':     'Gold highlight',
  '--makay-dark-navy':     'Body text & dark elements',
  '--makay-mauve':         'Secondary / muted text',
};
const DEFAULT_SCROLL_COLORS = ['#FFF8F0','#F5EFE5','#FFFFFF','#FFF8F0','#F5EFE5','#FFF8F0','#F5EFE5'];
const SECTION_NAMES = ['Hero','Featured Collection','Why Makay','Testimonials','How It Works','Categories','Newsletter'];

// ── Pages ─────────────────────────────────────────────────────────────────
const PAGES = [
  { id: 'global',         label: 'Global Brand',   icon: Globe2,      src: '/'           },
  { id: 'home',           label: 'Home',            icon: Globe,       src: '/'           },
  { id: 'events',         label: 'Events Section',  icon: Calendar,    src: '/#events'      },
  { id: 'memberships',    label: 'Memberships',     icon: Crown,       src: '/#memberships' },
  { id: 'products',       label: 'Products',        icon: ShoppingBag, src: '/products'   },
  { id: 'product-detail', label: 'Product Detail',  icon: Package,     src: '/products/1' },
  { id: 'checkout',       label: 'Checkout',        icon: CreditCard,  src: '/cart'       },
];
const FONT_OPTIONS = [
  { id: 'playfair',   label: 'Playfair Display', value: "'Playfair Display', Georgia, serif" },
  { id: 'montserrat', label: 'Montserrat',        value: "'Montserrat', sans-serif" },
  { id: 'georgia',    label: 'Georgia',           value: 'Georgia, serif' },
  { id: 'system',     label: 'System UI',         value: 'system-ui, sans-serif' },
];
const SCALE_OPTIONS = [
  {id:'xs',label:'XS',value:'0.82'},{id:'sm',label:'SM',value:'0.92'},{id:'md',label:'MD',value:'1.0'},
  {id:'lg',label:'LG',value:'1.12'},{id:'xl',label:'XL',value:'1.28'},
];
const BODY_SIZE_OPTIONS = [{id:'sm',label:'Small',value:'0.9rem'},{id:'md',label:'Medium',value:'1rem'},{id:'lg',label:'Large',value:'1.1rem'}];
const LETTER_SPACING_OPTIONS = [{id:'tight',label:'Tight',value:'-0.01em'},{id:'normal',label:'Normal',value:'0.02em'},{id:'wide',label:'Wide',value:'0.08em'}];
const PAGE_COLOR_CONTROLS = [
  { key: 'bg',        label: 'Page Background',   cssVar: '--makay-premium-cream', default: '#FFF8F0' },
  { key: 'sectionBg', label: 'Section Background', cssVar: '--makay-sand-cream',    default: '#F5EFE5' },
  { key: 'primary',   label: 'Primary / Buttons',  cssVar: '--makay-peachy-rose',   default: '#D4A574' },
  { key: 'text',      label: 'Body Text',           cssVar: '--makay-dark-navy',     default: '#2C2C2C' },
  { key: 'muted',     label: 'Muted / Labels',      cssVar: '--makay-mauve',         default: '#A89080' },
];
const CONTENT_FIELDS: Record<string, {key:string;label:string;type:'text'|'textarea'|'image';placeholder:string}[]> = {
  home: [
    { key:'heroTitle',       label:'Hero Headline',           type:'text',     placeholder:'Your Connection Refuge'    },
    { key:'heroSubtitle',    label:'Hero Subtitle',           type:'textarea', placeholder:'Discover clothing...'      },
    { key:'ctaText',         label:'CTA Button',              type:'text',     placeholder:'Explore Collection'        },
    { key:'featuredTitle',   label:'Featured Section Title',  type:'text',     placeholder:'Featured Collection'       },
    { key:'featuredSubtitle',label:'Featured Subtitle',       type:'text',     placeholder:'Handpicked for the season' },
  ],
  products: [
    { key:'pageTitle',   label:'Page Heading',       type:'text', placeholder:'Our Collection'          },
    { key:'pageSubtitle',label:'Page Subheading',    type:'text', placeholder:'Discover our full range' },
    { key:'emptyState',  label:'No Results Message', type:'text', placeholder:'No products found.'      },
  ],
  'product-detail': [
    { key:'addToCart',   label:'Add to Cart Button',    type:'text', placeholder:'Add to Cart'       },
    { key:'reviewsTitle',label:'Reviews Section Title', type:'text', placeholder:'Customer Reviews'  },
    { key:'relatedTitle',label:'Related Products',      type:'text', placeholder:'You May Also Like' },
  ],
  checkout: [
    { key:'pageTitle',    label:'Checkout Title',         type:'text', placeholder:'Checkout'      },
    { key:'shippingTitle',label:'Shipping Section Title', type:'text', placeholder:'Shipping Info' },
    { key:'summaryTitle', label:'Order Summary Title',    type:'text', placeholder:'Order Summary' },
    { key:'placeOrderBtn',label:'Place Order Button',     type:'text', placeholder:'Place Order'   },
  ],
  events: [
    { key:'bg_image',   label:'Background Image',       type:'image',    placeholder:'https://...' },
    { key:'tag_label',  label:'Tag Label (small caps)', type:'text',     placeholder:'Beach Club Events' },
    { key:'heading',    label:'Section Heading',         type:'text',     placeholder:'Upcoming Experiences' },
    { key:'view_all',   label:'"View All" Link Text',    type:'text',     placeholder:'View all events' },
    { key:'no_events',  label:'Empty State Message',     type:'text',     placeholder:'No upcoming events yet.' },
  ],
  memberships: [
    { key:'heading',        label:'Section Heading',           type:'text',     placeholder:'Join the Beach Club' },
    { key:'tag_label',      label:'Tag Label (small caps)',    type:'text',     placeholder:'Membership Program' },
    { key:'bronze_label',   label:'Bronze Tier Name',          type:'text',     placeholder:'Bronze' },
    { key:'bronze_image',   label:'Bronze Image',               type:'image',    placeholder:'https://...' },
    { key:'bronze_perks',   label:'Bronze Perks (one per line)', type:'textarea', placeholder:'Full catalog access\nEarly drop access\n5% credit back' },
    { key:'silver_label',   label:'Silver Tier Name',          type:'text',     placeholder:'Silver' },
    { key:'silver_image',   label:'Silver Image',               type:'image',    placeholder:'https://...' },
    { key:'silver_perks',   label:'Silver Perks (one per line)', type:'textarea', placeholder:'Bronze perks\nPriority event tickets\n10% credit back' },
    { key:'gold_label',     label:'Gold Tier Name',            type:'text',     placeholder:'Gold' },
    { key:'gold_image',     label:'Gold Image',                 type:'image',    placeholder:'https://...' },
    { key:'gold_perks',     label:'Gold Perks (one per line)', type:'textarea', placeholder:'Silver perks\nVIP event access\n15% credit back' },
  ],
};

interface PageState { colors: Record<string,string>; typography: Record<string,string>; content: Record<string,string>; }
function makeDefaultPage(pageId?: string): PageState {
  const content: Record<string,string> = {};
  if (pageId && CONTENT_FIELDS[pageId]) {
    CONTENT_FIELDS[pageId].forEach(f => { if (f.type !== 'image') content[f.key] = f.placeholder; });
  }
  return {
    colors: Object.fromEntries(PAGE_COLOR_CONTROLS.map(c=>[c.key,c.default])),
    typography: { headingFont:'playfair', headingScale:'md', bodySize:'md', letterSpacing:'normal' },
    content,
  };
}

const CARD_ELEMENT_LABELS: Record<keyof CardLayout, string> = {
  logo:'Logo', tier:'Tier Badge', avatar:'Avatar', name:'Name', tagline:'Tagline',
  divider:'Divider', id:'Member ID', since:'Since Year', qr:'QR Code',
};

type StudioSection = 'pages' | 'card';
type PageSubTab = 'colors' | 'typography' | 'content';
type GlobalSubTab = 'brand' | 'scroll';
type SaveState = 'idle' | 'saving' | 'saved';

export default function StudioEditor() {
  const [section, setSection] = useState<StudioSection>('pages');
  const [activePage, setActivePage] = useState('global');
  const [pageSubTab, setPageSubTab] = useState<PageSubTab>('colors');
  const [globalSubTab, setGlobalSubTab] = useState<GlobalSubTab>('brand');
  const [brandSubSection, setBrandSubSection] = useState<'presets'|'custom'>('presets');

  // Brand colors (global)
  const [activePreset, setActivePreset] = useState('makay-default');
  const [colors, setColors] = useState<Record<string,string>>(
    Object.keys(COLOR_LABELS).reduce((a,k) => ({ ...a, [k]: PRESETS['makay-default'][k] }), {})
  );
  const [scrollColors, setScrollColors] = useState<string[]>(DEFAULT_SCROLL_COLORS);

  // Per-page states
  const [pageStates, setPageStates] = useState<Record<string,PageState>>(
    Object.fromEntries(PAGES.filter(p=>p.id!=='global').map(p=>[p.id, makeDefaultPage(p.id)]))
  );

  // Card
  const [cardLayout, setCardLayout] = useState<CardLayout>(DEFAULT_CARD_LAYOUT);
  const [cardColors, setCardColors] = useState<CardColors>(DEFAULT_CARD_COLORS);
  const [activeCardEl, setActiveCardEl] = useState<keyof CardLayout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Preview (iframe)
  const [iframeReady, setIframeReady] = useState(false);
  const [previewSrc, setPreviewSrc] = useState('/');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  // Save states
  const [saves, setSaves] = useState<Record<string,SaveState>>({});

  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('theme-editor-tour');

  // ── Load settings ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/theme').then(r=>r.json()).then((data: Record<string,string>) => {
      const loaded: Record<string,string> = {};
      Object.keys(COLOR_LABELS).forEach(k => { if (data[k]) loaded[k] = data[k]; });
      if (Object.keys(loaded).length) setColors(c => ({ ...c, ...loaded }));
      if (data['--scroll-colors']) { try { setScrollColors(JSON.parse(data['--scroll-colors'])); } catch {} }
      if (data['card_layout']) { try { setCardLayout(JSON.parse(data['card_layout'])); } catch {} }
      if (data['card_colors']) { try { setCardColors(JSON.parse(data['card_colors'])); } catch {} }
      setPageStates(prev => {
        const next = { ...prev };
        PAGES.filter(p=>p.id!=='global').forEach(({ id: pid }) => {
          const ps = makeDefaultPage(pid);
          Object.entries(data).forEach(([k, v]) => {
            const cm = k.match(new RegExp(`^page:${pid}:colors:(.+)$`));    if (cm) { ps.colors[cm[1]] = v; return; }
            const tm = k.match(new RegExp(`^page:${pid}:typography:(.+)$`)); if (tm) { ps.typography[tm[1]] = v; return; }
            const nm = k.match(new RegExp(`^page:${pid}:content:(.+)$`));   if (nm) { ps.content[nm[1]] = v; }
          });
          next[pid] = ps;
        });
        return next;
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tutorialStore.isCompleted('theme-editor-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('theme-editor-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Iframe style injection ─────────────────────────────────────────────
  const injectStyles = useCallback((ps: PageState) => {
    try {
      const doc = iframeRef.current?.contentDocument;
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
    if (activePage !== 'global') {
      const src = PAGES.find(p=>p.id===activePage)?.src ?? '/';
      setPreviewSrc(src);
      setIframeReady(false);
    }
  }, [activePage]);

  useEffect(() => {
    if (iframeReady && activePage !== 'global') {
      injectStyles(pageStates[activePage] ?? makeDefaultPage());
    }
  }, [pageStates, activePage, iframeReady, injectStyles]);

  // ── Save helpers ───────────────────────────────────────────────────────
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
    setSaveState('global', 'saving');
    await patchSettings(colors);
    setSaveState('global', 'saved');
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
    const patch: Record<string,string> = { ...colors, '--scroll-colors': JSON.stringify(scrollColors), card_layout: JSON.stringify(cardLayout), card_colors: JSON.stringify(cardColors) };
    PAGES.filter(p=>p.id!=='global').forEach(({ id: pid }) => {
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
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

  const applyPreset = (key: string) => {
    setColors(PRESETS[key]);
    setActivePreset(key);
    Object.entries(PRESETS[key]).forEach(([k,v]) => document.documentElement.style.setProperty(k,v));
  };

  const current = pageStates[activePage] ?? makeDefaultPage();
  const updatePageColor = (k: string, v: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], colors: { ...s[activePage].colors, [k]: v } } }));
  const updatePageTypography = (k: string, v: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], typography: { ...s[activePage].typography, [k]: v } } }));
  const updatePageContent = (k: string, v: string) =>
    setPageStates(s => ({ ...s, [activePage]: { ...s[activePage], content: { ...s[activePage].content, [k]: v } } }));

  const allSaveState = saves['all'] ?? 'idle';

  return (
    <div className="studio-root">
      {tutorialUI}

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div className="studio-topbar">
        <div className="studio-topbar-left">
          <Wand2 size={18} className="studio-topbar-icon" />
          <div>
            <h1 className="studio-title">Storefront Studio</h1>
            <p className="studio-subtitle">Brand, pages, content — one editor</p>
          </div>
        </div>

        <nav className="studio-section-tabs">
          {([
            { id: 'pages', label: 'Pages' },
            { id: 'card',  label: 'Member Card' },
          ] as { id: StudioSection; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              className={`studio-section-tab${section === id ? ' active' : ''}`}
              onClick={() => setSection(id)}
            >
              {id === 'pages' ? <Globe size={14} /> : <CardIcon size={14} />}
              {label}
            </button>
          ))}
        </nav>

        <div className="studio-topbar-right">
          <button className="studio-btn-ghost" onClick={() => tutorialStore.showTutorial('theme-editor-tour')}>
            <HelpCircle size={15} />
          </button>
          {section === 'pages' && activePage !== 'global' && (
            <a href={PAGES.find(p=>p.id===activePage)?.src ?? '/'} target="_blank" rel="noreferrer" className="studio-btn-ghost">
              <ExternalLink size={14} /> Preview
            </a>
          )}
          <button
            className={`studio-publish-btn${allSaveState === 'saved' ? ' saved' : ''}`}
            onClick={publishAll}
            disabled={allSaveState === 'saving'}
          >
            {allSaveState === 'saving' && <Loader size={14} className="studio-spin" />}
            {allSaveState === 'saved'  && <Check size={14} />}
            {allSaveState === 'saved' ? 'Published!' : allSaveState === 'saving' ? 'Publishing…' : 'Publish All'}
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="studio-body" style={{ gridTemplateColumns: panelCollapsed ? '0 1fr' : '340px 1fr' }}>

        {/* ── PAGES TAB ─────────────────────────────────────────────── */}
        {section === 'pages' && (
          <>
            {/* Left: controls */}
            <div className="studio-controls" data-lenis-prevent>
              <div className="studio-panel">

                {/* Page selector */}
                <div className="studio-page-tabs">
                  {PAGES.map(p => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        className={`studio-page-tab${activePage === p.id ? ' active' : ''}`}
                        onClick={() => { setActivePage(p.id); if (p.id !== 'global') setPreviewSrc(p.src); }}
                      >
                        <Icon size={12} /> {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* ── GLOBAL BRAND ── */}
                {activePage === 'global' && (
                  <>
                    <div className="studio-panel-header">
                      <span>Global Brand & Colors</span>
                      <SaveBtn id="global" onClick={saveBrand} />
                    </div>

                    {/* Brand / Scroll sub-tabs */}
                    <div className="studio-subtabs" style={{ marginBottom: '1rem' }}>
                      <button className={`studio-subtab${globalSubTab==='brand'?' active':''}`} onClick={() => setGlobalSubTab('brand')}>Brand Colors</button>
                      <button className={`studio-subtab${globalSubTab==='scroll'?' active':''}`} onClick={() => setGlobalSubTab('scroll')}>Scroll Colors</button>
                    </div>

                    {globalSubTab === 'brand' && (
                      <>
                        <div className="studio-subtabs" style={{ marginBottom: '0.75rem' }}>
                          <button className={`studio-subtab${brandSubSection==='presets'?' active':''}`} onClick={() => setBrandSubSection('presets')}>Presets</button>
                          <button className={`studio-subtab${brandSubSection==='custom'?' active':''}`}  onClick={() => setBrandSubSection('custom')}>Custom</button>
                        </div>

                        {brandSubSection === 'presets' && (
                          <div className="studio-preset-grid">
                            {Object.entries(PRESET_LABELS).map(([key, label]) => (
                              <button key={key} className={`studio-preset-btn${activePreset===key?' active':''}`} onClick={() => applyPreset(key)}>
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

                        {brandSubSection === 'custom' && (
                          <div className="studio-color-list">
                            {Object.entries(COLOR_LABELS).map(([key, label]) => (
                              <div key={key} className="studio-color-row">
                                <label className="studio-color-label">{label}</label>
                                <div className="studio-color-inputs">
                                  <input type="color" value={colors[key]??'#000000'} onChange={e => {
                                    setColors(c => ({ ...c, [key]: e.target.value }));
                                    document.documentElement.style.setProperty(key, e.target.value);
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
                            <button className="studio-reset-btn" onClick={() => applyPreset('makay-default')}>
                              <RotateCcw size={12} /> Reset to Makay Default
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {globalSubTab === 'scroll' && (
                      <>
                        <p className="studio-hint">Each homepage section gets its own background color as visitors scroll.</p>
                        <div className="studio-color-list">
                          {SECTION_NAMES.map((name, idx) => (
                            <div key={idx} className="studio-color-row">
                              <label className="studio-color-label">{name}</label>
                              <div className="studio-color-inputs">
                                <input type="color" value={scrollColors[idx]??'#ffffff'} onChange={e => {
                                  const next = [...scrollColors]; next[idx] = e.target.value; setScrollColors(next);
                                }} className="studio-color-picker" />
                                <input type="text" value={scrollColors[idx]??''} onChange={e => {
                                  if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) {
                                    const next = [...scrollColors]; next[idx] = e.target.value; setScrollColors(next);
                                  }
                                }} className="studio-color-hex" />
                              </div>
                            </div>
                          ))}
                          <div style={{ marginTop: '0.75rem' }}>
                            <SaveBtn id="scroll" onClick={saveScroll} />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ── SPECIFIC PAGE ── */}
                {activePage !== 'global' && (
                  <>
                    <div className="studio-panel-header">
                      <span>{PAGES.find(p=>p.id===activePage)?.label} Overrides</span>
                      <SaveBtn id={`page-${activePage}`} onClick={saveCurrentPage} />
                    </div>
                    <div className="studio-subtabs">
                      <button className={`studio-subtab${pageSubTab==='colors'?' active':''}`}     onClick={() => setPageSubTab('colors')}>Colors</button>
                      <button className={`studio-subtab${pageSubTab==='typography'?' active':''}`} onClick={() => setPageSubTab('typography')}>Typography</button>
                      <button className={`studio-subtab${pageSubTab==='content'?' active':''}`}    onClick={() => setPageSubTab('content')}>Content</button>
                    </div>

                    {pageSubTab === 'colors' && (
                      <div className="studio-color-list">
                        {PAGE_COLOR_CONTROLS.map(ctrl => (
                          <div key={ctrl.key} className="studio-color-row">
                            <label className="studio-color-label">{ctrl.label}</label>
                            <div className="studio-color-inputs">
                              <input type="color" value={current.colors[ctrl.key]??ctrl.default} onChange={e => updatePageColor(ctrl.key, e.target.value)} className="studio-color-picker" />
                              <input type="text" value={current.colors[ctrl.key]??''} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) updatePageColor(ctrl.key, e.target.value); }} className="studio-color-hex" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {pageSubTab === 'typography' && (
                      <div className="studio-typography-list">
                        <div className="studio-type-group">
                          <label className="studio-color-label">Heading Font</label>
                          <div className="studio-font-options">
                            {FONT_OPTIONS.map(f => (
                              <button key={f.id} className={`studio-font-btn${current.typography.headingFont===f.id?' active':''}`} style={{ fontFamily: f.value }} onClick={() => updatePageTypography('headingFont', f.id)}>{f.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="studio-type-group">
                          <label className="studio-color-label">Heading Size</label>
                          <div className="studio-scale-options">
                            {SCALE_OPTIONS.map(s => (
                              <button key={s.id} className={`studio-scale-btn${current.typography.headingScale===s.id?' active':''}`} onClick={() => updatePageTypography('headingScale', s.id)}>{s.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="studio-type-group">
                          <label className="studio-color-label">Body Size</label>
                          <div className="studio-scale-options">
                            {BODY_SIZE_OPTIONS.map(s => (
                              <button key={s.id} className={`studio-scale-btn${current.typography.bodySize===s.id?' active':''}`} onClick={() => updatePageTypography('bodySize', s.id)}>{s.label}</button>
                            ))}
                          </div>
                        </div>
                        <div className="studio-type-group">
                          <label className="studio-color-label">Letter Spacing</label>
                          <div className="studio-scale-options">
                            {LETTER_SPACING_OPTIONS.map(s => (
                              <button key={s.id} className={`studio-scale-btn${current.typography.letterSpacing===s.id?' active':''}`} onClick={() => updatePageTypography('letterSpacing', s.id)}>{s.label}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {pageSubTab === 'content' && (
                      <div className="studio-content-list">
                        {(CONTENT_FIELDS[activePage] ?? []).map(field => (
                          <div key={field.key} className="studio-content-field">
                            <label className="studio-color-label">{field.label}</label>
                            {field.type === 'textarea' ? (
                              <textarea className="studio-textarea" rows={2} placeholder={field.placeholder}
                                value={current.content[field.key]??''} onChange={e => updatePageContent(field.key, e.target.value)} />
                            ) : field.type === 'image' ? (
                              <ImageUpload
                                value={current.content[field.key]??''}
                                onChange={url => updatePageContent(field.key, url)}
                              />
                            ) : (
                              <input type="text" className="studio-input" placeholder={field.placeholder}
                                value={current.content[field.key]??''} onChange={e => updatePageContent(field.key, e.target.value)} />
                            )}
                          </div>
                        ))}
                        {!(CONTENT_FIELDS[activePage]?.length) && (
                          <p className="studio-hint">No content fields for this page.</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right: preview */}
            <div className="studio-preview">
              <div className="studio-preview-bar">
                <button className="studio-panel-toggle" onClick={() => setPanelCollapsed(c => !c)} title={panelCollapsed ? 'Show panel' : 'Hide panel'}>
                  {panelCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </button>
                <span className="studio-preview-label">Live Preview</span>
                {activePage === 'global'
                  ? <span className="studio-preview-url">color palette</span>
                  : <span className="studio-preview-url">{previewSrc}</span>}
              </div>
              <div className="studio-iframe-wrap">
                {activePage === 'global' ? (
                  <BrandColorPreview colors={colors} scrollColors={scrollColors} activeGlobal={globalSubTab} />
                ) : (
                  <iframe
                    key={`pages-${activePage}`}
                    ref={iframeRef}
                    src={previewSrc}
                    className="studio-iframe"
                    onLoad={() => { setIframeReady(true); injectStyles(pageStates[activePage] ?? makeDefaultPage()); }}
                    title="Storefront Preview"
                  />
                )}
              </div>
            </div>
          </>
        )}

        {/* ── CARD TAB ──────────────────────────────────────────────── */}
        {section === 'card' && (
          <>
            {/* Left: card controls */}
            <div className="studio-controls" data-lenis-prevent>
              <div className="studio-panel">
                <div className="studio-panel-header">
                  <span>Card Elements</span>
                  <div style={{ display:'flex', gap:'0.4rem' }}>
                    <button className="studio-reset-btn" style={{ margin:0 }} onClick={() => setCardLayout(DEFAULT_CARD_LAYOUT)}>
                      <RotateCcw size={12} /> Reset
                    </button>
                    <SaveBtn id="card" onClick={saveCard} />
                  </div>
                </div>

                <p className="studio-hint" style={{ marginBottom:'0.75rem' }}>Click an element in the preview to select. Drag to reposition.</p>

                {/* Element list */}
                <div className="cd-element-list" style={{ marginBottom:'1.25rem' }}>
                  {(Object.keys(CARD_ELEMENT_LABELS) as Array<keyof CardLayout>).map(key => (
                    <div key={key}>
                      <div
                        className={`cd-element-row${activeCardEl === key ? ' active' : ''}`}
                        onClick={() => setActiveCardEl(activeCardEl === key ? null : key)}
                      >
                        <span className="cd-element-name">{CARD_ELEMENT_LABELS[key]}</span>
                        <div className="cd-element-pos">
                          {Math.round(cardLayout[key].x)}%, {Math.round(cardLayout[key].y)}%
                        </div>
                        <button
                          className="cd-vis-btn"
                          onClick={e => { e.stopPropagation(); setCardLayout(l => ({ ...l, [key]: { ...l[key], visible: !l[key].visible } })); }}
                          title={cardLayout[key].visible ? 'Hide' : 'Show'}
                        >
                          {cardLayout[key].visible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                      {/* Scale slider — shown when element is selected */}
                      {activeCardEl === key && (
                        <div className="cd-scale-row">
                          <span className="cd-scale-label">Size</span>
                          <input
                            type="range" min={0.4} max={2.2} step={0.05}
                            value={cardLayout[key].scale ?? 1}
                            onChange={e => setCardLayout(l => ({ ...l, [key]: { ...l[key], scale: Number(e.target.value) } }))}
                            className="cd-scale-slider"
                          />
                          <span className="cd-scale-val">{((cardLayout[key].scale ?? 1) * 100).toFixed(0)}%</span>
                          <button
                            className="cd-scale-reset"
                            onClick={() => setCardLayout(l => ({ ...l, [key]: { ...l[key], scale: 1 } }))}
                            title="Reset size"
                          >
                            <RotateCcw size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Card colors */}
                <div className="studio-panel-header" style={{ marginTop:'0.5rem' }}>
                  <span>Card Colors</span>
                </div>
                <div className="cd-color-grid">
                  {[
                    { label:'Background start', key:'bg_from' as keyof CardColors },
                    { label:'Background end',   key:'bg_to'   as keyof CardColors },
                    { label:'Text',             key:'text'    as keyof CardColors },
                    { label:'Accent',           key:'accent'  as keyof CardColors },
                  ].map(({ label, key }) => (
                    <div key={key} className="studio-color-row">
                      <label className="studio-color-label">{label}</label>
                      <div className="studio-color-inputs">
                        <input type="color" className="studio-color-picker"
                          value={cardColors[key] as string}
                          onChange={e => setCardColors(c => ({ ...c, [key]: e.target.value }))} />
                        <input type="text" className="studio-color-hex"
                          value={cardColors[key] as string}
                          onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setCardColors(c => ({ ...c, [key]: e.target.value })); }} />
                      </div>
                    </div>
                  ))}
                  <div className="studio-color-row">
                    <label className="studio-color-label">Gradient angle</label>
                    <div className="cd-angle-wrap">
                      <input type="range" min={0} max={360} value={cardColors.bg_angle}
                        onChange={e => setCardColors(c => ({ ...c, bg_angle: Number(e.target.value) }))}
                        className="cd-angle-slider" />
                      <span className="cd-angle-val">{cardColors.bg_angle}°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: card canvas (large) */}
            <div className="studio-preview studio-card-canvas-area">
              <div className="studio-preview-bar">
                <button className="studio-panel-toggle" onClick={() => setPanelCollapsed(c => !c)} title={panelCollapsed ? 'Show panel' : 'Hide panel'}>
                  {panelCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
                </button>
                <span className="studio-preview-label">Card Preview</span>
                <span className="studio-preview-url">drag elements to reposition</span>
              </div>
              <div className="studio-card-canvas-wrap">
                <div className="studio-card-canvas-inner">
                  <CardCanvas
                    layout={cardLayout}
                    colors={cardColors}
                    activeEl={activeCardEl}
                    onLayoutChange={setCardLayout}
                    onActiveElChange={setActiveCardEl}
                    cardRef={cardRef}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Brand color preview (right panel for Global tab) ─────────────────────
function BrandColorPreview({ colors, scrollColors, activeGlobal }: {
  colors: Record<string,string>;
  scrollColors: string[];
  activeGlobal: 'brand' | 'scroll';
}) {
  const primary   = colors['--makay-peachy-rose']    ?? '#D4A574';
  const secondary = colors['--makay-soft-coral']     ?? '#E8B4A6';
  const pageBg    = colors['--makay-premium-cream']  ?? '#FFF8F0';
  const sectionBg = colors['--makay-sand-cream']     ?? '#F5EFE5';
  const gold      = colors['--makay-warm-gold']      ?? '#D4AF37';
  const text      = colors['--makay-dark-navy']      ?? '#2C2C2C';
  const muted     = colors['--makay-mauve']          ?? '#A89080';

  if (activeGlobal === 'scroll') {
    return (
      <div style={{ height:'100%', overflowY:'auto', background:'#fafafa' }}>
        <div style={{ padding:'1.5rem' }}>
          <p style={{ fontSize:'0.72rem', color:'#888', marginBottom:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>Homepage scroll preview</p>
          {SECTION_NAMES.map((name, i) => (
            <div key={i} style={{ marginBottom:'0.5rem' }}>
              <div style={{ height:48, background: scrollColors[i] ?? '#fff', border:'1px solid #e0e0e0', borderRadius:8, display:'flex', alignItems:'center', paddingLeft:'1rem' }}>
                <span style={{ fontSize:'0.78rem', color:'#555', fontWeight:500 }}>{name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ height:'100%', overflowY:'auto', background: pageBg }}>
      {/* Fake navbar */}
      <div style={{ background: pageBg, borderBottom:`1px solid ${sectionBg}`, padding:'0.75rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0 }}>
        <span style={{ fontWeight:700, fontSize:'0.9rem', color: text }}>makay</span>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {[primary, secondary, gold].map((c, i) => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:c }} />)}
        </div>
      </div>
      {/* Fake hero */}
      <div style={{ background:`linear-gradient(135deg, ${primary}33, ${secondary}55)`, padding:'3rem 1.5rem', textAlign:'center' }}>
        <div style={{ fontSize:'1.4rem', fontWeight:700, color: text, marginBottom:'0.5rem' }}>Your Headline Here</div>
        <div style={{ fontSize:'0.8rem', color: muted, marginBottom:'1.25rem' }}>Subtitle text goes here</div>
        <div style={{ display:'inline-block', background: primary, color: pageBg, padding:'0.5rem 1.25rem', borderRadius:6, fontSize:'0.8rem', fontWeight:600 }}>Explore Collection</div>
      </div>
      {/* Color swatches */}
      <div style={{ background: sectionBg, padding:'1.25rem', display:'flex', gap:'0.75rem', justifyContent:'center', flexWrap:'wrap' }}>
        {[
          { c: primary, l: 'Primary' },
          { c: secondary, l: 'Secondary' },
          { c: sectionBg, l: 'Section BG' },
          { c: gold, l: 'Gold' },
          { c: text, l: 'Text' },
          { c: muted, l: 'Muted' },
        ].map(({ c, l }) => (
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ width:40, height:40, borderRadius:8, background:c, border:`1px solid ${text}22`, marginBottom:'0.3rem' }} />
            <div style={{ fontSize:'0.62rem', color: muted }}>{l}</div>
            <div style={{ fontSize:'0.6rem', color:'#aaa' }}>{c}</div>
          </div>
        ))}
      </div>
      {/* Fake card row */}
      <div style={{ padding:'1.25rem 1rem', display:'flex', gap:'0.75rem' }}>
        {[1,2,3].map(n => (
          <div key={n} style={{ flex:1, background: pageBg, border:`1px solid ${sectionBg}`, borderRadius:8, padding:'0.75rem' }}>
            <div style={{ height:60, background:`linear-gradient(135deg, ${primary}22, ${secondary}33)`, borderRadius:6, marginBottom:'0.5rem' }} />
            <div style={{ height:8, background: text, borderRadius:4, marginBottom:'0.35rem', opacity:0.7 }} />
            <div style={{ height:6, background: muted, borderRadius:4, opacity:0.5 }} />
          </div>
        ))}
      </div>
    </div>
  );
}
