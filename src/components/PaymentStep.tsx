'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowLeft, Bitcoin, Check, Copy, CreditCard, DollarSign, FileText, Landmark, Minus, Plus,
  ShieldCheck, Smartphone, Upload,
} from 'lucide-react';
import StripePaymentForm from '@/components/StripePaymentForm';
import { PENDING_REDIRECT_KEY } from '@/components/orders/ClearCartOnReturn';

export type PaymentMethod = 'stripe' | 'binance' | 'pago_movil' | 'transferencia' | 'zelle' | 'binance_pay_id';

const MANUAL: PaymentMethod[] = ['pago_movil', 'transferencia', 'zelle', 'binance_pay_id'];
const isManual = (m: PaymentMethod) => MANUAL.includes(m);

/** One payment leg as sent to POST /api/orders. `proof` is uploaded as multipart `proof_<index>`. */
export interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  reference: string;
  proof: File | null;
}

type Credentials = Record<string, string | boolean>;

interface PaymentConfig {
  methods: PaymentMethod[];
  credentials: Partial<Record<PaymentMethod, Credentials | null>>;
  ves_rate: number;
  instructions: string;
}

interface Props {
  total: number;
  customer: { name: string; email: string };
  /** Creates the order server-side and returns its id. */
  createOrder: (entries: PaymentEntry[]) => Promise<string>;
  /** Order is placed (paid, or proof sent): clear cart and go to confirmation. */
  onComplete: (orderId: string) => void;
  onBack: () => void;
}

const ICONS: Record<PaymentMethod, React.ComponentType<{ size?: number }>> = {
  stripe: CreditCard,
  binance: Bitcoin,
  pago_movil: Smartphone,
  transferencia: Landmark,
  zelle: DollarSign,
  binance_pay_id: Bitcoin,
};

// Which credential fields to show per manual method, in order, with their i18n label key.
const FIELDS: Record<string, Array<[string, string]>> = {
  pago_movil:     [['bank', 'bank'], ['phone', 'phone'], ['id_number', 'idNumber'], ['holder', 'holder']],
  transferencia:  [['bank', 'bank'], ['account_number', 'accountNumber'], ['account_type', 'accountType'], ['id_number', 'idNumber'], ['holder', 'holder']],
  zelle:          [['email', 'email'], ['phone', 'phone'], ['holder', 'holder']],
  binance_pay_id: [['pay_id', 'payId'], ['email', 'email'], ['holder', 'holder']],
};

const BS_METHODS: PaymentMethod[] = ['pago_movil', 'transferencia'];
const MAX_PROOF = 4 * 1024 * 1024;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Downscale large photos so two proofs fit comfortably in one request. PDFs pass through. */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < 900 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

function CopyValue({ value }: { value: string }) {
  const t = useTranslations('checkout.pay');
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={`pay-copy${copied ? ' is-copied' : ''}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch { /* clipboard blocked */ }
      }}
      aria-label={`${t('copy')} ${value}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? t('copied') : t('copy')}</span>
    </button>
  );
}

function CredentialBox({ method, creds, amount, vesRate }: { method: PaymentMethod; creds: Credentials; amount: number; vesRate: number }) {
  const t = useTranslations('checkout.pay');
  const rows = (FIELDS[method] ?? []).filter(([k]) => String(creds[k] ?? '').trim());
  const showBs = vesRate > 0 && BS_METHODS.includes(method);
  return (
    <div className="pay-creds">
      <p className="pay-creds-title">{t('sendTo')}</p>
      <dl className="pay-creds-list">
        {rows.map(([key, label]) => (
          <div key={key} className="pay-creds-row">
            <dt>{t(`fields.${label}`)}</dt>
            <dd>
              <span>{String(creds[key])}</span>
              <CopyValue value={String(creds[key])} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="pay-creds-amount">
        <div>
          <span className="pay-creds-amount-label">{t('amountUsd')}</span>
          <strong>${amount.toFixed(2)}</strong>
        </div>
        {showBs && (
          <div>
            <span className="pay-creds-amount-label">{t('amountBs', { rate: vesRate.toLocaleString('es-VE') })}</span>
            <strong>
              Bs. {(amount * vesRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            <CopyValue value={(amount * vesRate).toFixed(2)} />
          </div>
        )}
      </div>
    </div>
  );
}

function ProofInput({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const t = useTranslations('checkout.pay');
  const ref = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const preview = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  return (
    <div className="pay-proof">
      <span className="pay-field-label">{t('proof')}</span>
      <input
        ref={ref}
        type="file"
        accept="image/*,application/pdf"
        hidden
        onChange={async e => {
          const raw = e.target.files?.[0];
          e.target.value = '';
          if (!raw) return;
          const f = await compressImage(raw);
          if (f.size > MAX_PROOF) { setError(t('proofTooLarge')); return; }
          setError('');
          onChange(f);
        }}
      />
      <button type="button" className={`pay-proof-drop${file ? ' has-file' : ''}`} onClick={() => ref.current?.click()}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="pay-proof-thumb" />
        ) : file ? (
          <FileText size={22} />
        ) : (
          <Upload size={20} />
        )}
        <span className="pay-proof-text">
          <strong>{file ? file.name : t('proofUpload')}</strong>
          {file && <small>{t('proofChange')}</small>}
        </span>
      </button>
      {error && <p className="pay-error">{error}</p>}
    </div>
  );
}

export default function PaymentStep({ total, customer, createOrder, onComplete, onBack }: Props) {
  const t = useTranslations('checkout.pay');
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  // Card orders are created once and reused if the card is declined and retried.
  const cardOrderId = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/payment-config')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then((cfg: PaymentConfig) => {
        if (!alive) return;
        setConfig(cfg);
        if (cfg.methods[0]) setEntries([{ method: cfg.methods[0], amount: total, reference: '', proof: null }]);
      })
      .catch(() => alive && setConfigError(true));
    return () => { alive = false; };
  }, [total]);

  const split = entries.length === 2;
  const primary = entries[0];
  const manualAvailable = config?.methods.filter(isManual) ?? [];

  const update = (idx: number, patch: Partial<PaymentEntry>) => {
    setError('');
    setEntries(prev => {
      const next = prev.map((e, i) => (i === idx ? { ...e, ...patch } : e));
      if (patch.amount !== undefined && next.length === 2) {
        next[1 - idx] = { ...next[1 - idx], amount: round2(Math.max(0, total - patch.amount)) };
      }
      return next;
    });
  };

  const selectMethod = (idx: number, method: PaymentMethod) => {
    cardOrderId.current = null;
    if (!isManual(method) && split) {
      setEntries([{ method, amount: total, reference: '', proof: null }]);
      return;
    }
    update(idx, { method, reference: '', proof: null });
  };

  const enableSplit = () => {
    const other = manualAvailable.find(m => m !== primary.method) ?? manualAvailable[0];
    const half = round2(total / 2);
    setEntries([
      { ...primary, amount: half },
      { method: other, amount: round2(total - half), reference: '', proof: null },
    ]);
  };

  const disableSplit = () => setEntries([{ ...primary, amount: total }]);

  const covered = round2(entries.reduce((s, e) => s + e.amount, 0));

  const submitManual = async () => {
    for (const e of entries) {
      if (!e.reference.trim()) return setError(t('errors.missingReference'));
      if (!e.proof) return setError(t('errors.missingProof'));
    }
    if (Math.abs(covered - total) > 0.01) return setError(t('errors.splitMismatch'));
    setBusy(true);
    try {
      const id = await createOrder(entries);
      onComplete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.order'));
      setBusy(false);
    }
  };

  const payWithBinance = async () => {
    setBusy(true);
    setError('');
    try {
      const id = await createOrder(entries);
      const res = await fetch('/api/payments/binance/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || t('errors.generic'));
      try { sessionStorage.setItem(PENDING_REDIRECT_KEY, id); } catch { /* storage unavailable */ }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
      setBusy(false);
    }
  };

  const getCardClientSecret = async () => {
    if (!cardOrderId.current) cardOrderId.current = await createOrder(entries);
    const res = await fetch('/api/payments/stripe/intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: cardOrderId.current }),
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) throw new Error(data.error || t('errors.generic'));
    return data.clientSecret as string;
  };

  const onCardPaid = async () => {
    const id = cardOrderId.current;
    if (!id) return;
    setBusy(true);
    // Webhook settles it too; this makes the confirmation page show "paid" right away.
    await fetch('/api/payments/stripe/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    }).catch(() => null);
    onComplete(id);
  };

  return (
    <div className="pay-step">
      <button type="button" className="pay-back" onClick={onBack}>
        <ArrowLeft size={15} /> {t('back')}
      </button>
      <h2 className="pay-title">{t('title')}</h2>

      {!config && !configError && <div className="pay-skeleton" aria-busy="true">{t('loading')}</div>}
      {(configError || (config && config.methods.length === 0)) && <p className="pay-empty">{t('none')}</p>}

      {config && primary && entries.map((entry, idx) => {
        const options = idx === 1 ? manualAvailable : config.methods;
        const creds = config.credentials[entry.method];
        return (
          <section key={idx} className="pay-leg">
            {split && <p className="pay-leg-label">{t('splitLabel', { n: idx + 1 })}</p>}

            <div className="pay-methods" role="radiogroup" aria-label={t('title')}>
              {options.map(m => {
                const Icon = ICONS[m];
                const active = entry.method === m;
                const taken = split && entries[1 - idx]?.method === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={taken || busy}
                    className={`pay-method${active ? ' is-active' : ''}`}
                    onClick={() => selectMethod(idx, m)}
                  >
                    <span className="pay-method-icon"><Icon size={18} /></span>
                    <span className="pay-method-text">
                      <strong>{t(`methods.${m}`)}</strong>
                      <small>{t(`hints.${m}`)}</small>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pay-panel" key={entry.method}>
              {split && (
                <label className="pay-amount">
                  <span className="pay-field-label">{t('amount')}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={total}
                    step={0.01}
                    value={entry.amount}
                    onChange={e => update(idx, { amount: round2(Math.min(total, parseFloat(e.target.value) || 0)) })}
                  />
                </label>
              )}

              {isManual(entry.method) && creds && (
                <>
                  <CredentialBox method={entry.method} creds={creds} amount={entry.amount} vesRate={config.ves_rate} />
                  <label className="pay-reference">
                    <span className="pay-field-label">{t('reference')}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder={t('referencePlaceholder')}
                      value={entry.reference}
                      maxLength={100}
                      onChange={e => update(idx, { reference: e.target.value })}
                    />
                  </label>
                  <ProofInput file={entry.proof} onChange={f => update(idx, { proof: f })} />
                </>
              )}

              {entry.method === 'stripe' && (
                <StripePaymentForm
                  amount={entry.amount}
                  getClientSecret={getCardClientSecret}
                  onSuccess={onCardPaid}
                  onError={() => {}}
                  billing={customer}
                  loading={busy}
                />
              )}

              {entry.method === 'binance' && (
                <button type="button" className="pay-submit pay-submit--binance" onClick={payWithBinance} disabled={busy}>
                  <Bitcoin size={17} /> {busy ? t('redirecting') : t('payBinance')}
                </button>
              )}
            </div>
          </section>
        );
      })}

      {config && primary && isManual(primary.method) && manualAvailable.length > 1 && (
        <button type="button" className="pay-split-toggle" onClick={split ? disableSplit : enableSplit} disabled={busy}>
          {split ? <Minus size={14} /> : <Plus size={14} />} {split ? t('splitRemove') : t('split')}
        </button>
      )}

      {split && (
        <div className={`pay-covered${Math.abs(covered - total) <= 0.01 ? ' is-ok' : ''}`}>
          <span>{t('covered')}</span>
          <strong>${covered.toFixed(2)} / ${total.toFixed(2)}</strong>
        </div>
      )}

      {config?.instructions && primary && isManual(primary.method) && (
        <p className="pay-instructions">{config.instructions}</p>
      )}

      {primary && isManual(primary.method) && (
        <>
          <p className="pay-hint"><ShieldCheck size={14} /> {t('proofHint')}</p>
          <button type="button" className="pay-submit" onClick={submitManual} disabled={busy}>
            {busy ? t('processing') : t('confirmManual')}
          </button>
        </>
      )}

      {error && <div className="pay-error" role="alert">{error}</div>}
    </div>
  );
}
