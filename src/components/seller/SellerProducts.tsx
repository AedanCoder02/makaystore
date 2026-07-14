'use client';

import { useState } from 'react';
import { Edit3, Check, X, Plus, Tag, Truck } from 'lucide-react';

interface ProductRow {
  id: string; title: string; description: string; price: number;
  image: string; sku: string; category: string; productType: string; hasOverride: boolean;
}

export default function SellerProducts({ products }: { products: ProductRow[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Partial<ProductRow>>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ title: '', price: '', description: '', image_url: '', product_type: 'storefront' });

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (p: ProductRow) => {
    setEditing(p.id);
    setDrafts(d => ({ ...d, [p.id]: { price: p.price, description: p.description, image: p.image, productType: p.productType } }));
  };

  const saveEdit = async (p: ProductRow) => {
    setSaving(true);
    const d = drafts[p.id] ?? {};
    await fetch('/api/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: p.id,
        price: d.price ?? p.price,
        description: d.description ?? p.description,
        image_url: d.image ?? p.image,
        product_type: d.productType ?? p.productType,
      }),
    });
    setSaving(false);
    setEditing(null);
    window.location.reload();
  };

  const addProduct = async () => {
    if (!newProduct.title || !newProduct.price) return;
    setSaving(true);
    await fetch('/api/seller/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: `custom-${Date.now()}`,
        ...newProduct,
        price: parseFloat(newProduct.price),
      }),
    });
    setSaving(false);
    setShowAddForm(false);
    setNewProduct({ title: '', price: '', description: '', image_url: '', product_type: 'storefront' });
    window.location.reload();
  };

  return (
    <div className="seller-page">
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">Products</h1>
          <p className="seller-page-sub">Edit prices, descriptions, images. Changes override defaults.</p>
        </div>
        <button className="seller-btn-primary" onClick={() => setShowAddForm(v => !v)}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {showAddForm && (
        <div className="seller-add-form">
          <h3 className="seller-form-title">New Product</h3>
          <div className="seller-form-grid">
            <input className="seller-input" placeholder="Product name *" value={newProduct.title} onChange={e => setNewProduct(v => ({ ...v, title: e.target.value }))} />
            <input className="seller-input" placeholder="Price * (e.g. 49.99)" type="number" value={newProduct.price} onChange={e => setNewProduct(v => ({ ...v, price: e.target.value }))} />
            <input className="seller-input" placeholder="Image URL" value={newProduct.image_url} onChange={e => setNewProduct(v => ({ ...v, image_url: e.target.value }))} />
            <select className="seller-input" value={newProduct.product_type} onChange={e => setNewProduct(v => ({ ...v, product_type: e.target.value }))}>
              <option value="storefront">Storefront</option>
              <option value="dropshipping">Dropshipping</option>
            </select>
          </div>
          <textarea className="seller-textarea" placeholder="Description" value={newProduct.description} onChange={e => setNewProduct(v => ({ ...v, description: e.target.value }))} />
          <div className="seller-form-actions">
            <button className="seller-btn-primary" onClick={addProduct} disabled={saving}>
              {saving ? 'Saving...' : 'Save Product'}
            </button>
            <button className="seller-btn-ghost" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <input className="seller-search" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="seller-products-list">
        {filtered.map(p => (
          <div key={p.id} className={`seller-product-row${editing === p.id ? ' editing' : ''}`}>
            <div className="seller-product-img-wrap">
              <img src={editing === p.id ? (drafts[p.id]?.image ?? p.image) : p.image} alt={p.title} className="seller-product-img" onError={e => { (e.target as HTMLImageElement).src = '/images/product-tshirt.jpg'; }} />
            </div>

            <div className="seller-product-info">
              <div className="seller-product-title-row">
                <span className="seller-product-title">{p.title}</span>
                <span className={`seller-type-badge ${p.productType}`}>
                  {p.productType === 'dropshipping' ? <Truck size={11} /> : <Tag size={11} />}
                  {p.productType}
                </span>
                {p.hasOverride && <span className="seller-override-badge">Modified</span>}
              </div>
              <span className="seller-product-sku">{p.sku}</span>

              {editing === p.id ? (
                <div className="seller-edit-fields">
                  <div className="seller-edit-row">
                    <label className="seller-label">Price ($)</label>
                    <input className="seller-input sm" type="number" value={drafts[p.id]?.price ?? p.price}
                      onChange={e => setDrafts(d => ({ ...d, [p.id]: { ...d[p.id], price: Number(e.target.value) } }))} />
                  </div>
                  <div className="seller-edit-row">
                    <label className="seller-label">Image URL</label>
                    <input className="seller-input sm" value={drafts[p.id]?.image ?? p.image}
                      onChange={e => setDrafts(d => ({ ...d, [p.id]: { ...d[p.id], image: e.target.value } }))} />
                  </div>
                  <div className="seller-edit-row">
                    <label className="seller-label">Type</label>
                    <select className="seller-input sm" value={drafts[p.id]?.productType ?? p.productType}
                      onChange={e => setDrafts(d => ({ ...d, [p.id]: { ...d[p.id], productType: e.target.value } }))}>
                      <option value="storefront">Storefront</option>
                      <option value="dropshipping">Dropshipping</option>
                    </select>
                  </div>
                  <div className="seller-edit-row full">
                    <label className="seller-label">Description</label>
                    <textarea className="seller-textarea sm" value={drafts[p.id]?.description ?? p.description}
                      onChange={e => setDrafts(d => ({ ...d, [p.id]: { ...d[p.id], description: e.target.value } }))} rows={2} />
                  </div>
                </div>
              ) : (
                <p className="seller-product-desc">{p.description}</p>
              )}
            </div>

            <div className="seller-product-price-col">
              <span className="seller-product-price">${p.price.toFixed(2)}</span>
              {editing === p.id ? (
                <div className="seller-row-actions">
                  <button className="seller-icon-btn save" onClick={() => saveEdit(p)} disabled={saving}><Check size={16} /></button>
                  <button className="seller-icon-btn cancel" onClick={() => setEditing(null)}><X size={16} /></button>
                </div>
              ) : (
                <button className="seller-icon-btn edit" onClick={() => startEdit(p)}><Edit3 size={16} /></button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
