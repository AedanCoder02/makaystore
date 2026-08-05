'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Users, Trash2, Plus, UserPlus } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';

interface AuthorizedUser {
  id: number;
  member_clerk_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

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

  // Authorized users per member
  const [authPanel, setAuthPanel] = useState<string | null>(null); // active userId
  const [authUsers, setAuthUsers] = useState<Record<string, AuthorizedUser[]>>({});
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [authSaving, setAuthSaving] = useState(false);

  const loadAuthUsers = useCallback(async (userId: string) => {
    const res = await fetch('/api/admin/authorized-users?member_clerk_id=' + userId);
    if (res.ok) {
      const data: AuthorizedUser[] = await res.json();
      setAuthUsers(prev => ({ ...prev, [userId]: data }));
    }
  }, []);

  const addAuthUser = async (userId: string) => {
    if (!authForm.name.trim()) return;
    setAuthSaving(true);
    const res = await fetch('/api/admin/authorized-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_clerk_id: userId, ...authForm }),
    });
    if (res.ok) {
      await loadAuthUsers(userId);
      setAuthForm({ name: '', email: '', phone: '', notes: '' });
    } else {
      const err = await res.json();
      setToast(err.error ?? 'Error al agregar usuario autorizado');
      setTimeout(() => setToast(''), 3000);
    }
    setAuthSaving(false);
  };

  const removeAuthUser = async (userId: string, authId: number) => {
    await fetch('/api/admin/authorized-users?id=' + authId, { method: 'DELETE' });
    await loadAuthUsers(userId);
  };

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
                        Permisos {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    )}

                    <button
                      className="perm-expand-btn"
                      style={{ borderColor: '#D4AF37', color: '#92700e' }}
                      onClick={() => {
                        const next = authPanel === user.id ? null : user.id;
                        setAuthPanel(next);
                        if (next) loadAuthUsers(next);
                      }}
                    >
                      <Users size={13} /> Autorizados ({(authUsers[user.id] ?? []).length}/3)
                    </button>

                    <button className="admin-save-btn" onClick={() => saveUser(user.id)} disabled={isSaving}>
                      {isSaving ? 'Saving…' : t('saveRole')}
                    </button>
                  </div>

                  {/* Permission toggles */}
                  {isExpanded && sections.length > 0 && (
                    <div className="perm-sections">
                      <div className="perm-sections-header">
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--makay-mauve)' }}>
                          Acceso por sección — {currentRole}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="perm-toggle-all" onClick={() => toggleAll(user.id, currentRole, true)}>Todos</button>
                          <button className="perm-toggle-all" onClick={() => toggleAll(user.id, currentRole, false)}>Ninguno</button>
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

                  {/* Authorized users panel */}
                  {authPanel === user.id && (
                    <div style={{ borderTop: '1.5px solid #fef3c7', background: '#fffdf5', padding: '1.25rem 1.5rem' }}>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92700e', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <UserPlus size={13} /> Usuarios Autorizados (máx. 3) — Membresía Transferible
                      </p>

                      {/* Existing authorized users */}
                      {(authUsers[user.id] ?? []).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                          {(authUsers[user.id] ?? []).map(au => (
                            <div key={au.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', background: '#fff', border: '1px solid #e8e0ce', borderRadius: 10 }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--makay-dark-navy)', margin: 0 }}>{au.name}</p>
                                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: 0 }}>
                                  {[au.email, au.phone].filter(Boolean).join(' · ') || 'Sin contacto'}
                                </p>
                                {au.notes && <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: '#a0a0a0', margin: 0 }}>{au.notes}</p>}
                              </div>
                              <button
                                onClick={() => removeAuthUser(user.id, au.id)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0.25rem', borderRadius: 6, display: 'flex' }}
                                title="Eliminar"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: '0 0 1rem' }}>
                          Sin usuarios autorizados aún.
                        </p>
                      )}

                      {/* Add form — only if under 3 */}
                      {(authUsers[user.id] ?? []).length < 3 && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {[
                            { key: 'name',  label: 'Nombre *',   placeholder: 'Nombre completo' },
                            { key: 'email', label: 'Email',       placeholder: 'correo@ejemplo.com' },
                            { key: 'phone', label: 'Teléfono',    placeholder: '+58 000 000 0000' },
                            { key: 'notes', label: 'Notas',       placeholder: 'Parentesco, etc.' },
                          ].map(f => (
                            <div key={f.key}>
                              <label style={{ display: 'block', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '0.25rem' }}>{f.label}</label>
                              <input
                                className="admin-search-input"
                                style={{ width: '100%', boxSizing: 'border-box', margin: 0, minWidth: 0, fontSize: '0.82rem' }}
                                placeholder={f.placeholder}
                                value={(authForm as Record<string, string>)[f.key]}
                                onChange={e => setAuthForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                              />
                            </div>
                          ))}
                          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => addAuthUser(user.id)}
                              disabled={authSaving || !authForm.name.trim()}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', background: '#D4AF37', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.82rem', opacity: authSaving ? 0.7 : 1 }}
                            >
                              <Plus size={14} /> {authSaving ? 'Guardando…' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {(authUsers[user.id] ?? []).length >= 3 && (
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: '#92700e', fontWeight: 600 }}>
                          Límite alcanzado (3 de 3). Elimina uno para agregar otro.
                        </p>
                      )}
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
