'use client';

import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';

export default function ImageUploadStep({
  onImageUploaded,
  onGenerateClick,
  productId,
}: {
  onImageUploaded: (url: string) => void;
  onGenerateClick: () => void;
  productId: string;
}) {
  const [preview, setPreview] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);
      onImageUploaded(url);
    };
    reader.readAsDataURL(file);
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
            <button
              className="upload-preview-change"
              onClick={() => {
                setPreview('');
                onImageUploaded('');
              }}
            >
              <X size={14} /> Change
            </button>
          </div>
          <div className="upload-preview-ready">
            <ImageIcon size={14} /> Image ready for generation
          </div>
        </div>
      )}

      <div className="wizard-step-actions">
        <button
          className="wizard-btn-primary"
          onClick={onGenerateClick}
          disabled={!preview}
          style={{ fontSize: '1rem', padding: '0.8rem 2rem' }}
        >
          Generate 3D Model →
        </button>
      </div>
    </div>
  );
}
