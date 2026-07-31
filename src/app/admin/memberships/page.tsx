'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Crown, TrendingUp, Users, Percent, Edit2, Check, X, Star, Coins, DollarSign, Calendar, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Stats {
  distribution: { tier: string; count: number }[];
  recent: { id: number; customer_name: string; customer_email: string; tier: string; price: number; payment_method: string; sold_at: string }[];
  revenue: { tier: string; sales: number; revenue: number }[];
}

interface TierConfig {
  tier: string;
  label: string;
  color: string;
  discount_percent: number;
  description: string;
}

interface MemberRow {
  id: number;
  clerk_id: string;
  membership_tier: string;
  discount_override: number | null;
  wallet_points: number;
  dollar_balance: number;
  created_at: string;
}

interface WalletConfig {
  pts_per_dollar: number;
  default_credit_interest: number;
}

const TIER_COLOR: Record<string, string> = {
  free: '#A89080', bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574',
};

const TIER_ORDER = ['free', 'bronze', 'silver', 'gold', 'vip'];

type Tab = 'overview' | 'discounts' | 'members' | 'config';

export default function AdminMembershipsPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [tierConfig, setTierConfig] = useState<TierConfig[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [walletConfig, setWalletConfig] = useState<WalletConfig | null>(null);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingWallet, setSavingWallet] = useState(false);

  const [configDraft, setConfigDraft] = useState<Record<string, number>>({});
  const [walletDraft, setWalletDraft] = useState({ pts_per_dollar: 10, default_credit_interest: 5 });

  const [editingOverride, setEditingOverride] = useState<number | null>(null);
  const [overrideDraft, setOverrideDraft] = useState<Record<number, string>>({});
  const [tierDraft, setTierDraft] = useState<Record<number, string>>({});
  const [savingMember, setSavingMember] = useState<number | null>(null);

  const [creditTarget, setCreditTarget] = useState<number | null>(null);
  const [creditMode, setCreditMode] = useState<'points' | 'dollar'>('points');
  const [creditPoints, setCreditPoints] = useState('');
  const [creditDesc, setCreditDesc] = useState('');
  const [dollarAmount, setDollarAmount] = useState('');
  const [dollarInterest, setDollarInterest] = useState('');
  const [dollarDueDate, setDollarDueDate] = useState('');
  const [dollarNotes, setDollarNotes] = useState('');
  const [creditSaving, setCreditSaving] = useState(false);

  const [toast, setToast] = useState('');
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    fetch('/api/memberships/stats')
      .then(r => r.ok ? r.json() : null)
      .then((d: Stats | null) => { setStats(d); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, []);

  const loadConfig = useCallback(() => {
    if (tierConfig.length) return;
    setLoadingConfig(true);
    fetch('/api/admin/membership-config')
      .then(r => r.ok ? r.json() : [])
      .then((d: TierConfig[]) => {
        const sorted = TIER_ORDER.map(t => d.find(c => c.tier === t)).filter(Boolean) as TierConfig[];
        setTierConfig(sorted);
        const draft: Record<string, number> = {};
        for (const c of sorted) draft[c.tier] = c.discount_percent;
        setConfigDraft(draft);
        setLoadingConfig(false);
      })
      .catch(() => setLoadingConfig(false));
  }, [tierConfig.length]);

  const loadMembers = useCallback(() => {
    if (members.length) return;
    setLoadingMembers(true);
    fetch('/api/admin/members')
      .then(r => r.ok ? r.json() : [])
      .then((d: MemberRow[]) => { setMembers(d); setLoadingMembers(false); })
      .catch(() => setLoadingMembers(false));
  }, [members.length]);

  const loadWalletConfig = useCallback(() => {
    if (walletConfig) return;
    fetch('/api/admin/wallet-config')
      .then(r => r.ok ? r.json() : null)
      .then((d: WalletConfig | null) => {
        if (!d) return;
        setWalletConfig(d);
        setWalletDraft({
          pts_per_dollar: d.pts_per_dollar,
          default_credit_interest: Math.round(d.default_credit_interest * 100),
        });
      })
      .catch(() => {});
  }, [walletConfig]);

  useEffect(() => {
    if (tab === 'discounts') loadConfig();
    if (tab === 'members') loadMembers();
    if (tab === 'config') loadWalletConfig();
  }, [tab, loadConfig, loadMembers, loadWalletConfig]);

  const saveConfig = async () => {
    setSavingConfig(true);
    const payload = Object.entries(configDraft).map(([tier, discount_percent]) => ({ tier, discount_percent }));
    const res = await fetch('/api/admin/membership-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const updated: TierConfig[] = await res.json();
      const sorted = TIER_ORDER.map(t => updated.find(c => c.tier === t)).filter(Boolean) as TierConfig[];
      setTierConfig(sorted);
      showToast('Discount rates saved.');
    }
    setSavingConfig(false);
  };

  const saveWalletConfig = async () => {
    setSavingWallet(true);
    const res = await fetch('/api/admin/wallet-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pts_per_dollar: walletDraft.pts_per_dollar,
        default_credit_interest: walletDraft.default_credit_interest / 100,
      }),
    });
    if (res.ok) {
      const updated: WalletConfig = await res.json();
      setWalletConfig(updated);
      showToast('Wallet config saved.');
    }
    setSavingWallet(false);
  };

  const saveMember = async (profileId: number) => {
    setSavingMember(profileId);
    const body: Record<string, unknown> = {};
    if (tierDraft[profileId]) body.membership_tier = tierDraft[profileId];
    const rawOverride = overrideDraft[profileId];
    if (rawOverride !== undefined) {
      body.discount_override = rawOverride === '' ? null : parseInt(rawOverride, 10);
    }
    const res = await fetch(`/api/admin/members/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated: MemberRow = await res.json();
      setMembers(prev => prev.map(m => m.id === profileId ? { ...m, ...updated } : m));
      setEditingOverride(null);
      showToast('Member updated.');
    }
    setSavingMember(null);
  };

  const resetCredit = () => {
    setCreditTarget(null);
    setCreditMode('points');
    setCreditPoints('');
    setCreditDesc('');
    setDollarAmount('');
    setDollarInterest('');
    setDollarDueDate('');
    setDollarNotes('');
  };

  const issuePoints = async (profileId: number) => {
    const pts = parseInt(creditPoints, 10);
    if (!pts || pts <= 0) return;
    setCreditSaving(true);
    const res = await fetch('/api/admin/wallet/credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, points: pts, description: creditDesc || 'Admin credit' }),
    });
    if (res.ok) {
      const { wallet_points } = await res.json();
      setMembers(prev => prev.map(m => m.id === profileId ? { ...m, wallet_points } : m));
      resetCredit();
      showToast(`${pts} points credited.`);
    }
    setCreditSaving(false);
  };

  const issueDollarCredit = async (profileId: number) => {
    const amount = parseFloat(dollarAmount);
    const interestRate = (parseFloat(dollarInterest) || 5) / 100;
    if (!amount || amount <= 0 || !dollarDueDate) return;
    setCreditSaving(true);
    const res = await fetch('/api/admin/credit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profileId,
        principal: amount,
        interest_rate: interestRate,
        due_date: dollarDueDate,
        notes: dollarNotes || undefined,
      }),
    });
    if (res.ok) {
      const { dollar_balance } = await res.json();
      setMembers(prev => prev.map(m => m.id === profileId ? { ...m, dollar_balance } : m));
      resetCredit();
      showToast(`$${amount.toFixed(2)} credit line issued.`);
    }
    setCreditSaving(false);
  };

  const totalMembers = stats?.distribution.reduce((s, d) => s + Number(d.count), 0) ?? 0;
  const paidMembers  = stats?.distribution.filter(d => d.tier !== 'free').reduce((s, d) => s + Number(d.count), 0) ?? 0;
  const totalRevenue = stats?.revenue.reduce((s, r) => s + Number(r.revenue), 0) ?? 0;
  const pieData = (stats?.distribution ?? []).map(d => ({
    name: d.tier.charAt(0).toUpperCase() + d.tier.slice(1),
    value: Number(d.count),
    color: TIER_COLOR[d.tier] ?? '#ccc',
  }));

  const sectionCard: React.CSSProperties = { background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 16, padding: '1.5rem' };
  const heading: React.CSSProperties = { fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1rem' };
  const fieldLabel: React.CSSProperties = { fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--makay-mauve)', display: 'block', marginBottom: '0.35rem' };
  const fieldInput: React.CSSProperties = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid var(--makay-sand-cream)', fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', color: 'var(--makay-dark-navy)', boxSizing: 'border-box' };
  const fieldHint: React.CSSProperties = { fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-mauve)', marginTop: '0.3rem', marginBottom: 0 };
  const TAB_LABELS: Record<Tab, string> = { overview: 'Overview', discounts: 'Discounts', members: 'Members', config: 'Wallet Config' };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700 }}>Memberships</h1>
        </div>

        {toast && <div className="admin-toast">{toast}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--makay-sand-cream)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
          {(['overview', 'discounts', 'members', 'config'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700,
              padding: '0.45rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--makay-dark-navy)' : 'transparent',
              color: tab === t ? '#fff' : 'var(--makay-mauve)',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {t === 'config' && <Settings size={12} />}
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          loadingStats ? <p className="admin-loading">Loading…</p> : <>
            <div className="admin-stats-strip" style={{ marginBottom: '2rem' }}>
              <div className="admin-stat-chip"><Users size={14} /> {totalMembers} total profiles</div>
              <div className="admin-stat-chip"><Crown size={14} /> {paidMembers} paid members</div>
              <div className="admin-stat-chip"><TrendingUp size={14} /> ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} membership revenue</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={sectionCard}>
                <h3 style={heading}>Tier Distribution</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} members`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', padding: '2rem 0' }}>No member profiles yet.</p>
                )}
              </div>
              <div style={sectionCard}>
                <h3 style={heading}>Revenue by Tier</h3>
                {(stats?.revenue ?? []).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {(stats?.revenue ?? []).map(r => (
                      <div key={r.tier} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: TIER_COLOR[r.tier] ?? '#ccc', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--makay-dark-navy)', textTransform: 'capitalize', flex: 1 }}>{r.tier}</span>
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}>{r.sales} sales</span>
                        <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, color: 'var(--makay-peachy-rose)' }}>${Number(r.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: 'center', color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', padding: '2rem 0' }}>No membership sales yet.</p>
                )}
              </div>
            </div>
            {(stats?.recent ?? []).length > 0 && (
              <div style={{ ...sectionCard, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--makay-sand-cream)' }}>
                  <h3 style={{ ...heading, marginBottom: 0 }}>Recent Membership Sales</h3>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Client</th><th>Tier</th><th>Payment</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {(stats?.recent ?? []).map(s => (
                      <tr key={s.id}>
                        <td className="admin-user-cell"><span>{s.customer_name || s.customer_email || '—'}</span></td>
                        <td><span style={{ fontWeight: 700, textTransform: 'capitalize', color: TIER_COLOR[s.tier] ?? 'inherit' }}>{s.tier}</span></td>
                        <td><span className="admin-payment-badge" style={{ textTransform: 'capitalize' }}>{s.payment_method}</span></td>
                        <td className="admin-amount">${Number(s.price).toFixed(2)}</td>
                        <td className="admin-date">{new Date(s.sold_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* DISCOUNTS */}
        {tab === 'discounts' && (
          loadingConfig ? <p className="admin-loading">Loading…</p> : (
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h3 style={{ ...heading, marginBottom: 0 }}><Percent size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />Global Discount Rates</h3>
                <button onClick={saveConfig} disabled={savingConfig} style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--makay-dark-navy)', color: '#fff' }}>
                  {savingConfig ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', marginBottom: '1.5rem' }}>
                These percentages apply automatically at checkout for all members of each tier, unless overridden individually in the Members tab.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {tierConfig.map(c => (
                  <div key={c.tier} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', background: 'var(--makay-sand-cream)', borderRadius: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--makay-dark-navy)', margin: 0, textTransform: 'capitalize' }}>{c.label}</p>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: 0 }}>{c.description}</p>
                    </div>
                    {c.tier === 'vip' ? (
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', fontStyle: 'italic' }}>Per-user override only</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input type="number" min={0} max={100} value={configDraft[c.tier] ?? c.discount_percent}
                          onChange={e => setConfigDraft(prev => ({ ...prev, [c.tier]: parseInt(e.target.value, 10) || 0 }))}
                          style={{ width: 64, padding: '0.35rem 0.5rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', fontFamily: 'var(--font-montserrat)', fontSize: '0.88rem', fontWeight: 700, textAlign: 'center', color: 'var(--makay-dark-navy)' }} />
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, color: 'var(--makay-dark-navy)', fontSize: '0.88rem' }}>%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* MEMBERS */}
        {tab === 'members' && (
          loadingMembers ? <p className="admin-loading">Loading…</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {members.length === 0 && (
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-mauve)', padding: '2rem', textAlign: 'center' }}>No members yet.</p>
              )}
              {members.map(m => {
                const isEditing = editingOverride === m.id;
                const currentTier = tierDraft[m.id] ?? m.membership_tier;
                const overrideVal = overrideDraft[m.id] ?? (m.discount_override !== null ? String(m.discount_override) : '');
                const isSaving = savingMember === m.id;

                return (
                  <div key={m.id} style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 12, padding: '0.875rem 1.125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>ID #{m.id} · {new Date(m.created_at).toLocaleDateString()}</p>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: 0, wordBreak: 'break-all' }}>{m.clerk_id}</p>
                      </div>

                      <select value={currentTier} onChange={e => setTierDraft(prev => ({ ...prev, [m.id]: e.target.value }))}
                        style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, padding: '0.35rem 0.6rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', color: TIER_COLOR[currentTier] ?? 'inherit', cursor: 'pointer' }}>
                        {TIER_ORDER.map(t => <option key={t} value={t} style={{ color: TIER_COLOR[t] }}>{t}</option>)}
                      </select>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-dark-navy)', fontWeight: 600 }}>
                        <Star size={13} color="#D4AF37" /> {m.wallet_points} pts
                      </div>

                      {Number(m.dollar_balance) > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: '#16a34a', fontWeight: 600 }}>
                          <DollarSign size={13} /> {Number(m.dollar_balance).toFixed(2)}
                        </div>
                      )}

                      {isEditing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <input type="number" min={0} max={100} placeholder="Override %" value={overrideVal}
                            onChange={e => setOverrideDraft(prev => ({ ...prev, [m.id]: e.target.value }))}
                            style={{ width: 80, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem' }} />
                          <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)' }}>%</span>
                        </div>
                      ) : (
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', minWidth: 80 }}>
                          {m.discount_override !== null ? `${m.discount_override}% override` : 'tier default'}
                        </span>
                      )}

                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {isEditing ? (
                          <>
                            <button onClick={() => saveMember(m.id)} disabled={isSaving} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: 'none', background: 'var(--makay-dark-navy)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem' }}>
                              <Check size={12} /> {isSaving ? '…' : 'Save'}
                            </button>
                            <button onClick={() => { setEditingOverride(null); setOverrideDraft(p => { const n = {...p}; delete n[m.id]; return n; }); setTierDraft(p => { const n = {...p}; delete n[m.id]; return n; }); }}
                              style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setEditingOverride(m.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)' }}>
                              <Edit2 size={11} /> Edit
                            </button>
                            <button onClick={() => { setCreditTarget(m.id); setCreditMode('points'); }}
                              style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #D4AF37', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: '#D4AF37' }}>
                              <Coins size={11} /> Credit
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {creditTarget === m.id && (
                      <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--makay-sand-cream)', borderRadius: 10 }}>
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.875rem' }}>
                          {(['points', 'dollar'] as const).map(mode => (
                            <button key={mode} onClick={() => setCreditMode(mode)} style={{
                              fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700,
                              padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                              background: creditMode === mode ? 'var(--makay-dark-navy)' : 'rgba(0,0,0,0.06)',
                              color: creditMode === mode ? '#fff' : 'var(--makay-mauve)',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                              {mode === 'points' ? <><Star size={10} /> Points</> : <><DollarSign size={10} /> $ Credit Line</>}
                            </button>
                          ))}
                          <button onClick={resetCredit} style={{ marginLeft: 'auto', padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #e5e0d8', background: 'transparent', cursor: 'pointer' }}>
                            <X size={12} />
                          </button>
                        </div>

                        {creditMode === 'points' ? (
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="number" min={1} placeholder="Points" value={creditPoints} onChange={e => setCreditPoints(e.target.value)}
                              style={{ width: 90, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #e5e0d8', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem' }} />
                            <input type="text" placeholder="Description (optional)" value={creditDesc} onChange={e => setCreditDesc(e.target.value)}
                              style={{ flex: 1, minWidth: 140, padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #e5e0d8', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem' }} />
                            <button onClick={() => issuePoints(m.id)} disabled={creditSaving} style={{ padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none', background: '#D4AF37', color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                              {creditSaving ? '…' : 'Credit'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                            <div>
                              <label style={fieldLabel}>Amount ($)</label>
                              <input type="number" min={1} step={0.01} placeholder="e.g. 200.00" value={dollarAmount} onChange={e => setDollarAmount(e.target.value)} style={fieldInput} />
                            </div>
                            <div>
                              <label style={fieldLabel}>Interest Rate (% / year)</label>
                              <input type="number" min={0} max={100} step={0.1} placeholder="e.g. 5" value={dollarInterest} onChange={e => setDollarInterest(e.target.value)} style={fieldInput} />
                            </div>
                            <div>
                              <label style={fieldLabel}>Payment Due Date</label>
                              <input type="date" value={dollarDueDate} onChange={e => setDollarDueDate(e.target.value)} style={fieldInput} />
                            </div>
                            <div>
                              <label style={fieldLabel}>Notes (optional)</label>
                              <input type="text" placeholder="Internal note" value={dollarNotes} onChange={e => setDollarNotes(e.target.value)} style={fieldInput} />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
                              <button onClick={() => issueDollarCredit(m.id)} disabled={creditSaving} style={{ padding: '0.4rem 1rem', borderRadius: 8, border: 'none', background: 'var(--makay-dark-navy)', color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <DollarSign size={13} /> {creditSaving ? 'Issuing…' : 'Issue Credit Line'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* WALLET CONFIG */}
        {tab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ ...heading, marginBottom: '0.2rem' }}>Wallet Configuration</h3>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', margin: 0 }}>
                    Controls how customers earn points and how credit lines are structured.
                  </p>
                </div>
                <button onClick={saveWalletConfig} disabled={savingWallet} style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'var(--makay-dark-navy)', color: '#fff' }}>
                  {savingWallet ? 'Saving…' : 'Save'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #D4AF3718, #D4A57410)', border: '1px solid #D4AF3730', borderRadius: 12, marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#D4AF3720', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Star size={18} color="#D4AF37" />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: '0 0 0.15rem' }}>Points Rate</p>
                      <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0, lineHeight: 1.1 }}>
                        $1 = {walletDraft.pts_per_dollar} pts
                      </p>
                    </div>
                  </div>
                  <label style={fieldLabel}>Points per $1 spent</label>
                  <input type="number" min={1} max={1000} value={walletDraft.pts_per_dollar}
                    onChange={e => setWalletDraft(p => ({ ...p, pts_per_dollar: parseInt(e.target.value, 10) || 1 }))}
                    style={fieldInput} />
                  <p style={fieldHint}>Customers earn this many points for every dollar spent. Applied automatically on order completion.</p>
                </div>

                <div>
                  <div style={{ padding: '1.25rem', background: 'linear-gradient(135deg, #0f172a0e, #1e2d3d0e)', border: '1px solid #0f172a18', borderRadius: 12, marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0f172a10', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={18} color="var(--makay-dark-navy)" />
                    </div>
                    <div>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: '0 0 0.15rem' }}>Default APR</p>
                      <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0, lineHeight: 1.1 }}>
                        {walletDraft.default_credit_interest}%
                      </p>
                    </div>
                  </div>
                  <label style={fieldLabel}>Default credit interest (% per year)</label>
                  <input type="number" min={0} max={100} step={0.1} value={walletDraft.default_credit_interest}
                    onChange={e => setWalletDraft(p => ({ ...p, default_credit_interest: parseFloat(e.target.value) || 0 }))}
                    style={fieldInput} />
                  <p style={fieldHint}>Pre-filled when issuing credit lines in the Members tab. Each line can have a custom rate.</p>
                </div>
              </div>
            </div>

            <div style={{ ...sectionCard, background: '#f8f6f3', border: '1px solid #ece8e1' }}>
              <h3 style={{ ...heading, display: 'flex', alignItems: 'center', gap: 6 }}><DollarSign size={14} />How to Issue Credit Lines</h3>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: 0, lineHeight: 1.75 }}>
                To issue a credit line to a specific customer, go to the <strong style={{ color: 'var(--makay-dark-navy)' }}>Members</strong> tab, click <strong style={{ color: 'var(--makay-dark-navy)' }}>Credit</strong> on any member row, then switch to <strong style={{ color: 'var(--makay-dark-navy)' }}>$ Credit Line</strong> mode. Enter the principal amount, interest rate, and due date. The dollar balance is added to the customer&apos;s wallet and shown on their profile with interest accumulating daily.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
