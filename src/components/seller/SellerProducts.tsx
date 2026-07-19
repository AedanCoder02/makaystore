'use client';

import { useState, useEffect, useCallback } from 'react';
import { Edit3, Check, X, Plus, Trash2, HelpCircle, ChevronDown } from 'lucide-react';
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
}

const EMPTY_FORM = {
  title: '', price: '', description: '', image: '',
  sku: '', stock: '0', category: '', status: 'active' as Status,
  sizes: '', colors: '',
};

const STATUS_TABS: { key: 'all' | Status; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'paused',   label: 'Paused' },
  { key: 'archived', label: 'Archived' },
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
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusTab, setStatusTab]   = useState<'all' | Status>('all');
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [editing, setEditing]       = useState<string | null>(null);
  const [editDraft, setEditDraft]   = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm]       = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const tutorialStore = useTutorialStore();
  const tutorialUI    = useTutorialOverlay('seller-products-tour');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/seller/products');
      if (!res.ok) throw new Error(await res.text());
      setProducts(await res.json());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load products');
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

  const visible = products.filter(p => {
    if (statusTab !== 'all' && p.status !== statusTab) return false;
    const q = search.toLowerCase();
    return !q || p.title.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q);
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
    if (!ids.length || !confirm(`Delete ${ids.length} product(s)?`)) return;
    setSaving(true);
    await Promise.all(ids.map(id => fetch(`/api/seller/products/${id}`, { method: 'DELETE' })));
    setSaving(false);
    clearSelection();
    await load();
  };

  // --- single delete ---
  const deleteOne = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
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
      }),
    });
    setSaving(false);
    setEditing(null);
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
          <h1 className="seller-page-title">Products</h1>
          <p className="seller-page-sub">Manage your catalog — create, edit, publish, or archive.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="seller-btn-ghost help-button" onClick={() => tutorialStore.showTutorial('seller-products-tour')} aria-label="Show tutorial">
            <HelpCircle size={16} />
          </button>
          <button className="seller-btn-primary" onClick={() => { setShowCreate(v => !v); setEditing(null); }}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {error && <p style={{ color: '#ef4444', marginBottom: '1rem', padding: '0.75rem', background: '#fef2f2', borderRadius: '8px' }}>{error}</p>}

      {/* Create form */}
      {showCreate && (
        <div className="seller-add-form">
          <h3 className="seller-form-title">New Product</h3>
          <div className="seller-form-grid">
            <input className="seller-input" placeholder="Product name *" value={newForm.title}
              onChange={e => setNewForm(f => ({ ...f, title: e.target.value }))} />
            <input className="seller-input" placeholder="Price * (e.g. 49.99)" type="number" value={newForm.price}
              onChange={e => setNewForm(f => ({ ...f, price: e.target.value }))} />
            <input className="seller-input" placeholder="SKU" value={newForm.sku}
              onChange={e => setNewForm(f => ({ ...f, sku: e.target.value }))} />
            <input className="seller-input" placeholder="Stock qty" type="number" value={newForm.stock}
              onChange={e => setNewForm(f => ({ ...f, stock: e.target.value }))} />
            <input className="seller-input" placeholder="Category" value={newForm.category}
              onChange={e => setNewForm(f => ({ ...f, category: e.target.value }))} />
            <select className="seller-input" value={newForm.status}
              onChange={e => setNewForm(f => ({ ...f, status: e.target.value as Status }))}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
            <ImageUpload
              value={newForm.image}
              onChange={url => setNewForm(f => ({ ...f, image: url }))}
              label="Product Image"
            />
            <input className="seller-input" placeholder="Sizes (comma-separated: S, M, L, XL)" value={newForm.sizes}
              onChange={e => setNewForm(f => ({ ...f, sizes: e.target.value }))} />
          </div>
          <input className="seller-input" style={{ marginTop: '0.5rem' }} placeholder="Colors (comma-separated: Black, White, Sand)" value={newForm.colors}
            onChange={e => setNewForm(f => ({ ...f, colors: e.target.value }))} />
          <textarea className="seller-textarea" placeholder="Description" value={newForm.description}
            onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} />
          <div className="seller-form-actions">
            <button className="seller-btn-primary" onClick={createProduct} disabled={saving || !newForm.title || !newForm.price}>
              {saving ? 'Saving…' : 'Save Product'}
            </button>
            <button className="seller-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
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

      {/* Search + bulk actions */}
      <div className="sp-toolbar">
        <input className="seller-search" style={{ flex: 1, margin: 0 }} placeholder="Search by name or SKU…"
          value={search} onChange={e => { setSearch(e.target.value); clearSelection(); }} />
        {selected.size > 0 && (
          <div className="sp-bulk">
            <span className="sp-bulk-count">{selected.size} selected</span>
            <button className="sp-bulk-btn green" onClick={() => bulkStatus('active')} disabled={saving}>Publish</button>
            <button className="sp-bulk-btn amber" onClick={() => bulkStatus('paused')} disabled={saving}>Pause</button>
            <button className="sp-bulk-btn gray"  onClick={() => bulkStatus('archived')} disabled={saving}>Archive</button>
            <button className="sp-bulk-btn red"   onClick={bulkDelete} disabled={saving}>Delete</button>
            <button className="sp-bulk-btn ghost" onClick={clearSelection}>Cancel</button>
          </div>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>Loading…</p>
      ) : visible.length === 0 ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>No products found.</p>
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
                <th>Product</th>
                <th>SKU</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th>Status</th>
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
                      {(p.sizes?.length > 0) && (
                        <span className="sp-meta">Sizes: {p.sizes.join(', ')}</span>
                      )}
                      {(p.colors?.length > 0) && (
                        <span className="sp-meta">Colors: {Array.isArray(p.colors) ? p.colors.join(', ') : p.colors}</span>
                      )}
                    </td>
                    <td className="sp-sku">{p.sku || '—'}</td>
                    <td className="sp-cat">{p.category || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${Number(p.price).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>{p.stock ?? 0}</td>
                    <td>
                      <span className="sp-status-dot" style={{ background: STATUS_COLOR[p.status] }} />
                      <span className="sp-status-label">{p.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className="seller-icon-btn edit" title="Edit" onClick={() => editing === p.id ? setEditing(null) : startEdit(p)}>
                          <ChevronDown size={14} style={{ transform: editing === p.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                        </button>
                        <button className="seller-icon-btn cancel" title="Delete" onClick={() => deleteOne(p.id, p.title)}>
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
                              <label className="seller-label">Name *</label>
                              <input className="seller-input" value={editDraft.title}
                                onChange={e => setEditDraft(d => ({ ...d, title: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Price *</label>
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
                              <label className="seller-label">Category</label>
                              <input className="seller-input" value={editDraft.category}
                                onChange={e => setEditDraft(d => ({ ...d, category: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Status</label>
                              <select className="seller-input" value={editDraft.status}
                                onChange={e => setEditDraft(d => ({ ...d, status: e.target.value as Status }))}>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="archived">Archived</option>
                              </select>
                            </div>
                            <div>
                              <ImageUpload
                                value={editDraft.image}
                                onChange={url => setEditDraft(d => ({ ...d, image: url }))}
                                label="Product Image"
                              />
                            </div>
                            <div>
                              <label className="seller-label">Sizes (comma-sep)</label>
                              <input className="seller-input" placeholder="S, M, L, XL" value={editDraft.sizes}
                                onChange={e => setEditDraft(d => ({ ...d, sizes: e.target.value }))} />
                            </div>
                            <div>
                              <label className="seller-label">Colors (comma-sep)</label>
                              <input className="seller-input" placeholder="Black, White, Sand" value={editDraft.colors}
                                onChange={e => setEditDraft(d => ({ ...d, colors: e.target.value }))} />
                            </div>
                          </div>
                          <div>
                            <label className="seller-label">Description</label>
                            <textarea className="seller-textarea sm" rows={2} value={editDraft.description}
                              onChange={e => setEditDraft(d => ({ ...d, description: e.target.value }))} />
                          </div>
                          <div className="seller-form-actions">
                            <button className="seller-btn-primary" onClick={saveEdit} disabled={saving}>
                              <Check size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                            <button className="seller-btn-ghost" onClick={() => setEditing(null)}>
                              <X size={14} /> Cancel
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
    </div>
  );
}
