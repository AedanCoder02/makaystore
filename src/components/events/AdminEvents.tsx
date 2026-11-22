'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Plus, Edit3, Trash2, Users, Calendar, MapPin, Tag, Clock, Image as ImageIcon, Check, X, ExternalLink, Images, FileText } from 'lucide-react';
import AdminSidebar from '@/components/AdminSidebar';
import '@/styles/events-admin.css';

export interface EventRecord {
  id: number;
  title: string;
  description: string;
  content: string;
  event_date: string | null;
  location: string;
  image_url: string;
  gallery: string[];
  price: number;
  capacity: number;
  status: string;
  tickets_sold: number;
  tags: string;
}

interface Ticket {
  id: number;
  customer_name: string;
  customer_email: string;
  quantity: number;
  total_paid: number;
  purchased_at: string;
  order_id?: string | null;
}

type Draft = Omit<Partial<EventRecord>, 'gallery'> & { galleryText?: string };

const EMPTY: Draft = {
  title: '', description: '', content: '', location: '', image_url: '', galleryText: '',
  price: 0, capacity: 100, status: 'active', tags: '', event_date: '',
};

/** <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm". */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toPayload(d: Draft) {
  const { galleryText, ...rest } = d;
  return {
    ...rest,
    event_date: d.event_date ? new Date(d.event_date).toISOString() : null,
    gallery: (galleryText ?? '').split('\n').map(s => s.trim()).filter(Boolean),
  };
}

function EventForm({ data, onChange, onSave, onCancel, saveLabel, saving }: {
  data: Draft;
  onChange: (patch: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  saveLabel: string;
  saving: boolean;
}) {
  const t = useTranslations('eventsAdmin');
  const galleryUrls = (data.galleryText ?? '').split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="ae-form">
      <div className="ae-form-grid">
        <div className="ae-span">
          <label className="seller-label">{t('fields.title')} *</label>
          <input className="seller-input ae-title-input" placeholder={t('placeholders.title')} value={data.title ?? ''} onChange={e => onChange({ title: e.target.value })} />
        </div>

        <div>
          <label className="seller-label"><Calendar size={12} /> {t('fields.date')}</label>
          <input type="datetime-local" className="seller-input" value={data.event_date ?? ''} onChange={e => onChange({ event_date: e.target.value })} />
        </div>

        <div>
          <label className="seller-label"><MapPin size={12} /> {t('fields.location')}</label>
          <input className="seller-input" placeholder={t('placeholders.location')} value={data.location ?? ''} onChange={e => onChange({ location: e.target.value })} />
        </div>

        <div>
          <label className="seller-label">{t('fields.price')}</label>
          <input type="number" min={0} step={0.01} className="seller-input" value={data.price ?? 0} onChange={e => onChange({ price: Number(e.target.value) })} />
          <p className="ae-hint">{t('hints.price')}</p>
        </div>

        <div>
          <label className="seller-label"><Users size={12} /> {t('fields.capacity')}</label>
          <input type="number" min={1} className="seller-input" value={data.capacity ?? 100} onChange={e => onChange({ capacity: Number(e.target.value) })} />
        </div>

        <div>
          <label className="seller-label"><Tag size={12} /> {t('fields.tags')}</label>
          <input className="seller-input" placeholder={t('placeholders.tags')} value={data.tags ?? ''} onChange={e => onChange({ tags: e.target.value })} />
        </div>

        <div>
          <label className="seller-label"><Clock size={12} /> {t('fields.status')}</label>
          <select className="seller-input" value={data.status ?? 'active'} onChange={e => onChange({ status: e.target.value })}>
            <option value="active">{t('status.activeLong')}</option>
            <option value="draft">{t('status.draftLong')}</option>
            <option value="cancelled">{t('status.cancelled')}</option>
          </select>
        </div>

        <div className="ae-span">
          <label className="seller-label"><ImageIcon size={12} /> {t('fields.cover')}</label>
          <input className="seller-input" placeholder="https://… / drive.google.com/file/d/…" value={data.image_url ?? ''} onChange={e => onChange({ image_url: e.target.value })} />
          <p className="ae-hint">{t('hints.drive')}</p>
        </div>

        <div className="ae-span">
          <label className="seller-label">{t('fields.summary')}</label>
          <textarea className="seller-textarea" rows={2} placeholder={t('placeholders.summary')} value={data.description ?? ''} onChange={e => onChange({ description: e.target.value })} />
        </div>

        <div className="ae-span">
          <label className="seller-label"><FileText size={12} /> {t('fields.content')}</label>
          <textarea className="seller-textarea ae-content" rows={8} placeholder={t('placeholders.content')} value={data.content ?? ''} onChange={e => onChange({ content: e.target.value })} />
          <p className="ae-hint">{t('hints.content')}</p>
        </div>

        <div className="ae-span">
          <label className="seller-label"><Images size={12} /> {t('fields.gallery')}</label>
          <textarea className="seller-textarea" rows={4} placeholder={t('placeholders.gallery')} value={data.galleryText ?? ''} onChange={e => onChange({ galleryText: e.target.value })} />
          <p className="ae-hint">{t('hints.gallery', { count: galleryUrls.length })}</p>
          {(data.image_url || galleryUrls.length > 0) && (
            <div className="ae-gallery-preview">
              {[data.image_url, ...galleryUrls].filter(Boolean).slice(0, 12).map((u, i) => (
                // Preview only; the server converts Drive share links on save.
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={String(u)} alt="" onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="seller-form-actions">
        <button className="seller-btn-primary" onClick={onSave} disabled={saving || !data.title}>
          <Check size={14} /> {saving ? t('saving') : saveLabel}
        </button>
        <button className="seller-btn-ghost" onClick={onCancel}><X size={14} /> {t('cancel')}</button>
      </div>
    </div>
  );
}

/**
 * Events editor. Rendered inside the admin layout, or `embedded` in the
 * seller panel for staff granted the "events" permission.
 */
export default function AdminEvents({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations('eventsAdmin');
  const locale = useLocale();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Draft>({});
  const [saving, setSaving] = useState(false);
  const [attendees, setAttendees] = useState<Record<number, Ticket[]>>({});
  const [showAttendees, setShowAttendees] = useState<number | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/events?scope=all');
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
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
  const isPast = (ev: EventRecord) => !!ev.event_date && new Date(ev.event_date) < now;
  const counts = {
    upcoming: events.filter(e => !isPast(e)).length,
    past: events.filter(isPast).length,
    all: events.length,
  };
  const visible = events
    .filter(ev => tab === 'all' || (tab === 'past' ? isPast(ev) : !isPast(ev)))
    .sort((a, b) => {
      const da = a.event_date ? new Date(a.event_date).getTime() : Infinity;
      const db = b.event_date ? new Date(b.event_date).getTime() : Infinity;
      return tab === 'upcoming' ? da - db : db - da;
    });

  const submit = async (url: string, method: 'POST' | 'PATCH', draft: Draft) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toPayload(draft)),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || t('errors.save'));
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : t('errors.save'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    if (!form.title) return;
    if (await submit('/api/events', 'POST', form)) {
      setForm(EMPTY);
      setShowCreate(false);
      await load();
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (await submit(`/api/events/${editing}`, 'PATCH', editForm)) {
      setEditing(null);
      await load();
    }
  };

  const deleteEvent = async (id: number, title: string) => {
    if (!confirm(t('confirmDelete', { title }))) return;
    const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
    if (!res.ok) setError(t('errors.delete'));
    await load();
  };

  const startEdit = (ev: EventRecord) => {
    setShowCreate(false);
    setEditing(ev.id);
    setEditForm({
      title: ev.title, description: ev.description, content: ev.content ?? '',
      event_date: toLocalInput(ev.event_date), location: ev.location,
      image_url: ev.image_url, galleryText: (ev.gallery ?? []).join('\n'), price: Number(ev.price),
      capacity: ev.capacity, status: ev.status, tags: ev.tags ?? '',
    });
  };

  const dateFmt = (iso: string) => new Date(iso).toLocaleString(locale === 'es' ? 'es-VE' : 'en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const body = (
    <>
      <div className={embedded ? 'seller-page-header' : 'dashboard-header'}>
        <div>
          <h1 className={embedded ? 'seller-page-title' : 'ae-page-title'}>{t('title')}</h1>
          <p className="ae-sub">{t('subtitle')}</p>
        </div>
        <div className="ae-header-actions">
          <a href="/events" target="_blank" rel="noopener noreferrer" className="seller-btn-ghost"><ExternalLink size={14} /> {t('customerView')}</a>
          <button className="seller-btn-primary" onClick={() => { setShowCreate(v => !v); setEditing(null); }}>
            <Plus size={15} /> {t('newEvent')}
          </button>
        </div>
      </div>

      {error && <p className="ae-error" role="alert">{error}</p>}

      {showCreate && (
        <div className="ae-create">
          <EventForm
            data={form}
            onChange={patch => setForm(f => ({ ...f, ...patch }))}
            onSave={create}
            onCancel={() => setShowCreate(false)}
            saveLabel={t('create')}
            saving={saving}
          />
        </div>
      )}

      <div className="sp-tabs ae-tabs" role="tablist">
        {(['upcoming', 'all', 'past'] as const).map(k => (
          <button key={k} role="tab" aria-selected={tab === k} className={`sp-tab${tab === k ? ' active' : ''}`} onClick={() => setTab(k)}>
            {t(`tabs.${k}`)}
            <span className="sp-tab-count">{counts[k]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p className="ae-muted">{t('loading')}</p>
      ) : visible.length === 0 ? (
        <div className="ae-empty">
          <Calendar size={40} />
          <p>{t(`empty.${tab}`)}</p>
        </div>
      ) : (
        <div className="ae-list">
          {visible.map(ev => {
            const remaining = ev.capacity - ev.tickets_sold;
            const soldPct = ev.capacity > 0 ? Math.round((ev.tickets_sold / ev.capacity) * 100) : 0;
            const past = isPast(ev);
            const galleryCount = (ev.gallery ?? []).length;

            return (
              <div key={ev.id} className={`ae-event-card${editing === ev.id ? ' editing' : ''}`}>
                <div className="ae-event-row">
                  <div className="ae-thumb-wrap">
                    {ev.image_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={ev.image_url} alt={ev.title} className="ae-thumb" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <div className="ae-thumb-placeholder"><Calendar size={20} /></div>}
                  </div>

                  <div className="ae-info">
                    <div className="ae-title-row">
                      <span className="ae-title">{ev.title}</span>
                      <span className={`ae-status ae-status--${ev.status}`}>{t(`status.${ev.status === 'active' || ev.status === 'draft' || ev.status === 'cancelled' ? ev.status : 'active'}`)}</span>
                      {past && <span className="ae-status ae-status--past">{t('status.past')}</span>}
                    </div>

                    <div className="ae-meta">
                      {ev.event_date && <span><Calendar size={11} />{dateFmt(ev.event_date)}</span>}
                      {ev.location && <span><MapPin size={11} />{ev.location}</span>}
                      {galleryCount > 0 && <span><Images size={11} />{t('photos', { count: galleryCount })}</span>}
                      <span className="ae-price">{Number(ev.price) === 0 ? t('free') : `$${Number(ev.price).toFixed(2)}`}</span>
                    </div>

                    <div className="ae-capacity-bar-wrap">
                      <div className="ae-capacity-bar" style={{ width: `${Math.min(soldPct, 100)}%`, background: soldPct >= 90 ? '#ef4444' : soldPct >= 60 ? '#f59e0b' : '#10b981' }} />
                    </div>
                    <p className="ae-hint">{t('capacity', { sold: ev.tickets_sold, capacity: ev.capacity, remaining })}</p>
                  </div>

                  <div className="ae-actions">
                    <button className="seller-icon-btn edit" title={t('edit')} aria-label={t('edit')} onClick={() => editing === ev.id ? setEditing(null) : startEdit(ev)}>
                      <Edit3 size={14} />
                    </button>
                    <button className="seller-icon-btn cancel" title={t('delete')} aria-label={t('delete')} onClick={() => deleteEvent(ev.id, ev.title)}>
                      <Trash2 size={14} />
                    </button>
                    <button className="ae-attendees-btn" title={t('attendees')} aria-label={t('attendees')} onClick={() => showAttendees === ev.id ? setShowAttendees(null) : loadAttendees(ev.id)}>
                      <Users size={13} />
                    </button>
                  </div>
                </div>

                {editing === ev.id && (
                  <div className="ae-edit-panel">
                    <EventForm
                      data={editForm}
                      onChange={patch => setEditForm(f => ({ ...f, ...patch }))}
                      onSave={saveEdit}
                      onCancel={() => setEditing(null)}
                      saveLabel={t('save')}
                      saving={saving}
                    />
                  </div>
                )}

                {showAttendees === ev.id && (
                  <div className="ae-attendees-panel">
                    <div className="ae-attendees-head">
                      <h3>{t('attendeesCount', { count: attendees[ev.id]?.length ?? 0 })}</h3>
                      <button onClick={() => setShowAttendees(null)} aria-label={t('cancel')}><X size={14} /></button>
                    </div>
                    {!attendees[ev.id]?.length ? (
                      <p className="ae-muted">{t('noTickets')}</p>
                    ) : (
                      <div className="ae-table-scroll">
                        <table className="sup-table">
                          <thead><tr><th>{t('cols.name')}</th><th>{t('cols.email')}</th><th>{t('cols.qty')}</th><th>{t('cols.paid')}</th><th>{t('cols.order')}</th><th>{t('cols.date')}</th></tr></thead>
                          <tbody>
                            {attendees[ev.id].map(a => (
                              <tr key={a.id}>
                                <td>{a.customer_name}</td>
                                <td className="ae-muted-cell">{a.customer_email}</td>
                                <td>{a.quantity}</td>
                                <td><strong>${Number(a.total_paid).toFixed(2)}</strong></td>
                                <td className="ae-muted-cell">{a.order_id ?? '—'}</td>
                                <td className="ae-muted-cell">{new Date(a.purchased_at).toLocaleDateString(locale === 'es' ? 'es-VE' : 'en-US')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  if (embedded) return <div className="seller-page">{body}</div>;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">{body}</main>
    </div>
  );
}
