'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bitcoin, CheckCircle2, CircleAlert, DollarSign, Landmark, Smartphone } from 'lucide-react';
import '@/styles/payments-admin.css';

type MethodKey = 'pago_movil' | 'transferencia' | 'zelle' | 'binance_pay_id';
type Settings = Record<MethodKey, Record<string, string | boolean>> & { ves_rate: number; instructions: string };
interface Gateways { stripe: boolean; stripe_webhook: boolean; binance: boolean }

// Field key → label key in checkout.pay.fields
const FIELDS: Record<MethodKey, Array<[string, string]>> = {
  pago_movil:     [['bank', 'bank'], ['phone', 'phone'], ['id_number', 'idNumber'], ['holder', 'holder']],
  transferencia:  [['bank', 'bank'], ['account_number', 'accountNumber'], ['account_type', 'accountType'], ['id_number', 'idNumber'], ['holder', 'holder']],
  zelle:          [['email', 'email'], ['phone', 'phone'], ['holder', 'holder']],
  binance_pay_id: [['pay_id', 'payId'], ['email', 'email'], ['holder', 'holder']],
};
const ICONS: Record<MethodKey, React.ComponentType<{ size?: number }>> = {
  pago_movil: Smartphone, transferencia: Landmark, zelle: DollarSign, binance_pay_id: Bitcoin,
};

export default function PaymentSettingsForm() {
  const t = useTranslations('payments.settings');
  const tp = useTranslations('checkout.pay');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [gateways, setGateways] = useState<Gateways | null>(null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/admin/payment-config')
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { setSettings(d.settings); setGateways(d.gateways); })
      .catch(() => setState('error'));
  }, []);

  if (!settings) return <p className="pv-muted">{state === 'error' ? t('saveError') : '…'}</p>;

  const set = (method: MethodKey, key: string, value: string | boolean) => {
    setState('idle');
    setSettings(s => (s ? { ...s, [method]: { ...s[method], [key]: value } } : s));
  };

  const save = async () => {
    setState('saving');
    const res = await fetch('/api/admin/payment-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch(() => null);
    if (res?.ok) {
      setSettings((await res.json()).settings);
      setState('saved');
    } else {
      setState('error');
    }
  };

  return (
    <div className="ps">
      <p className="pv-muted">{t('intro')}</p>

      {gateways && (
        <section className="ps-gateways">
          <p className="ps-section-title">{t('gateways')}</p>
          {([
            ['Stripe', gateways.stripe],
            [t('stripeWebhook'), gateways.stripe_webhook],
            ['Binance Pay API', gateways.binance],
          ] as Array<[string, boolean]>).map(([label, on]) => (
            <span key={label} className={`ps-gateway${on ? ' is-on' : ''}`}>
              {on ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />} {label}: {on ? t('gatewayOn') : t('gatewayOff')}
            </span>
          ))}
        </section>
      )}

      <div className="ps-grid">
        {(Object.keys(FIELDS) as MethodKey[]).map(m => {
          const Icon = ICONS[m];
          const enabled = Boolean(settings[m].enabled);
          return (
            <section key={m} className={`ps-card${enabled ? ' is-enabled' : ''}`}>
              <header className="ps-card-head">
                <span className="ps-card-icon"><Icon size={17} /></span>
                <strong>{tp(`methods.${m}`)}</strong>
                <label className="ps-switch">
                  <input type="checkbox" checked={enabled} onChange={e => set(m, 'enabled', e.target.checked)} />
                  <span aria-hidden="true" />
                  <span className="ps-switch-label">{t('enabled')}</span>
                </label>
              </header>
              {m === 'binance_pay_id' && <p className="ps-note">{t('binanceManualNote')}</p>}
              {FIELDS[m].map(([key, label]) => (
                <label key={key} className="ps-field">
                  <span>{tp(`fields.${label}`)}</span>
                  <input value={String(settings[m][key] ?? '')} onChange={e => set(m, key, e.target.value)} />
                </label>
              ))}
            </section>
          );
        })}
      </div>

      <div className="ps-grid">
        <label className="ps-field">
          <span>{t('vesRate')}</span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={settings.ves_rate}
            onChange={e => { setState('idle'); setSettings(s => (s ? { ...s, ves_rate: parseFloat(e.target.value) || 0 } : s)); }}
          />
        </label>
        <label className="ps-field">
          <span>{t('instructions')}</span>
          <textarea
            rows={3}
            value={settings.instructions}
            onChange={e => { setState('idle'); setSettings(s => (s ? { ...s, instructions: e.target.value } : s)); }}
          />
        </label>
      </div>

      <div className="ps-save">
        <button className="pv-btn pv-btn--verify" onClick={save} disabled={state === 'saving'}>
          {state === 'saving' ? '…' : t('save')}
        </button>
        {state === 'saved' && <span className="ps-saved"><CheckCircle2 size={14} /> {t('saved')}</span>}
        {state === 'error' && <span className="pv-error">{t('saveError')}</span>}
      </div>
    </div>
  );
}
