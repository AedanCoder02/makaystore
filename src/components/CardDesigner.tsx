'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

export interface CardElementPos {
  x: number;       // % of card width
  y: number;       // % of card height
  visible: boolean;
  scale: number;   // 0.4–2.5, default 1.0
  text?: string;   // custom text content (for custom1/2/3)
}

export interface CardLayout {
  logo:    CardElementPos;
  tier:    CardElementPos;
  avatar:  CardElementPos;
  name:    CardElementPos;
  tagline: CardElementPos;
  divider: CardElementPos;
  id:      CardElementPos;
  since:   CardElementPos;
  qr:      CardElementPos;
  custom1: CardElementPos;
  custom2: CardElementPos;
  custom3: CardElementPos;
}

export interface CardColors {
  bg_from:  string;
  bg_to:    string;
  bg_angle: number;
  text:     string;
  accent:   string;
}

// ── Light Executive (matches Illustrator design) ───────────────────────────
export const DEFAULT_CARD_LAYOUT: CardLayout = {
  logo:    { x: 5,  y: 5,  visible: true,  scale: 1   },
  tier:    { x: 47, y: 7,  visible: true,  scale: 1   },
  avatar:  { x: 5,  y: 28, visible: true,  scale: 1.8 },
  name:    { x: 43, y: 23, visible: true,  scale: 2.4 },
  tagline: { x: 43, y: 12, visible: true,  scale: 1   },
  divider: { x: 0,  y: 72, visible: true,  scale: 1   },
  id:      { x: 5,  y: 79, visible: true,  scale: 1   },
  since:   { x: 60, y: 79, visible: true,  scale: 1   },
  qr:      { x: 76, y: 55, visible: false, scale: 0.8 },
  custom1: { x: 43, y: 55, visible: false, scale: 1, text: 'Texto personalizado' },
  custom2: { x: 5,  y: 88, visible: false, scale: 1, text: 'Texto personalizado' },
  custom3: { x: 60, y: 88, visible: false, scale: 1, text: 'Texto personalizado' },
};

export const DEFAULT_CARD_COLORS: CardColors = {
  bg_from:  '#FFFFFF',
  bg_to:    '#F5EFE5',
  bg_angle: 135,
  text:     '#2C2C2C',
  accent:   '#D4A574',
};

// ── Dark Classic (original layout) ────────────────────────────────────────
const DARK_CLASSIC_LAYOUT: CardLayout = {
  logo:    { x: 4,  y: 6,  visible: true,  scale: 1   },
  tier:    { x: 62, y: 6,  visible: true,  scale: 1   },
  avatar:  { x: 4,  y: 38, visible: true,  scale: 1   },
  name:    { x: 24, y: 40, visible: true,  scale: 1   },
  tagline: { x: 24, y: 54, visible: true,  scale: 1   },
  divider: { x: 0,  y: 66, visible: true,  scale: 1   },
  id:      { x: 4,  y: 74, visible: true,  scale: 1   },
  since:   { x: 4,  y: 84, visible: true,  scale: 1   },
  qr:      { x: 66, y: 68, visible: true,  scale: 1   },
  custom1: { x: 4,  y: 92, visible: false, scale: 1, text: 'Texto personalizado' },
  custom2: { x: 40, y: 92, visible: false, scale: 1, text: 'Texto personalizado' },
  custom3: { x: 70, y: 92, visible: false, scale: 1, text: 'Texto personalizado' },
};

export const CARD_TEMPLATES: Record<string, { label: string; colors: CardColors; layout: CardLayout }> = {
  'light-executive': { label: 'Ejecutivo Claro', colors: DEFAULT_CARD_COLORS, layout: DEFAULT_CARD_LAYOUT },
  'dark-classic':    {
    label: 'Clásico Oscuro',
    colors: { bg_from: '#3a3028', bg_to: '#1e1a16', bg_angle: 150, text: '#ffffff', accent: '#D4A574' },
    layout: DARK_CLASSIC_LAYOUT,
  },
};

export const ELEMENT_LABELS: Record<keyof CardLayout, string> = {
  logo:    'Logo',
  tier:    'Insignia de tier',
  avatar:  'Foto',
  name:    'Nombre',
  tagline: 'Tagline',
  divider: 'Divisor',
  id:      'ID de miembro',
  since:   'Año de ingreso',
  qr:      'Código QR',
  custom1: 'Texto libre 1',
  custom2: 'Texto libre 2',
  custom3: 'Texto libre 3',
};

// Ensure any saved layout (which may be missing new fields) is merged with defaults
export function mergeLayout(saved: Partial<CardLayout>): CardLayout {
  return {
    ...DEFAULT_CARD_LAYOUT,
    ...saved,
    custom1: { ...DEFAULT_CARD_LAYOUT.custom1, ...(saved.custom1 ?? {}) },
    custom2: { ...DEFAULT_CARD_LAYOUT.custom2, ...(saved.custom2 ?? {}) },
    custom3: { ...DEFAULT_CARD_LAYOUT.custom3, ...(saved.custom3 ?? {}) },
  };
}

interface Props {
  layout: CardLayout;
  colors: CardColors;
  onLayoutChange: (l: CardLayout) => void;
  onColorsChange: (c: CardColors) => void;
}

// ── CardCanvas: the draggable card preview ────────────────────────────────
export interface CardCanvasProps {
  layout: CardLayout;
  colors: CardColors;
  activeEl: keyof CardLayout | null;
  onLayoutChange: (l: CardLayout) => void;
  onActiveElChange: (key: keyof CardLayout) => void;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export function CardCanvas({ layout, colors, activeEl, onLayoutChange, onActiveElChange, cardRef }: CardCanvasProps) {
  const [dragging, setDragging] = useState<keyof CardLayout | null>(null);
  const cardBg = `linear-gradient(${colors.bg_angle}deg, ${colors.bg_from}, ${colors.bg_to})`;
  const isDark = colors.bg_from.toLowerCase() < '#888888';

  const startDrag = useCallback((e: React.MouseEvent, key: keyof CardLayout) => {
    e.preventDefault();
    if (!layout[key].visible) return;
    setDragging(key);
    onActiveElChange(key);
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const onMove = (mv: MouseEvent) => {
      const x = Math.max(0, Math.min(92, ((mv.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(92, ((mv.clientY - rect.top) / rect.height) * 100));
      onLayoutChange({ ...layout, [key]: { ...layout[key], x, y } });
    };
    const onUp = () => { setDragging(null); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [layout, onLayoutChange, onActiveElChange, cardRef]);

  const El = ({ id, children }: { id: keyof CardLayout; children: React.ReactNode }) => {
    const pos = layout[id];
    if (!pos) return null;
    const isActive = activeEl === id;
    const scale = pos.scale ?? 1;
    return (
      <div
        style={{
          position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
          cursor: pos.visible ? (dragging === id ? 'grabbing' : 'grab') : 'not-allowed',
          opacity: pos.visible ? 1 : 0.15,
          outline: isActive ? `2px dashed ${colors.accent}CC` : 'none',
          outlineOffset: 4, userSelect: 'none', zIndex: isActive ? 10 : 1,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          transition: 'outline 0.1s',
        }}
        onMouseDown={e => startDrag(e, id)}
        onClick={() => onActiveElChange(id)}
        title={`Arrastra para mover: ${ELEMENT_LABELS[id]}`}
      >
        {children}
      </div>
    );
  };

  return (
    <div className="cd-card" ref={cardRef} style={{ background: cardBg, cursor: dragging ? 'grabbing' : 'default' }}>
      <div className="cd-card-glow" />

      <El id="logo">
        <Image
          src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1-removebg-preview.png"
          alt="Makay" width={70} height={24}
          style={{ objectFit: 'contain', filter: isDark ? 'brightness(0) invert(1)' : 'none', display: 'block' }}
          draggable={false}
        />
      </El>

      <El id="tier">
        <span className="cd-tier-badge" style={{ borderColor: `${colors.accent}70`, color: colors.accent }}>
          Beach Club Member
        </span>
      </El>

      <El id="avatar">
        <div className="cd-avatar" style={{ borderColor: `${colors.accent}80`, background: `${colors.accent}18` }}>
          <svg width="22" height="26" viewBox="0 0 24 28" fill="none" stroke={colors.accent} strokeWidth="1.5">
            <circle cx="12" cy="8" r="5"/><path d="M2 26c0-5.5 4.5-10 10-10s10 4.5 10 10"/>
          </svg>
        </div>
      </El>

      <El id="name">
        <p className="cd-name" style={{ color: colors.text }}>Lorem Ipsum</p>
      </El>

      <El id="tagline">
        <p className="cd-tagline" style={{ color: `${colors.accent}C0` }}>BEACH CLUB MEMBER</p>
      </El>

      <El id="divider">
        <div className="cd-divider" style={{ background: `${colors.text}18` }} />
      </El>

      <El id="id">
        <p className="cd-id-text" style={{ color: `${colors.text}80` }}>
          ID: 00000000000
        </p>
      </El>

      <El id="since">
        <p className="cd-since-text" style={{ color: `${colors.text}55` }}>Since 2026</p>
      </El>

      <El id="qr">
        <div className="cd-qr-wrap">
          <QRCode value="https://makaystore-sandy.vercel.app" size={56} bgColor="transparent" fgColor={colors.text} />
        </div>
      </El>

      {(['custom1', 'custom2', 'custom3'] as const).map(key => (
        <El key={key} id={key}>
          {layout[key]?.text && (
            <p className="cd-custom-text" style={{ color: colors.text }}>{layout[key].text}</p>
          )}
        </El>
      ))}
    </div>
  );
}

// ── CardDesigner: legacy all-in-one (kept for backward compat) ─────────────
export default function CardDesigner({ layout, colors, onLayoutChange, onColorsChange }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeEl, setActiveEl] = useState<keyof CardLayout | null>(null);

  const toggleVisible = (key: keyof CardLayout) =>
    onLayoutChange({ ...layout, [key]: { ...layout[key], visible: !layout[key].visible } });
  const resetLayout = () => onLayoutChange(DEFAULT_CARD_LAYOUT);

  return (
    <div className="card-designer">
      <div className="cd-preview-wrap">
        <p className="cd-hint">Arrastra los elementos para reposicionarlos. Haz clic para seleccionar.</p>
        <CardCanvas layout={layout} colors={colors} activeEl={activeEl}
          onLayoutChange={onLayoutChange} onActiveElChange={setActiveEl} cardRef={cardRef} />
      </div>
      <div className="cd-controls">
        <div className="cd-control-section">
          <div className="cd-control-header">
            <span>Elementos</span>
            <button className="te-btn-ghost cd-reset-btn" onClick={resetLayout}>
              <RotateCcw size={12} /> Restablecer
            </button>
          </div>
          <div className="cd-element-list">
            {(Object.keys(ELEMENT_LABELS) as Array<keyof CardLayout>).map(key => (
              <div key={key} className={`cd-element-row${activeEl === key ? ' active' : ''}`} onClick={() => setActiveEl(key)}>
                <span className="cd-element-name">{ELEMENT_LABELS[key]}</span>
                <div className="cd-element-pos">{Math.round(layout[key]?.x ?? 0)}%, {Math.round(layout[key]?.y ?? 0)}%</div>
                <button className="cd-vis-btn" onClick={e => { e.stopPropagation(); toggleVisible(key); }}>
                  {layout[key]?.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="cd-control-section">
          <div className="cd-control-header"><span>Colores de la tarjeta</span></div>
          <div className="cd-color-grid">
            <CardColorRow label="Fondo (inicio)" value={colors.bg_from} onChange={v => onColorsChange({ ...colors, bg_from: v })} />
            <CardColorRow label="Fondo (fin)"    value={colors.bg_to}   onChange={v => onColorsChange({ ...colors, bg_to: v })} />
            <CardColorRow label="Color de texto"  value={colors.text}    onChange={v => onColorsChange({ ...colors, text: v })} />
            <CardColorRow label="Color de acento" value={colors.accent}  onChange={v => onColorsChange({ ...colors, accent: v })} />
            <div className="cd-color-row">
              <label className="te-color-label">Ángulo degradado</label>
              <div className="cd-angle-wrap">
                <input type="range" min={0} max={360} value={colors.bg_angle}
                  onChange={e => onColorsChange({ ...colors, bg_angle: Number(e.target.value) })}
                  className="cd-angle-slider" />
                <span className="cd-angle-val">{colors.bg_angle}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="cd-color-row">
      <label className="te-color-label">{label}</label>
      <div className="te-color-input-wrap">
        <input type="color" className="te-color-picker" value={value} onChange={e => onChange(e.target.value)} />
        <input type="text" className="te-color-hex" value={value}
          onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value); }} />
      </div>
    </div>
  );
}
