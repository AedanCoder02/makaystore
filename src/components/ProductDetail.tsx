'use client';

import { useState } from 'react';
import { Product } from '@/lib/mockData';
import ProductModel3D from '@/components/ProductModel3D';
import VariantSelector from '@/components/VariantSelector';
import QuantitySelector from '@/components/QuantitySelector';
import RelatedProducts from '@/components/RelatedProducts';
import ProductReviewsSection from '@/components/ProductReviewsSection';
import '@/styles/product-detail.css';

// Emoji map matching ProductCard
const CATEGORY_EMOJI: Record<string, string> = {
  Shirts: '👕',
  Shorts: '🩳',
  Dresses: '👗',
  Accessories: '🧣',
};

interface Props {
  product: Product;
}

export default function ProductDetail({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const currentVariant = product.variants[selectedVariant];
  const displayPrice = currentVariant?.price ?? product.price;
  const stock = product.stock;
  const emoji = CATEGORY_EMOJI[product.category] ?? '🛍️';

  const handleAddToCart = () => {
    // Task 8 will wire this to Zustand cart state
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);

    console.log('[Cart placeholder]', {
      productId: product.id,
      variantId: currentVariant?.id,
      quantity: selectedQuantity,
      price: displayPrice,
      title: product.title,
    });
  };

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Left column: Image & 3D viewer */}
        <div className="product-detail-left">
          <div className="product-image-placeholder">
            <span>{emoji}</span>
            <p>{product.category}</p>
          </div>
          <ProductModel3D />
        </div>

        {/* Right column: Info & CTA */}
        <div className="product-detail-right">
          <div className="product-header">
            <h1>{product.title}</h1>
            <p className="product-sku">SKU: {product.sku}</p>
          </div>

          <div className="product-description">
            <p>{product.description}</p>
          </div>

          <div className="product-price">
            <span className="price-label">Price</span>
            <span className="price-value">${displayPrice.toFixed(2)}</span>
          </div>

          <VariantSelector
            variants={product.variants}
            selectedVariant={selectedVariant}
            onChange={setSelectedVariant}
            stock={stock}
          />

          <QuantitySelector
            maxQuantity={Math.max(1, stock)}
            selectedQuantity={selectedQuantity}
            onChange={setSelectedQuantity}
          />

          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={stock === 0}
          >
            {stock === 0 ? 'Out of Stock' : 'Agregar al Carrito'}
          </button>

          {addedToCart && (
            <div className="toast-success" role="status" aria-live="polite">
              ✓ Añadido al carrito
            </div>
          )}
        </div>
      </div>

      <RelatedProducts
        currentProductId={product.id}
        category={product.category}
      />

      <ProductReviewsSection />
    </div>
  );
}
