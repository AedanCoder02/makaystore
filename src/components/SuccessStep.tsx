'use client';

import Link from 'next/link';

export default function SuccessStep({
  productId,
  onGenerateAnother,
}: {
  productId: string;
  onGenerateAnother: () => void;
}) {
  return (
    <div className="step-card success-card">
      <div className="success-icon">✓</div>
      <h2>3D Model Saved!</h2>
      <p>Your product now has a 3D model.</p>

      <div className="button-group">
        <Link href={`/products/${productId}`} className="btn btn-primary">
          View Product
        </Link>
        <button className="btn btn-secondary" onClick={onGenerateAnother}>
          Generate Another
        </button>
        <Link href="/admin/products" className="btn btn-tertiary">
          Back to Products
        </Link>
      </div>
    </div>
  );
}
