'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import QRCode from 'react-qr-code';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

export interface CardElementPos {
  x: number; // % of card width
  y: number; // % of card height
  visible: boolean;
  scale: number; // 0.5–2.0, default 1.0
}

export interface CardLayout {
  logo: CardElementPos;
  tier: CardElementPos;
  avatar: CardElementPos;
  name: CardElementPos;
  tagline: CardElementPos;
  divider: CardElementPos;
  id: CardElementPos;
  since: CardElementPos;
  qr: CardElementPos;
}

export interface CardColors {
  bg_from: string;
  bg_to: string;
  bg_angle: number;
  text: string;
  accent: string;
}

export const DEFAULT_CARD_LAYOUT: CardLayout = {
  logo:    { x: 4,  y: 6,  visible: true, scale: 1 },
  tier:    { x: 62, y: 6,  visible: true, scale: 1 },
  avatar:  { x: 4,  y: 38, visible: true, scale: 1 },
  name:    { x: 24, y: 40, visible: true, scale: 1 },
  tagline: { x: 24, y: 54, visible: true, scale: 1 },
  divider: { x: 0,  y: 66, visible: true, scale: 1 },
  id:      { x: 4,  y: 74, visible: true, scale: 1 },
  since:   { x: 4,  y: 84, visible: true, scale: 1 },
  qr:      { x: 66, y: 68, visible: true, scale: 1 },
};

export const DEFAULT_CARD_COLORS: CardColors = {
  bg_from: '#3a3028',
  bg_to:   '#1e1a16',
  bg_angle: 150,
  text:    '#ffffff',
  accent:  '#D4A574',
};

const ELEMENT_LABELS: Record<keyof CardLayout, string> = {
  logo: 'Logo', tier: 'Tier Badge', avatar: 'Avatar',
  name: 'Name', tagline: 'Tagline', divider: 'Divider',
  id: 'Member ID', since: 'Since Year', qr: 'QR Code',
};

interface Props {
  layout: CardLayout;
  colors: CardColors;
  onLayoutChange: (l: CardLayout) => void;
  onColorsChange: (c: CardColors) => void;
}

// ── CardCanvas: the draggable card preview only ────────────────────────────
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
    const onUp = () => {
      setDragging(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [layout, onLayoutChange, onActiveElChange, cardRef]);

  const El = ({ id, children }: { id: keyof CardLayout; children: React.ReactNode }) => {
    const pos = layout[id];
    const isActive = activeEl === id;
    const scale = pos.scale ?? 1;
    return (
      <div
        style={{
          position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
          cursor: pos.visible ? (dragging === id ? 'grabbing' : 'grab') : 'not-allowed',
          opacity: pos.visible ? 1 : 0.2,
          outline: isActive ? '2px dashed rgba(212,165,116,0.9)' : 'none',
          outlineOffset: 4, userSelect: 'none', zIndex: isActive ? 10 : 1,
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
          transition: 'outline 0.1s',
        }}
        onMouseDown={e => startDrag(e, id)}
        onClick={() => onActiveElChange(id)}
        title={`Drag to reposition ${ELEMENT_LABELS[id]}`}
      >
        {children}
      </div>
    );
  };

  return (
    <div
      className="cd-card"
      ref={cardRef}
      style={{ background: cardBg, cursor: dragging ? 'grabbing' : 'default' }}
    >
      <div className="cd-card-glow" />
      <El id="logo">
        <Image src="/images/2422e513-d2a3-47ad-9574-1b141cd4de8f-1-removebg-preview.png"
          alt="Makay" width={70} height={24}
          style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', display: 'block' }}
          draggable={false} />
      </El>
      <El id="tier">
        <span className="cd-tier-badge" style={{ borderColor: `${colors.accent}55`, color: colors.accent }}>Explorer</span>
      </El>
      <El id="avatar">
        <div className="cd-avatar" style={{ borderColor: `${colors.accent}80` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth="1.5">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </div>
      </El>
      <El id="name"><p className="cd-name" style={{ color: colors.text }}>Aedan Proger</p></El>
      <El id="tagline"><p className="cd-tagline" style={{ color: `${colors.accent}B0` }}>BEACH CLUB MEMBER</p></El>
      <El id="divider"><div className="cd-divider" /></El>
      <El id="id"><p className="cd-id-text" style={{ color: `${colors.text}88` }}>ID: TXUHKW2T</p></El>
      <El id="since"><p className="cd-since-text" style={{ color: `${colors.text}44` }}>Since 2026</p></El>
      <El id="qr">
        <div className="cd-qr-wrap">
          <QRCode value="https://makaystore-sandy.vercel.app" size={56} bgColor="transparent" fgColor="#1e1a16" />
        </div>
      </El>
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
        <p className="cd-hint">Drag elements to reposition. Click to select.</p>
        <CardCanvas layout={layout} colors={colors} activeEl={activeEl}
          onLayoutChange={onLayoutChange} onActiveElChange={setActiveEl} cardRef={cardRef} />
      </div>
      <div className="cd-controls">
        <div className="cd-control-section">
          <div className="cd-control-header">
            <span>Elements</span>
            <button className="te-btn-ghost cd-reset-btn" onClick={resetLayout}>
              <RotateCcw size={12} /> Reset positions
            </button>
          </div>
          <div className="cd-element-list">
            {(Object.keys(ELEMENT_LABELS) as Array<keyof CardLayout>).map(key => (
              <div key={key} className={`cd-element-row${activeEl === key ? ' active' : ''}`} onClick={() => setActiveEl(key)}>
                <span className="cd-element-name">{ELEMENT_LABELS[key]}</span>
                <div className="cd-element-pos">{Math.round(layout[key].x)}%, {Math.round(layout[key].y)}%</div>
                <button className="cd-vis-btn" onClick={e => { e.stopPropagation(); toggleVisible(key); }}>
                  {layout[key].visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="cd-control-section">
          <div className="cd-control-header"><span>Card Colors</span></div>
          <div className="cd-color-grid">
            <CardColorRow label="Background (from)" value={colors.bg_from} onChange={v => onColorsChange({ ...colors, bg_from: v })} />
            <CardColorRow label="Background (to)"   value={colors.bg_to}   onChange={v => onColorsChange({ ...colors, bg_to: v })} />
            <CardColorRow label="Text color"        value={colors.text}    onChange={v => onColorsChange({ ...colors, text: v })} />
            <CardColorRow label="Accent color"      value={colors.accent}  onChange={v => onColorsChange({ ...colors, accent: v })} />
            <div className="cd-color-row">
              <label className="te-color-label">Gradient angle</label>
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
