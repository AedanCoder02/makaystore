'use client';

import { useState, useEffect } from 'react';
import { X, ArrowRight, MessageCircle, Percent, Umbrella, Trophy, Star, Lock, Award } from 'lucide-react';

const WA_LINK = 'https://wa.me/584142966058';

interface LeadData {
  name: string;
  email: string;
  phone: string;
  tier: string;
}

type Tier = 'bronze' | 'silver' | 'gold';

const TIER_COLOR: Record<Tier, string> = {
  bronze: '#CD7F32',
  silver: '#A8A9AD',
  gold:   '#D4AF37',
};

const TIER_LABEL: Record<Tier, string> = {
  bronze: 'Bronce',
  silver: 'Plata',
  gold:   'Oro',
};

const TIER_BENEFITS: Record<Tier, Array<{ icon: React.ComponentType<{ size?: number; color?: string }>; text: string }>> = {
  bronze: [
    { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
    { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
    { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
  ],
  silver: [
    { icon: Umbrella, text: 'Toldo GRATIS durante la temporada baja' },
    { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
    { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
    { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
  ],
  gold: [
    { icon: Umbrella, text: 'Toldo GRATIS durante la temporada baja' },
    { icon: Percent,  text: '10% de descuento en todos nuestros productos y servicios' },
    { icon: Star,     text: 'Priority Access: Reservas prioritarias en fechas especiales y eventos' },
    { icon: Lock,     text: 'Acceso Exclusivo: Invitación a nuestras catas y eventos cerrados' },
    { icon: Trophy,   text: 'Acceso Deportivo GRATIS: Canchas de Beach Tennis y Voleibol de playa' },
    { icon: Award,    text: 'Descuentos Exclusivos en todas nuestras marcas aliadas' },
  ],
};

interface Props {
  tier: Tier;
  onClose: () => void;
}

export default function MembershipLeadForm({ tier, onClose }: Props) {
  const color = TIER_COLOR[tier];
  const label = TIER_LABEL[tier];
  const benefits = TIER_BENEFITS[tier];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill from existing lead data
  useEffect(() => {
    try {
      const stored = localStorage.getItem('makay_lead');
      if (stored) {
        const d: Partial<LeadData> = JSON.parse(stored);
        if (d.name)  setName(d.name);
        if (d.email) setEmail(d.email);
        if (d.phone) setPhone(d.phone);
      }
    } catch {}
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveLead = () => {
    const lead: LeadData = { name, email, phone, tier };
    try {
      localStorage.setItem('makay_lead', JSON.stringify(lead));
      sessionStorage.setItem('makay_lead', JSON.stringify(lead));
    } catch {}
    setSubmitted(true);
  };

  const handleBuy = () => {
    saveLead();
    window.location.href = `/products?category=membresia&tier=${tier}`;
  };

  const handleAdvisor = () => {
    saveLead();
    window.open(WA_LINK, '_blank', 'noopener');
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden', position: 'relative' }}>
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)`, borderBottom: `2px solid ${color}30`, padding: '1.5rem 1.75rem 1.25rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color, margin: '0 0 0.25rem' }}>
              Membresía
            </p>
            <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>
              {label}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: 8, color: 'var(--makay-mauve)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Benefits summary */}
        <div style={{ padding: '1rem 1.75rem', borderBottom: '1px solid #f0ebe4', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {benefits.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Icon size={14} color={color} />
              <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-dark-navy)' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '1.5rem 1.75rem' }}>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
            Completa tus datos para continuar con la compra o hablar con un asesor.
          </p>

          {[
            { label: 'Nombre completo', value: name, set: setName, type: 'text', placeholder: 'Tu nombre' },
            { label: 'Correo electrónico', value: email, set: setEmail, type: 'email', placeholder: 'tu@correo.com' },
            { label: 'Número de teléfono', value: phone, set: setPhone, type: 'tel', placeholder: '+58 000 000 0000' },
          ].map(field => (
            <div key={field.label} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '0.4rem' }}>
                {field.label}
              </label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                style={{ width: '100%', padding: '0.7rem 0.875rem', border: '1.5px solid #e8e0d6', borderRadius: 10, fontFamily: 'var(--font-montserrat)', fontSize: '0.9rem', color: 'var(--makay-dark-navy)', background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => { e.currentTarget.style.borderColor = color; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e8e0d6'; }}
              />
            </div>
          ))}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleBuy}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderRadius: 12, background: color, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.875rem' }}
            >
              Comprar <ArrowRight size={15} />
            </button>
            <button
              onClick={handleAdvisor}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderRadius: 12, background: 'transparent', color, border: `2px solid ${color}`, cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.875rem' }}
            >
              <MessageCircle size={15} /> Asesor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
