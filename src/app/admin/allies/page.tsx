'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Plus, Edit2, Trash2, Check, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface Ally {
  id: number;
  name: string;
  logo_url: string;
  description: string;
  discount_percent: number;
  discount_code: string;
  min_tier: string;
  active: boolean;
  display_order: number;
}

const TIERS = ['bronze', 'silver', 'gold', 'vip'];
const TIER_COLOR: Record<string, string> = {
  bronze: '#CD7F32', silver: '#A8A9AD', gold: '#D4AF37', vip: '#D4A574',
};

const EMPTY: Omit<Ally, 'id'> = {
  name: '', logo_url: '', description: '',
  discount_percent: 10, discount_code: '',
  min_tier: 'bronze', active: true, display_order: 0,
};

export default function AdminAlliesPage() {
  const [allies, setAllies] = useState<Ally[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Ally, 'id'>>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Ally>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  useEffect(() => {
    fetch('/api/admin/allies')
      .then(r => r.ok ? r.json() : [])
      .then((d: Ally[]) => { setAllies(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!draft.name.trim() || !draft.discount_code.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/allies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (res.ok) {
      const created: Ally = await res.json();
      setAllies(prev => [...prev, created]);
      setDraft(EMPTY);
      setCreating(false);
      showToast('Ally created.');
    }
    setSaving(false);
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    const res = await fetch(`/api/admin/allies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      const updated: Ally = await res.json();
      setAllies(prev => prev.map(a => a.id === id ? updated : a));
      setEditId(null);
      setEditDraft({});
      showToast('Ally updated.');
    }
    setSaving(false);
  };

  const toggleActive = async (ally: Ally) => {
    const res = await fetch(`/api/admin/allies/${ally.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !ally.active }),
    });
    if (res.ok) {
      const updated: Ally = await res.json();
      setAllies(prev => prev.map(a => a.id === ally.id ? updated : a));
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this ally?')) return;
    await fetch(`/api/admin/allies/${id}`, { method: 'DELETE' });
    setAllies(prev => prev.filter(a => a.id !== id));
    showToast('Ally removed.');
  };

  const fieldStyle = {
    fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem',
    padding: '0.4rem 0.6rem', borderRadius: 6,
    border: '1px solid var(--makay-sand-cream)', width: '100%', boxSizing: 'border-box' as const,
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700 }}>Allies</h1>
          <button onClick={() => setCreating(true)} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700,
            padding: '0.55rem 1.1rem', borderRadius: 9, border: 'none',
            background: 'var(--makay-dark-navy)', color: '#fff', cursor: 'pointer',
          }}>
            <Plus size={15} /> New Ally
          </button>
        </div>

        {toast && <div className="admin-toast">{toast}</div>}

        {/* Create form */}
        {creating && (
          <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1rem' }}>New Ally</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 }}>Name *</label>
                <input style={fieldStyle} value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))} placeholder="Partner name" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 }}>Logo URL</label>
                <input style={fieldStyle} value={draft.logo_url} onChange={e => setDraft(p => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 }}>Description</label>
                <input style={fieldStyle} value={draft.description} onChange={e => setDraft(p => ({ ...p, description: e.target.value }))} placeholder="Short description shown on card" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 }}>Discount Code *</label>
                <input style={fieldStyle} value={draft.discount_code} onChange={e => setDraft(p => ({ ...p, discount_code: e.target.value.toUpperCase() }))} placeholder="MAKAY-PARTNER10" />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 }}>Discount %</label>
                <input style={fieldStyle} type="number" min={1} max={100} value={draft.discount_percent} onChange={e => setDraft(p => ({ ...p, discount_percent: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 }}>Min Tier</label>
                <select style={fieldStyle} value={draft.min_tier} onChange={e => setDraft(p => ({ ...p, min_tier: e.target.value }))}>
                  {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 }}>Display Order</label>
                <input style={fieldStyle} type="number" min={0} value={draft.display_order} onChange={e => setDraft(p => ({ ...p, display_order: parseInt(e.target.value, 10) || 0 }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={create} disabled={saving} style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', background: 'var(--makay-dark-navy)', color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={13} /> {saving ? 'Saving…' : 'Create'}
              </button>
              <button onClick={() => { setCreating(false); setDraft(EMPTY); }} style={{ padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? <p className="admin-loading">Loading…</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {allies.length === 0 && (
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-mauve)', padding: '2rem', textAlign: 'center' }}>No allies yet. Click New Ally to add one.</p>
            )}
            {allies.map(ally => {
              const isEditing = editId === ally.id;
              const ed = editDraft;
              return (
                <div key={ally.id} style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                  {isEditing ? (
                    <div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem', marginBottom: '0.75rem' }}>
                        <input style={fieldStyle} defaultValue={ally.name} onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))} placeholder="Name" />
                        <input style={fieldStyle} defaultValue={ally.logo_url} onChange={e => setEditDraft(p => ({ ...p, logo_url: e.target.value }))} placeholder="Logo URL" />
                        <input style={{ ...fieldStyle, gridColumn: '1/-1' }} defaultValue={ally.description} onChange={e => setEditDraft(p => ({ ...p, description: e.target.value }))} placeholder="Description" />
                        <input style={fieldStyle} defaultValue={ally.discount_code} onChange={e => setEditDraft(p => ({ ...p, discount_code: e.target.value.toUpperCase() }))} placeholder="Discount code" />
                        <input style={fieldStyle} type="number" defaultValue={ally.discount_percent} onChange={e => setEditDraft(p => ({ ...p, discount_percent: parseInt(e.target.value, 10) || 0 }))} />
                        <select style={fieldStyle} defaultValue={ally.min_tier} onChange={e => setEditDraft(p => ({ ...p, min_tier: e.target.value }))}>
                          {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input style={fieldStyle} type="number" defaultValue={ally.display_order} onChange={e => setEditDraft(p => ({ ...p, display_order: parseInt(e.target.value, 10) || 0 }))} placeholder="Order" />
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => saveEdit(ally.id)} disabled={saving} style={{ padding: '0.35rem 0.85rem', borderRadius: 7, border: 'none', background: 'var(--makay-dark-navy)', color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={12} /> {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => { setEditId(null); setEditDraft({}); }} style={{ padding: '0.35rem 0.6rem', borderRadius: 7, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer' }}>
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--makay-dark-navy)', margin: '0 0 0.15rem' }}>{ally.name}</p>
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>{ally.description || '—'}</p>
                      </div>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: TIER_COLOR[ally.min_tier] ?? '#CD7F32', whiteSpace: 'nowrap' }}>
                        {ally.discount_percent}% · {ally.min_tier}+
                      </span>
                      <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: '#f7f4f0', padding: '0.2rem 0.5rem', borderRadius: 5, color: 'var(--makay-dark-navy)' }}>
                        {ally.discount_code}
                      </code>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: ally.active ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                        {ally.active ? 'Active' : 'Hidden'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button onClick={() => toggleActive(ally)} title={ally.active ? 'Deactivate' : 'Activate'} style={{ padding: '0.3rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          {ally.active ? <ToggleRight size={16} color="#10b981" /> : <ToggleLeft size={16} color="#b0a090" />}
                        </button>
                        <button onClick={() => { setEditId(ally.id); setEditDraft({}); }} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)' }}>
                          <Edit2 size={11} /> Edit
                        </button>
                        <button onClick={() => remove(ally.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #fecaca', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: '#ef4444' }}>
                          <Trash2 size={11} /> Delete
                        </button>
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
