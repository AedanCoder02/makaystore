'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Plus, Edit3, Trash2, Users, Check, X, Calendar, MapPin, Tag, Clock, Image as ImageIcon } from 'lucide-react';

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
  tags?: string;
}

interface Ticket {
  id: number;
  customer_name: string;
  customer_email: string;
  quantity: number;
  total_paid: number;
  purchased_at: string;
}

const EMPTY: Partial<Event> = {
  title: '', description: '', location: '', image_url: '',
  price: 0, capacity: 100, status: 'active', tags: '',
};

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Partial<Event>>(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Event>>({});
  const [saving, setSaving] = useState(false);
  const [attendees, setAttendees] = useState<Record<number, Ticket[]>>({});
  const [showAttendees, setShowAttendees] = useState<number | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/events');
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadAttendees = async (id: number) => {
    if (attendees[id]) { setShowAttendees(id); return; }
    const res = await fetch(`/api/events/${id}/tickets`);
    const data = await res.json();
    setAttendees(prev => ({ ...prev, [id]: Array.isArray(data) ? data : [] }));
    setShowAttendees(id);
  };

  const now = new Date();
  const visible = events.filter(ev => {
    if (tab === 'all') return true;
    const date = ev.event_date ? new Date(ev.event_date) : null;
    if (tab === 'upcoming') return !date || date >= now;
    if (tab === 'past')     return date && date < now;
    return true;
  });

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
    setEditForm({
      title: ev.title, description: ev.description,
      event_date: ev.event_date, location: ev.location,
      image_url: ev.image_url, price: ev.price,
      capacity: ev.capacity, status: ev.status, tags: ev.tags,
    });
  };

  function F({ label, val, setter, type = 'text', full = false }: { label: string; val: string | number; setter: (v: string) => void; type?: string; full?: boolean }) {
    return (
      <div style={full ? { gridColumn: '1 / -1' } : {}}>
        <label className="seller-label">{label}</label>
        <input type={type} value={val ?? ''} onChange={e => setter(e.target.value)} className="seller-input" style={{ width: '100%' }} />
      </div>
    );
  }

  function EventForm({ data, onChange, onSave, onCancel, saveLabel }: {
    data: Partial<Event>;
    onChange: (patch: Partial<Event>) => void;
    onSave: () => void;
    onCancel: () => void;
    saveLabel: string;
  }) {
    return (
      <div className="ae-form">
        {/* Image preview */}
        {data.image_url && (
          <div className="ae-img-preview">
            <img src={data.image_url} alt="Preview" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        <div className="ae-form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="seller-label">Event Title *</label>
            <input className="seller-input ae-title-input" placeholder="e.g. Sunset Cocktail Night" value={data.title ?? ''} onChange={e => onChange({ title: e.target.value })} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="seller-label"><Calendar size={12} style={{ display: 'inline', marginRight: 4 }} />Date & Time</label>
            <input type="datetime-local" className="seller-input" value={data.event_date ? data.event_date.slice(0, 16) : ''} onChange={e => onChange({ event_date: e.target.value })} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="seller-label"><MapPin size={12} style={{ display: 'inline', marginRight: 4 }} />Location</label>
            <input className="seller-input" placeholder="Beach Club Terrace" value={data.location ?? ''} onChange={e => onChange({ location: e.target.value })} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="seller-label">Ticket Price ($)</label>
            <input type="number" min={0} step={0.01} className="seller-input" value={data.price ?? 0} onChange={e => onChange({ price: Number(e.target.value) })} style={{ width: '100%' }} />
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-mauve)', marginTop: '0.25rem' }}>Set 0 for free events</p>
          </div>

          <div>
            <label className="seller-label"><Users size={12} style={{ display: 'inline', marginRight: 4 }} />Capacity</label>
            <input type="number" min={1} className="seller-input" value={data.capacity ?? 100} onChange={e => onChange({ capacity: Number(e.target.value) })} style={{ width: '100%' }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="seller-label"><ImageIcon size={12} style={{ display: 'inline', marginRight: 4 }} />Cover Image URL</label>
            <input className="seller-input" placeholder="https://..." value={data.image_url ?? ''} onChange={e => onChange({ image_url: e.target.value })} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="seller-label"><Tag size={12} style={{ display: 'inline', marginRight: 4 }} />Tags (comma-separated)</label>
            <input className="seller-input" placeholder="cocktails, live music, sunset" value={data.tags ?? ''} onChange={e => onChange({ tags: e.target.value })} style={{ width: '100%' }} />
          </div>

          <div>
            <label className="seller-label"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} />Status</label>
            <select className="seller-input" value={data.status ?? 'active'} onChange={e => onChange({ status: e.target.value })} style={{ width: '100%' }}>
              <option value="active">Active — visible to customers</option>
              <option value="draft">Draft — hidden from storefront</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="seller-label">Description</label>
            <textarea className="seller-textarea" rows={4} placeholder="Describe the event experience…" value={data.description ?? ''} onChange={e => onChange({ description: e.target.value })} style={{ width: '100%' }} />
          </div>
        </div>

        <div className="seller-form-actions">
          <button className="seller-btn-primary" onClick={onSave} disabled={saving || !data.title}>
            <Check size={14} /> {saving ? 'Saving…' : saveLabel}
          </button>
          <button className="seller-btn-ghost" onClick={onCancel}><X size={14} /> Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header">
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700 }}>Events</h1>
          <button className="seller-btn-primary" onClick={() => { setShowCreate(v => !v); setEditing(null); }}>
            <Plus size={15} /> New Event
          </button>
        </div>

        {showCreate && (
          <div style={{ marginBottom: '2rem' }}>
            <EventForm
              data={form}
              onChange={patch => setForm(f => ({ ...f, ...patch }))}
              onSave={create}
              onCancel={() => setShowCreate(false)}
              saveLabel="Create Event"
            />
          </div>
        )}

        {/* Tabs */}
        <div className="sp-tabs" style={{ marginBottom: '1.25rem' }}>
          {(['upcoming', 'all', 'past'] as const).map(t => (
            <button key={t} className={`sp-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'upcoming' ? 'Upcoming' : t === 'all' ? 'All' : 'Past'}
              <span className="sp-tab-count">
                {t === 'upcoming' ? events.filter(e => !e.event_date || new Date(e.event_date) >= now).length
                 : t === 'past' ? events.filter(e => e.event_date && new Date(e.event_date) < now).length
                 : events.length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: 'var(--makay-mauve)', fontFamily: 'var(--font-montserrat)', padding: '2rem 0' }}>Loading…</p>
        ) : visible.length === 0 ? (
          <div className="ae-empty">
            <Calendar size={40} />
            <p>No {tab} events. {tab === 'upcoming' ? 'Create your first event above.' : ''}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {visible.map(ev => {
              const remaining = ev.capacity - ev.tickets_sold;
              const soldPct = Math.round((ev.tickets_sold / ev.capacity) * 100);
              const isPast = ev.event_date && new Date(ev.event_date) < now;

              return (
                <div key={ev.id} className={`ae-event-card${editing === ev.id ? ' editing' : ''}`}>
                  <div className="ae-event-row">
                    {/* Cover thumbnail */}
                    <div className="ae-thumb-wrap">
                      {ev.image_url
                        ? <img src={ev.image_url} alt={ev.title} className="ae-thumb" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div className="ae-thumb-placeholder"><Calendar size={20} /></div>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--makay-dark-navy)' }}>{ev.title}</span>
                        <span className={`ae-status ae-status--${ev.status}`}>{ev.status}</span>
                        {isPast && <span className="ae-status ae-status--past">Past</span>}
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)', marginBottom: '0.5rem' }}>
                        {ev.event_date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={11} />
                            {new Date(ev.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                        {ev.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={11} />{ev.location}</span>}
                        <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, color: 'var(--makay-peachy-rose)' }}>
                          {Number(ev.price) === 0 ? 'Free' : `$${Number(ev.price).toFixed(2)}`}
                        </span>
                      </div>

                      {/* Capacity bar */}
                      <div className="ae-capacity-bar-wrap">
                        <div className="ae-capacity-bar" style={{ width: `${Math.min(soldPct, 100)}%`, background: soldPct >= 90 ? '#ef4444' : soldPct >= 60 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', color: 'var(--makay-mauve)', marginTop: '0.25rem' }}>
                        {ev.tickets_sold}/{ev.capacity} tickets sold · {remaining} remaining
                      </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                      <button className="seller-icon-btn edit" title="Edit" onClick={() => editing === ev.id ? setEditing(null) : startEdit(ev)}>
                        <Edit3 size={14} />
                      </button>
                      <button className="seller-icon-btn cancel" title="Delete" onClick={() => deleteEvent(ev.id, ev.title)}>
                        <Trash2 size={14} />
                      </button>
                      <button className="ae-attendees-btn" onClick={() => showAttendees === ev.id ? setShowAttendees(null) : loadAttendees(ev.id)}>
                        <Users size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Edit form */}
                  {editing === ev.id && (
                    <div className="ae-edit-panel">
                      <EventForm
                        data={editForm}
                        onChange={patch => setEditForm(f => ({ ...f, ...patch }))}
                        onSave={saveEdit}
                        onCancel={() => setEditing(null)}
                        saveLabel="Save Changes"
                      />
                    </div>
                  )}

                  {/* Attendees list */}
                  {showAttendees === ev.id && (
                    <div className="ae-attendees-panel">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--makay-dark-navy)', margin: 0 }}>
                          Attendees ({attendees[ev.id]?.length ?? 0})
                        </h3>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--makay-mauve)' }} onClick={() => setShowAttendees(null)}><X size={14} /></button>
                      </div>
                      {!attendees[ev.id]?.length ? (
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)' }}>No tickets purchased yet.</p>
                      ) : (
                        <table className="sup-table">
                          <thead><tr><th>Name</th><th>Email</th><th>Qty</th><th>Paid</th><th>Date</th></tr></thead>
                          <tbody>
                            {attendees[ev.id].map(a => (
                              <tr key={a.id}>
                                <td>{a.customer_name}</td>
                                <td style={{ color: 'var(--makay-mauve)', fontSize: '0.78rem' }}>{a.customer_email}</td>
                                <td>{a.quantity}</td>
                                <td style={{ fontWeight: 600 }}>${Number(a.total_paid).toFixed(2)}</td>
                                <td style={{ color: 'var(--makay-mauve)', fontSize: '0.75rem' }}>{new Date(a.purchased_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
