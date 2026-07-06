'use client';

import { useState } from 'react';

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

  const handleFile = (file: File) => {
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
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  return (
    <div className="step-card">
      <h2>Upload Product Image</h2>

      {!preview ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragEnter={() => setIsDragging(true)}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <p>Drag image here or click to select</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: 'none' }}
            id="image-input"
          />
          <label htmlFor="image-input" className="btn btn-secondary">
            Choose File
          </label>
        </div>
      ) : (
        <div className="preview-section">
          <img src={preview} alt="Preview" className="preview-image" />
          <button
            className="btn btn-secondary"
            onClick={() => {
              setPreview('');
              onImageUploaded('');
            }}
          >
            Change Image
          </button>
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={onGenerateClick}
        disabled={!preview}
      >
        Generate 3D Model →
      </button>
    </div>
  );
}
