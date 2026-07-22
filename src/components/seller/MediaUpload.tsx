'use client';

import { useRef, useState } from 'react';
import { Upload, X, Loader, Video, Link } from 'lucide-react';

interface Props {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function MediaUpload({ value, onChange, label = 'Video' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const [urlInput, setUrlInput]   = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setError('File exceeds 8 MB limit. Paste a URL instead (Cloudinary, S3, CDN…).');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: fd });
      let data: Record<string, string> = {};
      try { data = await res.json(); } catch {}
      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleUrlSubmit() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setUrlInput('');
    setShowUrlInput(false);
    setError('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label className="seller-label">{label}</label>

      {value ? (
        /* Preview */
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--makay-sand-cream)' }}>
          <video
            src={value}
            muted
            style={{ width: '100%', maxHeight: 110, objectFit: 'cover', display: 'block' }}
          />
          <div style={{ display: 'flex', gap: 4, padding: '0.3rem', background: 'rgba(0,0,0,0.6)' }}>
            <button type="button" onClick={() => setShowUrlInput(true)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Link size={10} color="#fff" />
              <span style={{ fontSize: '0.6rem', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>Change URL</span>
            </button>
            <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}>
              {uploading ? <Loader size={10} color="#fff" className="studio-spin" /> : <Upload size={10} color="#fff" />}
              <span style={{ fontSize: '0.6rem', color: '#fff', fontFamily: 'var(--font-montserrat)' }}>Upload</span>
            </button>
            <button type="button" onClick={() => onChange('')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0.3rem' }}>
              <X size={10} color="#fff" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty state — two actions */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {/* Primary: paste URL */}
          {showUrlInput ? (
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="url"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://your-cdn.com/video.mp4"
                autoFocus
                style={{
                  flex: 1, padding: '0.5rem 0.7rem', borderRadius: 7,
                  border: '1.5px solid var(--makay-sand-cream)',
                  fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem',
                  color: 'var(--makay-dark-navy)', outline: 'none',
                }}
              />
              <button type="button" onClick={handleUrlSubmit}
                style={{ padding: '0.5rem 0.8rem', borderRadius: 7, background: 'var(--makay-peachy-rose)', border: 'none', color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', cursor: 'pointer' }}>
                Set
              </button>
              <button type="button" onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
                style={{ padding: '0.5rem', borderRadius: 7, background: 'transparent', border: '1px solid var(--makay-sand-cream)', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowUrlInput(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.55rem 1rem', borderRadius: 8,
                border: '1.5px solid var(--makay-peachy-rose)',
                background: 'transparent',
                fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem',
                color: 'var(--makay-peachy-rose)', cursor: 'pointer', width: '100%',
              }}>
              <Link size={14} /> Paste video URL
            </button>
          )}

          {/* Secondary: direct upload (small files only) */}
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 1rem', borderRadius: 8,
              border: '1.5px dashed var(--makay-sand-cream)',
              background: 'transparent',
              fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem',
              color: 'var(--makay-mauve)', cursor: uploading ? 'wait' : 'pointer', width: '100%',
            }}>
            {uploading
              ? <><Loader size={13} className="studio-spin" /> Uploading…</>
              : <><Upload size={13} /> Upload file (max 8 MB)</>}
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: '#ef4444', margin: 0 }}>
          {error}
        </p>
      )}

      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', color: 'var(--makay-mauve)', opacity: 0.6, margin: 0 }}>
        Replaces the ShaderGradient background. For large videos, upload to Cloudinary or S3 and paste the URL.
      </p>

      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,.mp4,.mov" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );
}
