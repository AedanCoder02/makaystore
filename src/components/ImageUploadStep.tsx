'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader } from 'lucide-react';

export default function ImageUploadStep({
  onImageUploaded,
  onGenerateClick,
  productId,
}: {
  onImageUploaded: (url: string) => void;
  onGenerateClick: () => void;
  productId?: string;
}) {
  const [preview, setPreview] = useState('');      // local blob for display
  const [uploadedUrl, setUploadedUrl] = useState(''); // remote FAL URL for generation
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadError('');
    setUploading(true);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploadedUrl('');
    onImageUploaded('');

    try {
      // Upload to FAL storage via our server route
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload-image', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setUploadedUrl(data.url);
      onImageUploaded(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setPreview('');
      onImageUploaded('');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleReset = () => {
    setPreview('');
    setUploadedUrl('');
    setUploadError('');
    onImageUploaded('');
  };

  return (
    <div className="wizard-step-card">
      <div className="wizard-step-header">
        <div className="wizard-step-icon">📷</div>
        <div>
          <h2 className="wizard-step-title">Upload Product Image</h2>
          <p className="wizard-step-desc">
            Best results: clean background, full product visible, good lighting
          </p>
        </div>
      </div>

      {uploadError && (
        <div className="gen3d-error" style={{ marginBottom: '1rem' }}>
          <span>⚠</span> {uploadError}
        </div>
      )}

      {!preview ? (
        <div
          className={`upload-drop-zone${isDragging ? ' dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="upload-icon-wrap">
            <Upload size={28} />
          </div>
          <p className="upload-drop-title">Drop image here or click to browse</p>
          <p className="upload-drop-hint">PNG, JPG, WEBP — max 10MB</p>
          <div className="upload-tips">
            <span className="upload-tip good">✓ White/plain background</span>
            <span className="upload-tip good">✓ Full product in frame</span>
            <span className="upload-tip bad">✗ Multiple items</span>
            <span className="upload-tip bad">✗ Cluttered background</span>
          </div>
        </div>
      ) : (
        <div className="upload-preview-wrap">
          <img src={preview} alt="Product preview" className="upload-preview-img" />
          <div className="upload-preview-overlay">
            <button className="upload-preview-change" onClick={handleReset}>
              <X size={14} /> Change
            </button>
          </div>
          <div className="upload-preview-ready">
            {uploading ? (
              <><Loader size={14} className="upload-spinner" /> Uploading to FAL storage…</>
            ) : uploadedUrl ? (
              <><ImageIcon size={14} /> Image uploaded — ready for generation</>
            ) : null}
          </div>
        </div>
      )}

      <div className="wizard-step-actions">
        <button
          className="wizard-btn-primary"
          onClick={onGenerateClick}
          disabled={!uploadedUrl || uploading}
          style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}
        >
          {uploading ? 'Uploading…' : 'Generate 3D Model →'}
        </button>
      </div>
    </div>
  );
}
