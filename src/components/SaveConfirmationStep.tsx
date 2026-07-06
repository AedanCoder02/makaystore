'use client';

export default function SaveConfirmationStep({
  productId,
  imageUrl,
  glbUrl,
  onSave,
  onDiscard,
}: {
  productId: string;
  imageUrl: string;
  glbUrl: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="step-card confirm-card">
      <h2>Confirm & Save</h2>
      <div className="summary">
        <div className="summary-item">
          <label>Product ID:</label>
          <span>{productId}</span>
        </div>
        <div className="summary-item">
          <label>Image:</label>
          <img src={imageUrl} alt="Product" className="summary-thumbnail" />
        </div>
        <div className="summary-item">
          <label>3D Model:</label>
          <span>✓ Ready to save ({glbUrl.split('/').pop()})</span>
        </div>
      </div>

      <div className="button-group">
        <button className="btn btn-primary" onClick={onSave}>
          Save 3D Model
        </button>
        <button className="btn btn-secondary" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
