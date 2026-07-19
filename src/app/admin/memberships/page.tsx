'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Crown, TrendingUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Stats {
  distribution: { tier: string; count: number }[];
  recent: { id: number; customer_name: string; customer_email: string; tier: string; price: number; payment_method: string; sold_at: string }[];
  revenue: { tier: string; sales: number; revenue: number }[];
}

const TIER_COLOR: Record<string, string> = {
  free: '#A89080', bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574',
};

export default function AdminMembershipsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/memberships/stats')
      .then(r => r.ok ? r.json() : null)
      .then((d: Stats | null) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const totalMembers = stats?.distribution.reduce((s, d) => s + Number(d.count), 0) ?? 0;
  const paidMembers  = stats?.distribution.filter(d => d.tier !== 'free').reduce((s, d) => s + Number(d.count), 0) ?? 0;
  const totalRevenue = stats?.revenue.reduce((s, r) => s + Number(r.revenue), 0) ?? 0;

  const pieData = (stats?.distribution ?? []).map(d => ({
    name: d.tier.charAt(0).toUpperCase() + d.tier.slice(1),
    value: Number(d.count),
    color: TIER_COLOR[d.tier] ?? '#ccc',
  }));

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700 }}>Memberships</h1>
        </div>

        {loading ? (
          <p className="admin-loading">Loading…</p>
        ) : (
          <>
            {/* KPIs */}
            <div className="admin-stats-strip" style={{ marginBottom: '2rem' }}>
              <div className="admin-stat-chip"><Users size={14} /> {totalMembers} total profiles</div>
              <div className="admin-stat-chip"><Crown size={14} /> {paidMembers} paid members</div>
              <div className="admin-stat-chip"><TrendingUp size={14} /> ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} membership revenue</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Tier distribution chart */}
              <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 16, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1rem' }}>Tier Distribution</h3>
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

              {/* Revenue by tier */}
              <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 16, padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1rem' }}>Revenue by Tier</h3>
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

            {/* Recent sales */}
            {(stats?.recent ?? []).length > 0 && (
              <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--makay-sand-cream)' }}>
                  <h3 style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', margin: 0 }}>Recent Membership Sales</h3>
                </div>
                <table className="admin-table">
                  <thead><tr><th>Client</th><th>Tier</th><th>Payment</th><th>Amount</th><th>Date</th></tr></thead>
                  <tbody>
                    {(stats?.recent ?? []).map(s => (
                      <tr key={s.id}>
                        <td className="admin-user-cell">
                          <span>{s.customer_name || s.customer_email || '—'}</span>
                        </td>
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
      </main>
    </div>
  );
}
