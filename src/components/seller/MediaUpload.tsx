'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader, Video } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function MediaUpload({ value, onChange, label = 'Video' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) { setError('Max 200 MB'); return; }
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
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--makay-sand-cream)' }}>
          <video
            src={value}
            muted
            style={{ width: '100%', maxHeight: 120, objectFit: 'cover', display: 'block' }}
          />
          <div style={{ display: 'flex', gap: 4, padding: '0.3rem', background: 'rgba(0,0,0,0.55)' }}>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem' }}
            >
              {uploading ? <Loader size={10} color="#fff" className="studio-spin" /> : <Upload size={10} color="#fff" />}
              <span style={{ fontSize: '0.6rem', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>Replace</span>
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.2rem 0.4rem' }}
            >
              <X size={10} color="#fff" />
            </button>
          </div>
        </div>
      ) : (
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
            : <><Video size={14} /> Upload Video (MP4 / MOV)</>}
        </button>
      )}

      {error && <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: '#ef4444', margin: 0 }}>{error}</p>}
      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', color: 'var(--makay-mauve)', opacity: 0.6, margin: 0 }}>
        Replaces the animated gradient background. Max 200 MB.
      </p>

      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}
