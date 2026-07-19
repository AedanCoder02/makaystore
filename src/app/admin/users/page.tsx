'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: number;
  imageUrl: string;
  permissions: string[];
}

const ROLE_COLORS: Record<string, string> = {
  customer: 'teal', seller: 'gold', supervisor: 'orange', admin: 'purple',
};

const ROLE_SECTIONS: Record<string, { key: string; label: string }[]> = {
  seller: [
    { key: 'sell',     label: 'Sell to Client' },
    { key: 'products', label: 'Products' },
    { key: 'stock',    label: 'Stock' },
    { key: 'rotation', label: 'Rotation' },
    { key: 'studio',   label: 'Studio' },
    { key: 'activity', label: 'My Activity' },
  ],
  supervisor: [
    { key: 'sup-overview', label: 'Overview' },
    { key: 'sup-staff',    label: 'Staff' },
    { key: 'sup-orders',   label: 'Orders' },
    { key: 'sup-shifts',   label: 'Shifts' },
  ],
  admin: [
    { key: 'admin-orders',  label: 'Orders' },
    { key: 'admin-users',   label: 'Users' },
    { key: 'admin-reports', label: 'Reports' },
    { key: 'admin-events',  label: 'Events' },
  ],
};

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [permDrafts, setPermDrafts] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setUsers(rows);
        // Init permission drafts from fetched data
        const drafts: Record<string, string[]> = {};
        for (const u of rows) drafts[u.id] = Array.isArray(u.permissions) ? u.permissions : getDefaultPermissions(u.role);
        setPermDrafts(drafts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function getDefaultPermissions(role: string): string[] {
    return (ROLE_SECTIONS[role] ?? []).map(s => s.key);
  }

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function saveUser(userId: string) {
    setSaving(userId);
    const newRole = pendingRoles[userId];
    const perms = permDrafts[userId];
    const payload: Record<string, unknown> = {};
    if (newRole && newRole !== users.find(u => u.id === userId)?.role) payload.role = newRole;
    if (perms !== undefined) payload.permissions = perms;

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId
        ? { ...u, role: newRole ?? u.role, permissions: perms ?? u.permissions }
        : u
      ));
      setPendingRoles(prev => { const n = { ...prev }; delete n[userId]; return n; });
      setToast(t('roleUpdated'));
      setTimeout(() => setToast(''), 2500);
    }
    setSaving(null);
  }

  function togglePerm(userId: string, key: string) {
    setPermDrafts(prev => {
      const current = prev[userId] ?? [];
      const next = current.includes(key) ? current.filter(k => k !== key) : [...current, key];
      return { ...prev, [userId]: next };
    });
  }

  function toggleAll(userId: string, role: string, on: boolean) {
    const all = (ROLE_SECTIONS[role] ?? []).map(s => s.key);
    setPermDrafts(prev => ({ ...prev, [userId]: on ? all : [] }));
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1>{t('userManagement')}</h1>
        </div>

        {toast && <div className="admin-toast">{toast}</div>}

        <div className="admin-filter-row">
          <input className="admin-search-input" placeholder={t('searchUsers')} value={search}
            onChange={e => setSearch(e.target.value)} />
          <span className="admin-count">{filtered.length} users</span>
        </div>

        {loading ? (
          <p className="admin-loading">Loading...</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(user => {
              const currentRole = pendingRoles[user.id] ?? user.role;
              const sections = ROLE_SECTIONS[currentRole] ?? [];
              const perms = permDrafts[user.id] ?? getDefaultPermissions(currentRole);
              const isExpanded = expanded === user.id;
              const isSaving = saving === user.id;

              return (
                <div key={user.id} className="perm-user-card">
                  {/* Main row */}
                  <div className="perm-user-row">
                    <div className="admin-user-cell" style={{ flex: 1 }}>
                      {user.imageUrl && (
                        <Image src={user.imageUrl} alt={user.fullName} width={36} height={36} className="admin-user-avatar" />
                      )}
                      <div>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.88rem', color: 'var(--makay-dark-navy)', margin: 0 }}>{user.fullName || '—'}</p>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>{user.email}</p>
                      </div>
                    </div>

                    <span className={`admin-role-badge role-${ROLE_COLORS[user.role] ?? 'teal'}`} style={{ flexShrink: 0 }}>
                      {user.role}
                    </span>

                    <select className="admin-role-select" value={currentRole}
                      onChange={e => {
                        const newRole = e.target.value;
                        setPendingRoles(prev => ({ ...prev, [user.id]: newRole }));
                        setPermDrafts(prev => ({ ...prev, [user.id]: getDefaultPermissions(newRole) }));
                      }}>
                      <option value="customer">customer</option>
                      <option value="seller">seller</option>
                      <option value="supervisor">supervisor</option>
                      <option value="admin">admin</option>
                    </select>

                    {sections.length > 0 && (
                      <button className="perm-expand-btn" onClick={() => setExpanded(isExpanded ? null : user.id)}>
                        Permissions {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}

                    <button className="admin-save-btn" onClick={() => saveUser(user.id)} disabled={isSaving}>
                      {isSaving ? 'Saving…' : t('saveRole')}
                    </button>
                  </div>

                  {/* Permission toggles */}
                  {isExpanded && sections.length > 0 && (
                    <div className="perm-sections">
                      <div className="perm-sections-header">
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--makay-mauve)' }}>
                          Section Access for {currentRole}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="perm-toggle-all" onClick={() => toggleAll(user.id, currentRole, true)}>All</button>
                          <button className="perm-toggle-all" onClick={() => toggleAll(user.id, currentRole, false)}>None</button>
                        </div>
                      </div>
                      <div className="perm-grid">
                        {sections.map(s => {
                          const on = perms.includes(s.key);
                          return (
                            <label key={s.key} className={`perm-chip${on ? ' on' : ''}`}>
                              <input type="checkbox" checked={on} onChange={() => togglePerm(user.id, s.key)}
                                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }} />
                              {s.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
