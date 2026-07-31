'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, X, Plus, Trash2, HelpCircle, ChevronDown, AlertTriangle } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

type Status = 'active' | 'paused' | 'archived';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  sku: string;
  stock: number;
  category: string;
  status: Status;
  sizes: string[];
  colors: string[];
  provider: string;
  markup_percent: boolean;
  markup_amount: number;
}

const EMPTY_FORM = {
  title: '', price: '', description: '', image: '',
  sku: '', stock: '0', category: '', status: 'active' as Status,
  sizes: '', colors: '', provider: '',
  markup_percent: false, markup_amount: '0',
};

const STATUS_TABS: { key: 'all' | Status; label: string }[] = [
  { key: 'all',      label: 'Todos' },
  { key: 'active',   label: 'Activo' },
  { key: 'paused',   label: 'Pausado' },
  { key: 'archived', label: 'Archivado' },
];

const STATUS_COLOR: Record<Status, string> = {
  active:   '#10b981',
  paused:   '#f59e0b',
  archived: '#9ca3af',
};

function parseSizes(s: string[] | string | undefined): string {
  if (!s) return '';
  if (Array.isArray(s)) return s.join(', ');
  return s;
}
function parseColors(c: string[] | string | undefined): string {
  if (!c) return '';
  if (Array.isArray(c)) return c.join(', ');
  return c;
}

export default function SellerProducts() {
  const [products, setProducts]         = useState<Product[]>([]);
  const [loading, setLoading]           = useState(true);
  const [statusTab, setStatusTab]       = useState<'all' | Status>('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<Set<string>>(new Set());
  const [editing, setEditing]           = useState<string | null>(null);
  const [editDraft, setEditDraft]       = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [showCreate, setShowCreate]     = useState(false);
  const [newForm, setNewForm]           = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState('');
  const [damageTarget, setDamageTarget] = useState<Product | null>(null);
  const [damageForm, setDamageForm]     = useState({ type: 'damaged', quantity: '1', description: '', destination: '', receipt_url: '' });
  const [damageSubmitting, setDamageSubmitting] = useState(false);
  const tutorialStore = useTutorialStore();
  const tutorialUI    = useTutorialOverlay('seller-products-tour');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/products');
      if (!res.ok) throw new Error(await res.text());
      setProducts(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!tutorialStore.isCompleted('seller-products-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('seller-products-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const providers = ['all', ...Array.from(new Set(products.map(p => p.provider).filter(Boolean))).sort()];

  const visible = products.filter(p => {
    if (statusTab !== 'all' && p.status !== statusTab) return false;
    if (providerFilter !== 'all' && p.provider !== providerFilter) return false;
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q) || (p.provider ?? '').toLowerCase().includes(q);
  });

  // --- selection ---
  const toggleSelect = (id: string) => setSelected(s => {
    const n = new Set(s);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });
  const toggleAll = () => {
    if (selected.size === visible.length) setSelected(new Set());
    else setSelected(new Set(visible.map(p => p.id)));
  };
  const clearSelection = () => setSelected(new Set());

  // --- bulk status ---
  const bulkStatus = async (status: Status) => {
    const ids = [...selected];
    if (!ids.length) return;
    setSaving(true);
    await fetch('/api/seller/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, status }),
    });
    setSaving(false);
    clearSelection();
    await load();
  };

  // --- bulk delete ---
  const bulkDelete = async () => {
    const ids = [...selected];
    if (!ids.length || !confirm(`¿Eliminar ${ids.length} producto(s)?`)) return;
    setSaving(true);
    await Promise.all(ids.map(id => fetch(`/api/seller/products/${id}`, { method: 'DELETE' })));
    setSaving(false);
    clearSelection();
    await load();
  };

  // --- single delete ---
  const deleteOne = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    setSaving(true);
    await fetch(`/api/seller/products/${id}`, { method: 'DELETE' });
    setSaving(false);
    await load();
  };

  // --- edit ---
  const startEdit = (p: Product) => {
    setEditing(p.id);
    setEditDraft({
      title: p.title, price: String(p.price), description: p.description ?? '',
      image: p.image ?? '', sku: p.sku ?? '', stock: String(p.stock ?? 0),
      category: p.category ?? '', status: p.status,
      sizes: parseSizes(p.sizes), colors: parseColors(p.colors),
      provider: p.provider ?? '',
      markup_percent: p.markup_percent ?? false,
      markup_amount: String(p.markup_amount ?? 0),
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch(`/api/seller/products/${editing}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editDraft,
        price: parseFloat(editDraft.price),
        stock: parseInt(editDraft.stock, 10),
        sizes: editDraft.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: editDraft.colors.split(',').map(s => s.trim()).filter(Boolean),
        markup_percent: editDraft.markup_percent,
        markup_amount: parseFloat(editDraft.markup_amount) || 0,
      }),
    });
    setSaving(false);
    setEditing(null);
    await load();
  };

  // --- damage report ---
  const submitDamageReport = async () => {
    if (!damageTarget) return;
    setDamageSubmitting(true);
    await fetch('/api/seller/damage-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: damageTarget.id, ...damageForm, quantity: parseInt(damageForm.quantity, 10) || 1 }),
    });
    setDamageSubmitting(false);
    setDamageTarget(null);
    setDamageForm({ type: 'damaged', quantity: '1', description: '', destination: '', receipt_url: '' });
    await load();
  };

  // --- create ---
  const createProduct = async () => {
    if (!newForm.title || !newForm.price) return;
    setSaving(true);
    await fetch('/api/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newForm,
        price: parseFloat(newForm.price),
        stock: parseInt(newForm.stock, 10),
        sizes: newForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: newForm.colors.split(',').map(s => s.trim()).filter(Boolean),
        markup_percent: newForm.markup_percent,
        markup_amount: parseFloat(newForm.markup_amount) || 0,
      }),
    });
    setSaving(false);
    setShowCreate(false);
    setNewForm(EMPTY_FORM);
    await load();
  };

  const counts = {
    all:      products.length,
    active:   products.filter(p => p.status === 'active').length,
    paused:   products.filter(p => p.status === 'paused').length,
    archived: products.filter(p => p.status === 'archived').length,
  };

  return (
    <div className="seller-page">
      {tutorialUI}

      {/* Header */}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Productos</h1>
          <p className="seller-page-sub">Administra tu catálogo — crea, edita, publica o archiva.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="seller-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('seller-products-tour')} aria-label="Show tutorial">
            <HelpCircle size={16} />
          </button>
          <button className="seller-btn-primary" onClick={() => { setShowCreate(v => !v); setEditing(null); }}>
            <Plus size={16} /> Agregar Producto
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px' }}>{error}</p>}

      {/* Create form */}
      {showCreate && (
        <div className="seller-add-form">
          <h3 className="seller-form-title">Nuevo Producto</h3>
          <div className="seller-form-grid">
            <input className="seller-input" placeholder="Nombre del producto *" value={newForm.title}
              onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} />
            <input className="seller-input" placeholder="Precio * (ej. 49.99)" type="number" value={newForm.price}
              onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))} />
            <input className="seller-input" placeholder="Proveedor (ej. Havaianas, Makay, Tarbay)" value={newForm.provider}
              onChange={e => setNewForm(f => ({ ...f, provider: e.target.value }))} />
            <input className="seller-input" placeholder="SKU" value={newForm.sku}
              onChange={e => setNewForm(f => ({ ...f, sku: e.target.value }))} />
            <input className="seller-input" placeholder="Stock" type="number" value={newForm.stock}
              onChange={e => setNewForm(f => ({ ...f, stock: e.target.value }))} />
            <input className="seller-input" placeholder="Categoría" value={newForm.category}
              onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))} />
            <select className="seller-input" value={newForm.status}
              onChange={e => setNewForm(f => ({ ...f, status: e.target.value as Status }))}>
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="archived">Archivado</option>
            </select>
            <ImageUpload
              value={newForm.image}
              onChange={url => setNewForm(f => ({ ...f, image: url }))}
              label="Imagen del producto"
            />
            <input className="seller-input" placeholder="Tallas (ej. S, M, L, XL)" value={newForm.sizes}
              onChange={e => setNewForm(f => ({ ...f, sizes: e.target.value }))} />
          </div>
          <input className="seller-input" style={{ marginTop: '0.5rem' }} placeholder="Colores (ej. Negro, Blanco, Arena)" value={newForm.colors}
            onChange={e => setNewForm(f => ({ ...f, colors: e.target.value }))} />
          <textarea className="seller-textarea" placeholder="Descripción" value={newForm.description}
            onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
          <div className="seller-form-actions">
            <button className="seller-btn-primary" onClick={createProduct} disabled={saving || !newForm.title || !newForm.price}>
              {saving ? 'Guardando…' : 'Guardar Producto'}
            </button>
            <button className="seller-btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Status tabs */}
      <div className="sp-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            className={`sp-tab${statusTab === tab.key ? ' active' : ''}`}
            onClick={() => { setStatusTab(tab.key); clearSelection(); }}
          >
            {tab.label}
            <span className="sp-tab-count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {/* Provider filter */}
      {providers.length > 2 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <select
            className="seller-input"
            style={{ maxWidth: 220 }}
            value={providerFilter}
            onChange={e => { setProviderFilter(e.target.value); clearSelection(); }}
          >
            <option value="all">Todos los proveedores</option>
            {providers.filter(p => p !== 'all').map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      )}

      {/* Search + bulk actions */}
      <div className="sp-toolbar">
        <input className="seller-search" style={{ flex: 1, margin: 0 }} placeholder="Buscar por nombre, SKU o proveedor…"
          value={search} onChange={e => { setSearch(e.target.value); clearSelection(); }} />
        {selected.size > 0 && (
          <div className="sp-bulk">
            <span className="sp-bulk-count">{selected.size} seleccionados</span>
            <button className="sp-bulk-btn green" onClick={() => bulkStatus('active')} disabled={saving}>Publicar</button>
            <button className="sp-bulk-btn amber" onClick={() => bulkStatus('paused')} disabled={saving}>Pausar</button>
            <button className="sp-bulk-btn gray"  onClick={() => bulkStatus('archived')} disabled={saving}>Archivar</button>
            <button className="sp-bulk-btn red"   onClick={bulkDelete} disabled={saving}>Eliminar</button>
            <button className="sp-bulk-btn ghost" onClick={clearSelection}>Cancelar</button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Cargando…</p>
      ) : visible.length === 0 ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No se encontraron productos.</p>
      ) : (
        <div className="sp-table-wrap">
          <table className="sp-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" checked={selected.size === visible.length && visible.length > 0}
                    onChange={toggleAll} />
                </th>
                <th style={{ width: 56 }}></th>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'right' }}>Precio</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th>Estado</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => (
                <>
                  <tr key={p.id} className={editing === p.id ? 'sp-row editing' : 'sp-row'}>
                    <td>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} />
                    </td>
                    <td>
                      <img
                        src={p.image || '/images/product-tshirt.jpg'}
                        alt={p.title}
                        className="sp-thumb"
                        onError={e => { (e.target as HTMLImageElement).src = '/images/product-tshirt.jpg'; }}
                      />
                    </td>
                    <td>
                      <span className="sp-title">{p.title}</span>
                      {p.provider && (
                        <span style={{
                          display: 'inline-block', marginTop: '0.2rem',
                          padding: '0.1rem 0.5rem', borderRadius: 99,
                          fontSize: '0.68rem', fontWeight: 600,
                          background: '#f0e8df', color: '#9c6b3c',
                          fontFamily: 'var(--font-montserrat)',
                        }}>
                          {p.provider}
                        </span>
                      )}
                      {(p.sizes?.length > 0) && (
                        <span className="sp-meta">Tallas: {p.sizes.join(', ')}</span>
                      )}
                      {(p.colors?.length > 0) && (
                        <span className="sp-meta">Colores: {Array.isArray(p.colors) ? p.colors.join(', ') : p.colors}</span>
                      )}
                    </td>
                    <td className="sp-sku">{p.sku || '—'}</td>
                    <td className="sp-cat">{p.category || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${Number(p.price).toFixed(2)}
                      {p.markup_percent && <span style={{ display: 'block', fontSize: '0.62rem', color: '#10b981', fontWeight: 700 }}>+10%</span>}
                      {p.markup_amount > 0 && <span style={{ display: 'block', fontSize: '0.62rem', color: '#8b5cf6', fontWeight: 700 }}>+${Number(p.markup_amount).toFixed(2)}</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>{p.stock ?? 0}</td>
                    <td>
                      <span className="sp-status-dot" style={{ background: STATUS_COLOR[p.status] }} />
                      <span className="sp-status-label">{{ active: 'Activo', paused: 'Pausado', archived: 'Archivado' }[p.status]}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="seller-icon-btn edit" title="Editar" onClick={() => editing === p.id ? setEditing(null) : startEdit(p)}>
                          <ChevronDown size={14} style={{ transform: editing === p.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </button>
                        <button className="seller-icon-btn" title="Reportar daño / pérdida" style={{ color: '#f59e0b' }} onClick={() => setDamageTarget(p)}>
                          <AlertTriangle size={14} />
                        </button>
                        <button className="seller-icon-btn cancel" title="Eliminar" onClick={() => deleteOne(p.id, p.title)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {editing === p.id && (
                    <tr className="sp-edit-row">
                      <td colSpan={9}>
                        <div className="sp-edit-panel">
                          <div className="seller-form-grid">
                            <div>
                              <label className="seller-label">Nombre *</label>
                              <input className="seller-input" value={editDraft.title}
                                onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Precio *</label>
                              <input className="seller-input" type="number" value={editDraft.price}
                                onChange={e => setEditDraft(d => ({ ...d, price: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">SKU</label>
                              <input className="seller-input" value={editDraft.sku}
                                onChange={e => setEditDraft(d => ({ ...d, sku: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Stock</label>
                              <input className="seller-input" type="number" value={editDraft.stock}
                                onChange={e => setEditDraft(d => ({ ...d, stock: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Categoría</label>
                              <input className="seller-input" value={editDraft.category}
                                onChange={e => setEditDraft(d => ({ ...d, category: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Estado</label>
                              <select className="seller-input" value={editDraft.status}
                                onChange={e => setEditDraft(d => ({ ...d, status: e.target.value as Status }))}>
                                <option value="active">Activo</option>
                                <option value="paused">Pausado</option>
                                <option value="archived">Archivado</option>
                              </select>
                            </div>
                            <div>
                              <ImageUpload
                                value={editDraft.image}
                                onChange={url => setEditDraft(d => ({ ...d, image: url }))}
                                label="Imagen del producto"
                              />
                            </div>
                            <div>
                              <label className="seller-label">Tallas (separadas por coma)</label>
                              <input className="seller-input" placeholder="S, M, L, XL" value={editDraft.sizes}
                                onChange={e => setEditDraft(d => ({ ...d, sizes: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Colores (separados por coma)</label>
                              <input className="seller-input" placeholder="Negro, Blanco, Arena" value={editDraft.colors}
                                onChange={e => setEditDraft(d => ({ ...d, colors: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Proveedor</label>
                              <input className="seller-input" placeholder="ej. Havaianas, Makay, Tarbay" value={editDraft.provider}
                                onChange={e => setEditDraft(d => ({ ...d, provider: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', gridColumn: 'span 2' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-dark-navy)' }}>
                                <input
                                  type="checkbox"
                                  checked={editDraft.markup_percent}
                                  onChange={e => setEditDraft(d => ({ ...d, markup_percent: e.target.checked }))}
                                />
                                Agregar 10% al precio
                              </label>
                            </div>
                            <div>
                              <label className="seller-label">Monto adicional fijo ($)</label>
                              <input className="seller-input" type="number" min="0" step="0.01" placeholder="0.00"
                                value={editDraft.markup_amount}
                                onChange={e => setEditDraft(d => ({ ...d, markup_amount: e.target.value }))} />
                            </div>
                          </div>
                          <div>
                            <label className="seller-label">Descripción</label>
                            <textarea className="seller-textarea sm" rows={2} value={editDraft.description}
                              onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))} />
                          </div>
                          <div className="seller-form-actions">
                            <button className="seller-btn-primary" onClick={saveEdit} disabled={saving}>
                              <Check size={14} /> {saving ? 'Guardando…' : 'Guardar cambios'}
                            </button>
                            <button className="seller-btn-ghost" onClick={() => setEditing(null)}>
                              <X size={14} /> Cancelar
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Damage / lost modal */}
      {damageTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) setDamageTarget(null); }}
        >
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, padding: '1.75rem', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h3 style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--makay-dark-navy)' }}>
                Reportar daño / pérdida
              </h3>
              <button onClick={() => setDamageTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--makay-mauve)' }}><X size={18} /></button>
            </div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: '0 0 1.25rem' }}>
              Producto: <strong style={{ color: 'var(--makay-dark-navy)' }}>{damageTarget.title}</strong>
            </p>

            {[
              { label: 'Tipo', content: (
                <select className="seller-input" value={damageForm.type} onChange={e => setDamageForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="damaged">Dañado</option>
                  <option value="lost">Perdido</option>
                </select>
              )},
              { label: 'Cantidad', content: (
                <input className="seller-input" type="number" min="1" value={damageForm.quantity}
                  onChange={e => setDamageForm(f => ({ ...f, quantity: e.target.value }))} />
              )},
              { label: 'Descripción', content: (
                <textarea className="seller-textarea sm" rows={2} placeholder="¿Qué ocurrió?" value={damageForm.description}
                  onChange={e => setDamageForm(f => ({ ...f, description: e.target.value }))} />
              )},
              { label: 'Destino / paradero', content: (
                <input className="seller-input" placeholder="Dónde fue / qué pasó con el producto" value={damageForm.destination}
                  onChange={e => setDamageForm(f => ({ ...f, destination: e.target.value }))} />
              )},
            ].map(({ label, content }) => (
              <div key={label} style={{ marginBottom: '0.875rem' }}>
                <label className="seller-label">{label}</label>
                {content}
              </div>
            ))}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="seller-btn-primary" onClick={submitDamageReport} disabled={damageSubmitting} style={{ flex: 1 }}>
                {damageSubmitting ? 'Enviando…' : 'Enviar reporte'}
              </button>
              <button className="seller-btn-ghost" onClick={() => setDamageTarget(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
