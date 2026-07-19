'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Image' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Max 10MB'); return; }
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed');
      const { url } = await res.json();
      onChange(url);
    } catch (err: any) {
      setError(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label className="seller-label">{label}</label>

      {value ? (
        /* Preview + replace */
        <div style={{ position: 'relative', width: 80, height: 80, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--makay-sand-cream)', flexShrink: 0 }}>
          <img src={value} alt="product" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { (e.target as HTMLImageElement).src = '/images/product-tshirt.jpg'; }} />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <X size={10} color="#fff" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.55)', border: 'none', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}
          >
            {uploading ? <Loader size={10} color="#fff" className="studio-spin" /> : <Upload size={10} color="#fff" />}
            <span style={{ fontSize: '0.6rem', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>Change</span>
          </button>
        </div>
      ) : (
        /* Upload button */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1rem', borderRadius: 8,
            border: '1.5px dashed var(--makay-sand-cream)',
            background: uploading ? 'rgba(0,0,0,0.02)' : '#fff',
            fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem',
            color: 'var(--makay-mauve)', cursor: uploading ? 'wait' : 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
            width: '100%',
          }}
        >
          {uploading
            ? <><Loader size={14} className="studio-spin" /> Uploading…</>
            : <><Upload size={14} /> Upload Image</>}
        </button>
      )}

      {error && <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: '#ef4444', margin: 0 }}>{error}</p>}

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}
