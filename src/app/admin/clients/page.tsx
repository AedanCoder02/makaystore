'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

interface ContactRow {
  id: number;
  full_name: string;
  phone_raw: string | null;
  email: string | null;
  sources: string[];
  extra: Record<string, string>;
}

const SOURCE_LABELS: Record<string, string> = {
  yimi: 'Yimi',
  makay_store_account: 'Makay Store (cuenta)',
  makay_store_walkin: 'Makay Store (mostrador)',
  makay_store_crm: 'Makay Store (CRM)',
  roulette: 'Makay Roulette',
  csv_import: 'Base histórica (CSV)',
};

const SOURCE_COLORS: Record<string, string> = {
  yimi: 'teal',
  makay_store_account: 'gold',
  makay_store_walkin: 'gold',
  makay_store_crm: 'purple',
  roulette: 'orange',
  csv_import: 'teal',
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ContactRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      fetch('/api/admin/clients?q=' + encodeURIComponent(search))
        .then(r => r.json())
        .then(data => {
          setClients(data.clients ?? []);
          setTotal(data.total ?? 0);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1>Clientes</h1>
        </div>

        <div className="admin-filter-row">
          <input
            className="admin-search-input"
            placeholder="Buscar por nombre, teléfono o correo…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="admin-count">
            {search ? `${clients.length} resultados` : `${total} clientes en total`}
          </span>
        </div>

        {loading ? (
          <p className="admin-loading">Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {clients.map(c => (
              <div
                key={c.id}
                className="perm-user-card"
                style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--makay-dark-navy)', margin: 0 }}>
                    {c.full_name || '—'}
                  </p>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>
                    {[c.phone_raw, c.email].filter(Boolean).join(' · ') || 'Sin contacto'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '45%' }}>
                  {c.sources.map(s => (
                    <span key={s} className={`admin-role-badge role-${SOURCE_COLORS[s] ?? 'teal'}`} style={{ fontSize: '0.68rem' }}>
                      {SOURCE_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {clients.length === 0 && (
              <p className="admin-loading">Sin resultados.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
