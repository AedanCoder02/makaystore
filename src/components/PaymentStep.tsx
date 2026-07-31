'use client';

import { useState, useRef } from 'react';
import { CreditCard, Smartphone, PocketKnife, Banknote, Plus, Minus, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import StripePaymentForm from '@/components/StripePaymentForm';

export type PaymentMethod = 'stripe' | 'pago_movil' | 'punto_venta' | 'cash';

export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  receipt_url: string;
}

interface Props {
  total: number;
  onSuccess: (methods: PaymentEntry[]) => Promise<void>;
  onBack: () => void;
  loading: boolean;
  error: string;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  stripe:      'Tarjeta de crédito / débito',
  pago_movil:  'Pago Móvil',
  punto_venta: 'Punto de Venta',
  cash:        'Efectivo',
};

const METHOD_ICONS: Record<PaymentMethod, React.ComponentType<{ size?: number; color?: string }>> = {
  stripe:      CreditCard,
  pago_movil:  Smartphone,
  punto_venta: PocketKnife,
  cash:        Banknote,
};

const OFF_PLATFORM: PaymentMethod[] = ['pago_movil', 'punto_venta'];
const ALL_METHODS: PaymentMethod[] = ['stripe', 'pago_movil', 'punto_venta', 'cash'];

function ReceiptUpload({ onUploaded }: { onUploaded: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) { onUploaded(data.url); setDone(true); }
    } catch {
      // upload failed silently — receipt is optional
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginTop: '0.75rem' }}>
      <input ref={ref} type="file" accept="image/*,application/pdf" onChange={handleFile} style={{ display: 'none' }} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', border: '1.5px dashed #d4cac0', borderRadius: 10, background: '#faf6f1', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', width: '100%' }}
      >
        {done ? <CheckCircle size={14} color="#10b981" /> : uploading ? <span style={{ width: 14, height: 14, border: '2px solid #d4cac0', borderTopColor: 'var(--makay-peachy-rose)', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} /> : <Upload size={14} />}
        {done ? 'Comprobante subido' : uploading ? 'Subiendo…' : 'Adjuntar comprobante (opcional)'}
      </button>
    </div>
  );
}

export default function PaymentStep({ total, onSuccess, onBack, loading, error }: Props) {
  const [methods, setMethods] = useState<PaymentEntry[]>([
    { method: 'stripe', amount: total, receipt_url: '' },
  ]);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [stripeProcessing, setStripeProcessing] = useState(false);

  const method1 = methods[0];
  const method2 = methods[1];

  const setMethod = (idx: number, method: PaymentMethod) => {
    setMethods(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], method, receipt_url: '' };
      return next;
    });
  };

  const setAmount = (idx: number, amount: number) => {
    setMethods(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], amount };
      if (splitEnabled && next.length > 1) {
        const other = Math.max(0, total - amount);
        next[1 - idx] = { ...next[1 - idx], amount: other };
      }
      return next;
    });
  };

  const setReceipt = (idx: number, url: string) => {
    setMethods(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], receipt_url: url };
      return next;
    });
  };

  const enableSplit = () => {
    const half = Math.round(total * 50) / 100;
    setMethods([
      { method: 'stripe', amount: half, receipt_url: '' },
      { method: 'pago_movil', amount: total - half, receipt_url: '' },
    ]);
    setSplitEnabled(true);
  };

  const disableSplit = () => {
    setMethods([{ method: 'stripe', amount: total, receipt_url: '' }]);
    setSplitEnabled(false);
  };

  const allOffPlatform = methods.every(m => OFF_PLATFORM.includes(m.method) || m.method === 'cash');
  const hasStripe = methods.some(m => m.method === 'stripe');

  const handleOffPlatformConfirm = async () => {
    await onSuccess(methods);
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    setStripeProcessing(true);
    const entry: PaymentEntry = { method: 'stripe', amount: method1.amount, receipt_url: paymentIntentId };
    await onSuccess([entry, ...(method2 ? [method2] : [])]);
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontSize: '0.875rem', color: 'var(--makay-peachy-rose)', padding: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        ← Volver
      </button>

      <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: '0 0 1.5rem' }}>
        Método de pago
      </h2>

      {/* Method rows */}
      {methods.map((entry, idx) => {
        const Icon = METHOD_ICONS[entry.method];
        const isOff = OFF_PLATFORM.includes(entry.method);
        return (
          <div key={idx} style={{ marginBottom: '1.25rem', padding: '1.25rem', border: '1.5px solid #e8e0d6', borderRadius: 14, background: '#fdfaf7' }}>
            {splitEnabled && (
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--makay-mauve)', marginBottom: '0.75rem' }}>
                Pago {idx + 1} de 2
              </p>
            )}

            {/* Method selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              {ALL_METHODS.map(m => {
                const MIcon = METHOD_ICONS[m];
                const active = entry.method === m;
                const otherMethod = methods[1 - idx]?.method;
                const disabled = splitEnabled && m === otherMethod;
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMethod(idx, m)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', border: `1.5px solid ${active ? 'var(--makay-peachy-rose)' : '#e0d8ce'}`, borderRadius: 10, background: active ? '#fff5ef' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: active ? 700 : 500, color: active ? 'var(--makay-peachy-rose)' : 'var(--makay-dark-navy)' }}
                  >
                    <MIcon size={13} /> {METHOD_LABELS[m]}
                  </button>
                );
              })}
            </div>

            {/* Amount if split */}
            {splitEnabled && (
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '0.4rem' }}>
                  Monto ($)
                </label>
                <input
                  type="number"
                  min={0}
                  max={total}
                  step={0.01}
                  value={entry.amount}
                  onChange={e => setAmount(idx, parseFloat(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1.5px solid #e0d8ce', borderRadius: 10, fontFamily: 'var(--font-montserrat)', fontSize: '0.9rem', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Off-platform notice + receipt */}
            {isOff && (
              <div style={{ background: '#fff8ef', border: '1px solid #eddcc8', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={14} color="#D4A574" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: '#7a5c3d', margin: 0, lineHeight: 1.5 }}>
                  El pago será verificado por nuestro equipo.
                </p>
              </div>
            )}

            {(isOff || entry.method === 'cash') && (
              <ReceiptUpload onUploaded={url => setReceipt(idx, url)} />
            )}

            {/* Stripe form for this slot */}
            {entry.method === 'stripe' && !splitEnabled && (
              <div style={{ marginTop: '0.875rem' }}>
                <StripePaymentForm
                  amount={entry.amount}
                  onSuccess={handleStripeSuccess}
                  onError={() => {}}
                  loading={loading || stripeProcessing}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Split payment toggle */}
      <div style={{ marginBottom: '1.25rem' }}>
        {!splitEnabled ? (
          <button
            type="button"
            onClick={enableSplit}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', border: '1.5px dashed #d4cac0', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}
          >
            <Plus size={13} /> Agregar segundo método de pago
          </button>
        ) : (
          <button
            type="button"
            onClick={disableSplit}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem', border: '1.5px solid #e0d8ce', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}
          >
            <Minus size={13} /> Quitar segundo método
          </button>
        )}
      </div>

      {/* Split balance indicator */}
      {splitEnabled && (
        <div style={{ padding: '0.75rem 1rem', background: '#f5efe9', borderRadius: 10, marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem' }}>
          <span style={{ color: 'var(--makay-mauve)' }}>Total a cubrir:</span>
          <span style={{ fontWeight: 700, color: methods.reduce((s, m) => s + m.amount, 0) === total ? '#10b981' : '#ef4444' }}>
            ${methods.reduce((s, m) => s + m.amount, 0).toFixed(2)} / ${total.toFixed(2)}
          </span>
        </div>
      )}

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: '#dc2626', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Confirm button for off-platform / cash / split */}
      {(allOffPlatform || (splitEnabled && !hasStripe)) && (
        <button
          type="button"
          onClick={handleOffPlatformConfirm}
          disabled={loading || (splitEnabled && methods.reduce((s, m) => s + m.amount, 0) !== total)}
          style={{ width: '100%', padding: '1rem', background: 'var(--makay-dark-navy)', color: '#fff', border: 'none', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.95rem', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Procesando…' : 'Confirmar pedido'}
        </button>
      )}
    </div>
  );
}
