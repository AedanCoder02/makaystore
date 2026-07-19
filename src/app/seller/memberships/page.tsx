'use client';

import { useState, useEffect } from 'react';
import { Crown, Check, Users } from 'lucide-react';

interface Client { id: string; name: string; email: string; tier?: string }
interface Tier { key: string; label: string; price: number; description: string; color: string }

const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574', free: '#A89080',
};

export default function SellerMembershipsPage() {
  const [tiers, setTiers]   = useState<Tier[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTier, setSelectedTier]   = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [payment, setPayment] = useState('cash');
  const [notes, setNotes]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/memberships').then(r => r.json()).then(setTiers).catch(() => {});
    fetch('/api/seller/clients').then(r => r.ok ? r.json() : []).then(setClients).catch(() => {});
    fetch('/api/memberships/stats').then(r => r.ok ? r.json() : null).then((d: any) => setRecentSales(d?.recent ?? [])).catch(() => {});
  }, []);

  const filteredClients = clients.filter(c =>
    !clientSearch || c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleSell = async () => {
    if (!selectedTier || (!selectedClient && !clientSearch)) return;
    setSubmitting(true); setError('');
    const tier = tiers.find(t => t.key === selectedTier);
    try {
      const res = await fetch('/api/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedTier,
          customer_id:    selectedClient?.id ?? null,
          customer_email: selectedClient?.email ?? clientSearch,
          customer_name:  selectedClient?.name ?? clientSearch,
          payment_method: payment,
          notes,
          price: tier?.price,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSuccess(`${tier?.label} membership sold to ${selectedClient?.name ?? clientSearch}`);
      setSelectedClient(null); setClientSearch(''); setSelectedTier(''); setNotes('');
      // Refresh recent sales
      fetch('/api/memberships/stats').then(r => r.json()).then(d => setRecentSales(d.recent ?? [])).catch(() => {});
    } catch (e: any) {
      setError(e.message ?? 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Sell Membership</h1>
          <p className="seller-page-sub">Upgrade a client to a paid beach club membership tier.</p>
        </div>
      </div>

      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Check size={16} /> {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '0.875rem 1.25rem', marginBottom: '1.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', color: '#991b1b' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        {/* Step 1: Choose tier */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--makay-mauve)', marginBottom: '0.875rem' }}>
            1. Select Tier
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {tiers.map(tier => (
              <button key={tier.key} onClick={() => setSelectedTier(tier.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                  background: selectedTier === tier.key ? 'var(--makay-dark-navy)' : '#fff',
                  border: `1.5px solid ${selectedTier === tier.key ? 'var(--makay-dark-navy)' : 'var(--makay-sand-cream)'}`,
                  borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                <Crown size={20} style={{ color: tier.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '0.95rem', fontWeight: 700, color: selectedTier === tier.key ? '#fff' : 'var(--makay-dark-navy)', margin: 0 }}>{tier.label}</p>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: selectedTier === tier.key ? 'rgba(255,255,255,0.6)' : 'var(--makay-mauve)', margin: 0, marginTop: '0.2rem' }}>{tier.description}</p>
                </div>
                <span style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.1rem', fontWeight: 700, color: selectedTier === tier.key ? '#fff' : tier.color, flexShrink: 0 }}>
                  ${tier.price}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Choose client */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--makay-mauve)', marginBottom: '0.875rem' }}>
            2. Select Client
          </h2>
          <input className="seller-search" style={{ marginBottom: '0.75rem' }} placeholder="Search by name or email…"
            value={clientSearch} onChange={e => { setClientSearch(e.target.value); setSelectedClient(null); }} />

          {selectedClient && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(44,44,44,0.05)', borderRadius: 10, marginBottom: '0.75rem' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--makay-peachy-rose)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.9rem' }}>{selectedClient.name[0]}</span>
              <div>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--makay-dark-navy)', margin: 0 }}>{selectedClient.name}</p>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: 0 }}>{selectedClient.email}</p>
                {selectedClient.tier && selectedClient.tier !== 'free' && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: TIER_COLOR[selectedClient.tier] ?? '#ccc', textTransform: 'capitalize' }}>Current: {selectedClient.tier}</span>
                )}
              </div>
              <button onClick={() => setSelectedClient(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--makay-mauve)', fontSize: '1.1rem' }}>×</button>
            </div>
          )}

          {!selectedClient && (
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {filteredClients.slice(0, 20).map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setClientSearch(c.name); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.875rem', background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 8, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--makay-sand-cream)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.8rem', color: 'var(--makay-mauve)', flexShrink: 0 }}>{c.name[0]}</span>
                  <div>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--makay-dark-navy)', margin: 0 }}>{c.name}</p>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-mauve)', margin: 0 }}>{c.email}</p>
                  </div>
                </button>
              ))}
              {filteredClients.length === 0 && clientSearch && (
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', padding: '0.5rem' }}>
                  No existing client found — will sell to email: <strong>{clientSearch}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment + confirm */}
      {selectedTier && (selectedClient || clientSearch) && (
        <div style={{ background: '#fff', border: '1.5px solid var(--makay-peachy-rose)', borderRadius: 14, padding: '1.5rem', maxWidth: 480 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--makay-dark-navy)', marginBottom: '1.25rem' }}>Confirm Sale</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div>
              <label className="seller-label">Payment Method</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['cash', 'card', 'transfer'].map(m => (
                  <button key={m} onClick={() => setPayment(m)} className={`seller-payment-btn${payment === m ? ' selected' : ''}`} style={{ textTransform: 'capitalize' }}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="seller-label">Notes (optional)</label>
              <textarea className="seller-textarea sm" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any notes…" />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--makay-sand-cream)', paddingTop: '0.875rem' }}>
              <div>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>Total</p>
                <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--makay-peachy-rose)', margin: 0 }}>
                  ${tiers.find(t => t.key === selectedTier)?.price ?? 0}
                </p>
              </div>
              <button className="seller-btn-primary" onClick={handleSell} disabled={submitting}>
                {submitting ? 'Processing…' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent membership sales */}
      {recentSales.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--makay-mauve)', marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={13} /> Recent Sales
          </h2>
          <div className="sp-table-wrap">
            <table className="sp-table">
              <thead><tr><th>Client</th><th>Tier</th><th>Payment</th><th>Price</th><th>Date</th></tr></thead>
              <tbody>
                {recentSales.slice(0, 10).map((s: any) => (
                  <tr key={s.id} className="sp-row">
                    <td><span className="sp-title">{s.customer_name || s.customer_email || '—'}</span></td>
                    <td><span style={{ fontWeight: 700, textTransform: 'capitalize', color: TIER_COLOR[s.tier] ?? 'inherit' }}>{s.tier}</span></td>
                    <td className="sp-cat" style={{ textTransform: 'capitalize' }}>{s.payment_method}</td>
                    <td style={{ fontWeight: 600 }}>${Number(s.price).toFixed(2)}</td>
                    <td className="sp-sku">{new Date(s.sold_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
