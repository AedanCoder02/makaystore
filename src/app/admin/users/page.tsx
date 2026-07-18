'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import AdminSidebar from '@/components/AdminSidebar';

interface UserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: number;
  imageUrl: string;
}

const ROLE_COLORS: Record<string, string> = {
  customer: 'teal',
  seller: 'gold',
  supervisor: 'orange',
  admin: 'purple',
};

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingSave, setPendingSave] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function saveRole(userId: string) {
    const newRole = pendingSave[userId];
    if (!newRole) return;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
      setPendingSave((prev) => { const n = { ...prev }; delete n[userId]; return n; });
      setToast(t('roleUpdated'));
      setTimeout(() => setToast(''), 2500);
    }
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
          <input
            className="admin-search-input"
            placeholder={t('searchUsers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="admin-count">{filtered.length} users</span>
        </div>

        {loading ? (
          <p className="admin-loading">Loading...</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Change Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => {
                  const currentRole = pendingSave[user.id] ?? user.role;
                  return (
                    <tr key={user.id}>
                      <td className="admin-user-cell">
                        {user.imageUrl && (
                          <Image src={user.imageUrl} alt={user.fullName} width={32} height={32} className="admin-user-avatar" />
                        )}
                        <span>{user.fullName || '—'}</span>
                      </td>
                      <td className="admin-email">{user.email}</td>
                      <td>
                        <span className={`admin-role-badge role-${ROLE_COLORS[user.role] ?? 'teal'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <select
                          className="admin-role-select"
                          value={currentRole}
                          onChange={(e) =>
                            setPendingSave((prev) => ({ ...prev, [user.id]: e.target.value }))
                          }
                        >
                          <option value="customer">customer</option>
                          <option value="seller">seller</option>
                          <option value="supervisor">supervisor</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td>
                        {pendingSave[user.id] && pendingSave[user.id] !== user.role && (
                          <button className="admin-save-btn" onClick={() => saveRole(user.id)}>
                            {t('saveRole')}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
