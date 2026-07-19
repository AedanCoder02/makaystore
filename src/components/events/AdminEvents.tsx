'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Plus, Edit3, Trash2, Users, Check, X } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url: string;
  price: number;
  capacity: number;
  status: string;
  tickets_sold: number;
}

const EMPTY: Partial<Event> = { title: '', description: '', location: '', image_url: '', price: 0, capacity: 100, status: 'active' };

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Partial<Event>>(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/events');
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.title) return;
    setSaving(true);
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setForm(EMPTY);
    setShowCreate(false);
    await load();
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/events/${editing}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  const deleteEvent = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    await load();
  };

  const startEdit = (ev: Event) => {
    setEditing(ev.id);
    setEditForm({ title: ev.title, description: ev.description, event_date: ev.event_date, location: ev.location, image_url: ev.image_url, price: ev.price, capacity: ev.capacity, status: ev.status });
  };

  const Field = ({ label, val, setter, type = 'text' }: { label: string; val: string | number; setter: (v: string) => void; type?: string }) => (
    <div>
      <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--makay-dark-navy)', display: 'block', marginBottom: '0.25rem' }}>{label}</label>
      <input type={type} value={val ?? ''} onChange={e => setter(e.target.value)} className="seller-input" style={{ width: '100%' }} />
    </div>
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700 }}>Events</h1>
          <button className="seller-btn-primary" onClick={() => setShowCreate(v => !v)}>
            <Plus size={15} /> New Event
          </button>
        </div>

        {showCreate && (
          <div className="seller-add-form" style={{ marginBottom: '1.5rem' }}>
            <h3 className="seller-form-title">Create Event</h3>
            <div className="seller-form-grid">
              <Field label="Title *" val={form.title ?? ''} setter={v => setForm(f => ({ ...f, title: v }))} />
              <Field label="Location" val={form.location ?? ''} setter={v => setForm(f => ({ ...f, location: v }))} />
              <Field label="Date & Time" val={form.event_date ?? ''} setter={v => setForm(f => ({ ...f, event_date: v }))} type="datetime-local" />
              <Field label="Price ($)" val={form.price ?? 0} setter={v => setForm(f => ({ ...f, price: Number(v) }))} type="number" />
              <Field label="Capacity" val={form.capacity ?? 100} setter={v => setForm(f => ({ ...f, capacity: Number(v) }))} type="number" />
              <Field label="Image URL" val={form.image_url ?? ''} setter={v => setForm(f => ({ ...f, image_url: v }))} />
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--makay-dark-navy)', display: 'block', marginBottom: '0.25rem' }}>Description</label>
              <textarea className="seller-textarea" rows={2} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="seller-form-actions">
              <button className="seller-btn-primary" onClick={create} disabled={saving || !form.title}>{saving ? 'Saving…' : 'Create Event'}</button>
              <button className="seller-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem 0' }}>Loading…</p>
        ) : events.length === 0 ? (
          <p style={{ color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem 0', textAlign: 'center' }}>No events yet. Create your first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map(ev => (
              <div key={ev.id}>
                <div style={{ background: '#fff', border: editing === ev.id ? '1px solid var(--makay-peachy-rose)' : '1px solid var(--makay-sand-cream)', borderRadius: '14px', padding: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {ev.image_url && (
                    <img src={ev.image_url} alt={ev.title} style={{ width: 72, height: 56, objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--makay-dark-navy)' }}>{ev.title}</span>
                      <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: '100px', background: ev.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.15)', color: ev.status === 'active' ? '#059669' : '#6b7280', fontWeight: 700, textTransform: 'uppercase' }}>{ev.status}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}>
                      {ev.event_date && <span>{new Date(ev.event_date).toLocaleDateString()}</span>}
                      {ev.location && <span>{ev.location}</span>}
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Users size={11} />{ev.tickets_sold}/{ev.capacity} sold</span>
                      <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, color: 'var(--makay-peachy-rose)' }}>{Number(ev.price) === 0 ? 'Free' : `$${Number(ev.price).toFixed(2)}`}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    {editing === ev.id ? (
                      <>
                        <button className="seller-icon-btn save" onClick={saveEdit} disabled={saving}><Check size={14} /></button>
                        <button className="seller-icon-btn cancel" onClick={() => setEditing(null)}><X size={14} /></button>
                      </>
                    ) : (
                      <>
                        <button className="seller-icon-btn edit" onClick={() => startEdit(ev)}><Edit3 size={14} /></button>
                        <button className="seller-icon-btn cancel" onClick={() => deleteEvent(ev.id, ev.title)}><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>

                {editing === ev.id && (
                  <div className="sp-edit-panel" style={{ border: '1px solid var(--makay-peachy-rose)', borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '1.25rem' }}>
                    <div className="seller-form-grid">
                      <Field label="Title" val={editForm.title ?? ''} setter={v => setEditForm(f => ({ ...f, title: v }))} />
                      <Field label="Location" val={editForm.location ?? ''} setter={v => setEditForm(f => ({ ...f, location: v }))} />
                      <Field label="Date & Time" val={editForm.event_date ? editForm.event_date.slice(0, 16) : ''} setter={v => setEditForm(f => ({ ...f, event_date: v }))} type="datetime-local" />
                      <Field label="Price ($)" val={editForm.price ?? 0} setter={v => setEditForm(f => ({ ...f, price: Number(v) }))} type="number" />
                      <Field label="Capacity" val={editForm.capacity ?? 100} setter={v => setEditForm(f => ({ ...f, capacity: Number(v) }))} type="number" />
                      <Field label="Image URL" val={editForm.image_url ?? ''} setter={v => setEditForm(f => ({ ...f, image_url: v }))} />
                      <div>
                        <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--makay-dark-navy)', display: 'block', marginBottom: '0.25rem' }}>Status</label>
                        <select value={editForm.status ?? 'active'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="seller-input" style={{ width: '100%' }}>
                          <option value="active">Active</option>
                          <option value="draft">Draft</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--makay-dark-navy)', display: 'block', marginBottom: '0.25rem' }}>Description</label>
                      <textarea className="seller-textarea sm" rows={2} value={editForm.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
