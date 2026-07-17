'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, RotateCcw, Eye, Palette, Layers, Image as ImageIcon, CreditCard, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { mockProducts } from '@/lib/mockData';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import CardDesigner, {
  CardLayout, CardColors,
  DEFAULT_CARD_LAYOUT, DEFAULT_CARD_COLORS,
} from '@/components/CardDesigner';

// ── Presets ──────────────────────────────────────────────────────
const PRESETS: Record<string, Record<string, string>> = {
  'makay-default': {
    '--makay-peachy-rose': '#D4A574',
    '--makay-soft-coral': '#E8B4A6',
    '--makay-sand-cream': '#F5EFE5',
    '--makay-premium-cream': '#FFF8F0',
    '--makay-ocean-teal': '#4A9FB5',
    '--makay-warm-gold': '#D4AF37',
    '--makay-dark-navy': '#2C2C2C',
    '--makay-mauve': '#A89080',
  },
  'dark-luxury': {
    '--makay-peachy-rose': '#C9A96E',
    '--makay-soft-coral': '#B8956A',
    '--makay-sand-cream': '#1E1A14',
    '--makay-premium-cream': '#141210',
    '--makay-ocean-teal': '#6B9FAF',
    '--makay-warm-gold': '#D4AF37',
    '--makay-dark-navy': '#F5F0E8',
    '--makay-mauve': '#9E8E7E',
  },
  'ocean-breeze': {
    '--makay-peachy-rose': '#4A9FB5',
    '--makay-soft-coral': '#6BB5C8',
    '--makay-sand-cream': '#EAF5F8',
    '--makay-premium-cream': '#F0FAFC',
    '--makay-ocean-teal': '#2A7B8C',
    '--makay-warm-gold': '#7BB8C6',
    '--makay-dark-navy': '#1A3A4A',
    '--makay-mauve': '#6A8A96',
  },
  'sunset-coral': {
    '--makay-peachy-rose': '#E8856A',
    '--makay-soft-coral': '#F0A090',
    '--makay-sand-cream': '#FDF0EC',
    '--makay-premium-cream': '#FEF8F6',
    '--makay-ocean-teal': '#D4826A',
    '--makay-warm-gold': '#E8A080',
    '--makay-dark-navy': '#2A1A16',
    '--makay-mauve': '#B07868',
  },
  'minimal-white': {
    '--makay-peachy-rose': '#1A1A1A',
    '--makay-soft-coral': '#555555',
    '--makay-sand-cream': '#F2F2F2',
    '--makay-premium-cream': '#FFFFFF',
    '--makay-ocean-teal': '#333333',
    '--makay-warm-gold': '#888888',
    '--makay-dark-navy': '#0A0A0A',
    '--makay-mauve': '#777777',
  },
};

const PRESET_LABELS: Record<string, string> = {
  'makay-default': 'Makay Default',
  'dark-luxury': 'Dark Luxury',
  'ocean-breeze': 'Ocean Breeze',
  'sunset-coral': 'Sunset Coral',
  'minimal-white': 'Minimal White',
};

const COLOR_LABELS: Record<string, string> = {
  '--makay-peachy-rose': 'Primary (buttons, headings)',
  '--makay-soft-coral': 'Secondary accent',
  '--makay-sand-cream': 'Card / section background',
  '--makay-premium-cream': 'Page background',
  '--makay-ocean-teal': 'Teal accent',
  '--makay-warm-gold': 'Gold highlight',
  '--makay-dark-navy': 'Body text / dark elements',
  '--makay-mauve': 'Secondary text',
};

const DEFAULT_SCROLL_COLORS = [
  '#FFF8F0', // hero
  '#F5EFE5', // featured
  '#FFFFFF',  // why makay
  '#FFF8F0', // testimonials
  '#F5EFE5', // how it works
  '#FFF8F0', // categories
  '#F5EFE5', // newsletter
];

const SECTION_NAMES = ['Hero', 'Featured Collection', 'Why Makay', 'Testimonials', 'How It Works', 'Categories', 'Newsletter'];

interface ThemeEditorProps {
  initialSettings: Record<string, string>;
  productOverrides: Record<string, string>;
}

export default function ThemeEditor({ initialSettings, productOverrides }: ThemeEditorProps) {
  const [activePreset, setActivePreset] = useState('makay-default');
  const [colors, setColors] = useState<Record<string, string>>(
    Object.keys(COLOR_LABELS).reduce((acc, k) => ({
      ...acc, [k]: initialSettings[k] ?? PRESETS['makay-default'][k],
    }), {})
  );
  const [scrollColors, setScrollColors] = useState<string[]>(
    (initialSettings['--scroll-colors'] ? JSON.parse(initialSettings['--scroll-colors']) : null) ?? DEFAULT_SCROLL_COLORS
  );
  const [imgOverrides, setImgOverrides] = useState<Record<string, string>>(productOverrides);
  const [cardLayout, setCardLayout] = useState<CardLayout>(() => {
    try { return initialSettings['card_layout'] ? JSON.parse(initialSettings['card_layout']) : DEFAULT_CARD_LAYOUT; }
    catch { return DEFAULT_CARD_LAYOUT; }
  });
  const [cardColors, setCardColors] = useState<CardColors>(() => {
    try { return initialSettings['card_colors'] ? JSON.parse(initialSettings['card_colors']) : DEFAULT_CARD_COLORS; }
    catch { return DEFAULT_CARD_COLORS; }
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'scroll' | 'images' | 'card'>('colors');
  const [openSection, setOpenSection] = useState<string | null>('preset');
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('theme-editor-tour');

  // Apply colors live to document root for real-time preview
  const applyLive = useCallback((c: Record<string, string>) => {
    Object.entries(c).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
  }, []);

  useEffect(() => { applyLive(colors); }, [colors, applyLive]);

  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    setColors(preset);
    setActivePreset(key);
    applyLive(preset);
  };

  const updateColor = (key: string, val: string) => {
    const next = { ...colors, [key]: val };
    setColors(next);
    document.documentElement.style.setProperty(key, val);
  };

  const updateScrollColor = (idx: number, val: string) => {
    const next = [...scrollColors];
    next[idx] = val;
    setScrollColors(next);
    // Apply scroll color engine update
    document.documentElement.style.setProperty(`--scroll-section-${idx}`, val);
  };

  const saveImgOverride = async (productId: string, imageUrl: string) => {
    await fetch('/api/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, image_url: imageUrl }),
    });
    setImgOverrides(o => ({ ...o, [productId]: imageUrl }));
  };

  const publish = async () => {
    setSaving(true);
    const settings: Record<string, string> = {
      ...colors,
      '--scroll-colors': JSON.stringify(scrollColors),
      'card_layout': JSON.stringify(cardLayout),
      'card_colors': JSON.stringify(cardColors),
    };
    await fetch('/api/admin/theme', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const resetToDefault = () => applyPreset('makay-default');

  // Auto-show tutorial on first visit
  useEffect(() => {
    if (!tutorialStore.isCompleted('theme-editor-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('theme-editor-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="theme-editor">
      {/* Top bar */}
      <div className="theme-editor-topbar">
        <div>
          <h1 className="theme-editor-title">Theme Editor</h1>
          <p className="theme-editor-sub">Changes preview instantly. Publish to make them live.</p>
        </div>
        <div className="theme-editor-actions">
          <button className="te-btn-ghost" onClick={resetToDefault}><RotateCcw size={14} /> Reset</button>
          <button className="te-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('theme-editor-tour')} aria-label="Show tutorial"><HelpCircle size={16} /></button>
          <button className="te-btn-primary" onClick={publish} disabled={saving}>
            {saved ? <><Check size={14} /> Published</> : saving ? 'Publishing...' : 'Publish Theme'}
          </button>
        </div>
      </div>

      <div className="theme-editor-body">
        {/* Left: controls */}
        <div className="theme-editor-controls">
          {/* Tab nav */}
          <div className="te-tabs">
            {[
              { key: 'colors',  icon: Palette,     label: 'Colors' },
              { key: 'scroll',  icon: Layers,       label: 'Scroll' },
              { key: 'images',  icon: ImageIcon,    label: 'Images' },
              { key: 'card',    icon: CreditCard,   label: 'Card' },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} className={`te-tab${activeTab === key ? ' active' : ''}`}
                onClick={() => setActiveTab(key as any)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Colors tab */}
          {activeTab === 'colors' && (
            <div className="te-panel">
              {/* Presets */}
              <div className="te-section">
                <button className="te-section-header" onClick={() => setOpenSection(openSection === 'preset' ? null : 'preset')}>
                  <span>Preset Themes</span>
                  {openSection === 'preset' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {openSection === 'preset' && (
                  <div className="te-preset-grid">
                    {Object.entries(PRESET_LABELS).map(([key, label]) => (
                      <button
                        key={key}
                        className={`te-preset-btn${activePreset === key ? ' active' : ''}`}
                        onClick={() => applyPreset(key)}
                      >
                        <span className="te-preset-swatch" style={{ background: PRESETS[key]['--makay-peachy-rose'] }} />
                        <span className="te-preset-swatch" style={{ background: PRESETS[key]['--makay-premium-cream'] }} />
                        <span className="te-preset-label">{label}</span>
                        {activePreset === key && <Check size={12} className="te-preset-check" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Individual color pickers */}
              <div className="te-section">
                <button className="te-section-header" onClick={() => setOpenSection(openSection === 'colors' ? null : 'colors')}>
                  <span>Custom Colors</span>
                  {openSection === 'colors' ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {openSection === 'colors' && (
                  <div className="te-color-list">
                    {Object.entries(COLOR_LABELS).map(([key, label]) => (
                      <div key={key} className="te-color-row">
                        <label className="te-color-label">{label}</label>
                        <div className="te-color-input-wrap">
                          <input type="color" className="te-color-picker" value={colors[key] ?? '#000000'} onChange={e => updateColor(key, e.target.value)} />
                          <input type="text" className="te-color-hex" value={colors[key] ?? ''} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) updateColor(key, e.target.value); }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scroll colors tab */}
          {activeTab === 'scroll' && (
            <div className="te-panel">
              <p className="te-hint">Each section gets a background color as you scroll through the page.</p>
              <div className="te-scroll-list">
                {SECTION_NAMES.map((name, idx) => (
                  <div key={idx} className="te-scroll-row">
                    <span className="te-scroll-label">{name}</span>
                    <div className="te-color-input-wrap">
                      <input type="color" className="te-color-picker" value={scrollColors[idx] ?? '#ffffff'} onChange={e => updateScrollColor(idx, e.target.value)} />
                      <input type="text" className="te-color-hex" value={scrollColors[idx] ?? ''} onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) updateScrollColor(idx, e.target.value); }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="te-hint" style={{ marginTop: '1rem' }}>
                These colors drive the <strong>ScrollColorEngine</strong> that transitions the page background as the visitor scrolls.
              </p>
            </div>
          )}

          {/* Product images tab */}
          {activeTab === 'images' && (
            <div className="te-panel">
              <p className="te-hint">Override product images for storefront display. Enter a URL or a public /images/ path.</p>
              <div className="te-img-list">
                {mockProducts.map(p => (
                  <ProductImageRow
                    key={p.id}
                    product={p}
                    currentImage={imgOverrides[p.id] ?? p.image}
                    onSave={(url) => saveImgOverride(p.id, url)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Card design tab */}
          {activeTab === 'card' && (
            <div className="te-panel" style={{ padding: '0.75rem', gap: 0 }}>
              <CardDesigner
                layout={cardLayout}
                colors={cardColors}
                onLayoutChange={setCardLayout}
                onColorsChange={setCardColors}
              />
            </div>
          )}
        </div>

        {/* Right: live preview */}
        <div className="theme-editor-preview">
          <div className="te-preview-header">
            <Eye size={14} /> Live Preview
          </div>
          <div className="te-preview-body">
            <ThemePreview colors={colors} scrollColors={scrollColors} />
          </div>
        </div>
      </div>
      {tutorialUI}
    </div>
  );
}

// ── Product image row ─────────────────────────────────────────────
function ProductImageRow({ product, currentImage, onSave }: {
  product: { id: string; title: string; image: string };
  currentImage: string;
  onSave: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentImage);

  return (
    <div className="te-img-row">
      <img src={currentImage} alt={product.title} className="te-img-thumb"
        onError={e => { (e.target as HTMLImageElement).src = '/images/product-tshirt.jpg'; }} />
      <div className="te-img-info">
        <span className="te-img-title">{product.title}</span>
        {editing ? (
          <div className="te-img-edit">
            <input className="te-img-input" value={draft} onChange={e => setDraft(e.target.value)} placeholder="Image URL or /images/..." />
            <button className="te-btn-small" onClick={() => { onSave(draft); setEditing(false); }}>Save</button>
            <button className="te-btn-small ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <button className="te-btn-small" onClick={() => { setDraft(currentImage); setEditing(true); }}>Change Image</button>
        )}
      </div>
    </div>
  );
}

// ── Live preview component ─────────────────────────────────────────
function ThemePreview({ colors, scrollColors }: { colors: Record<string, string>; scrollColors: string[] }) {
  const bg = colors['--makay-premium-cream'] ?? '#FFF8F0';
  const primary = colors['--makay-peachy-rose'] ?? '#D4A574';
  const text = colors['--makay-dark-navy'] ?? '#2C2C2C';
  const sand = colors['--makay-sand-cream'] ?? '#F5EFE5';
  const mauve = colors['--makay-mauve'] ?? '#A89080';
  const gold = colors['--makay-warm-gold'] ?? '#D4AF37';

  return (
    <div className="te-preview" style={{ background: bg }}>
      {/* Mock navbar */}
      <div className="te-prev-nav" style={{ background: bg, borderBottom: `1px solid ${sand}` }}>
        <span style={{ fontFamily: 'var(--font-playfair-display)', color: primary, fontWeight: 700 }}>MAKAY</span>
        <div className="te-prev-nav-links" style={{ color: text }}>
          <span>Products</span>
          <span style={{ background: primary, color: '#fff', padding: '3px 10px', borderRadius: 6, fontSize: 11 }}>Sign In</span>
        </div>
      </div>

      {/* Mock hero */}
      <div className="te-prev-hero" style={{ background: scrollColors[0] ?? bg }}>
        <div style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 18, fontWeight: 800, color: text, marginBottom: 6 }}>Your Connection Refuge</div>
        <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 10, color: mauve, marginBottom: 12 }}>Discover clothing that tells stories.</div>
        <button style={{ background: primary, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontFamily: 'var(--font-montserrat)', fontSize: 10, cursor: 'default' }}>
          Explore Collection →
        </button>
      </div>

      {/* Mock featured section */}
      <div className="te-prev-section" style={{ background: scrollColors[1] ?? bg }}>
        <div className="te-prev-section-title" style={{ color: primary }}>Handpicked Collection</div>
        <div className="te-prev-cards">
          {['Linen Shirt', 'Wrap Dress', 'Canvas Tote'].map((name, i) => (
            <div key={i} className="te-prev-card" style={{ background: sand, border: `1px solid ${primary}22` }}>
              <div className="te-prev-card-img" style={{ background: `${primary}22` }} />
              <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, color: text, fontWeight: 600 }}>{name}</div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 9, color: primary, fontWeight: 700 }}>$79.99</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mock why section */}
      <div className="te-prev-section" style={{ background: scrollColors[2] ?? bg }}>
        <div className="te-prev-section-title" style={{ color: text }}>Why Makay</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Quality', 'Community', 'Sustainability'].map((label, i) => (
            <div key={i} style={{ flex: 1, background: '#fff', border: `1px solid ${primary}33`, borderRadius: 8, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ color: primary, marginBottom: 3 }}>✦</div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, color: text, fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mock testimonials */}
      <div className="te-prev-section" style={{ background: scrollColors[3] ?? bg }}>
        <div className="te-prev-section-title" style={{ color: primary }}>What They Say</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['A', 'B', 'C'].map((_, i) => (
            <div key={i} style={{ flex: 1, background: '#fff', borderRadius: 8, padding: '8px 6px', border: `1px solid ${primary}22` }}>
              <div style={{ color: gold, fontSize: 8, marginBottom: 3 }}>★★★★★</div>
              <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 7, color: mauve, fontStyle: 'italic' }}>"Beautiful quality..."</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer preview */}
      <div style={{ background: sand, padding: '10px 12px', borderTop: `2px solid ${primary}` }}>
        <div style={{ fontFamily: 'var(--font-playfair-display)', fontSize: 12, color: primary, fontWeight: 700, marginBottom: 4 }}>MAKAY</div>
        <div style={{ fontFamily: 'var(--font-montserrat)', fontSize: 8, color: mauve }}>makay.com · Beach Club Store</div>
      </div>
    </div>
  );
}
