'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Product } from '@/lib/mockData';
import ProductModel3D from '@/components/ProductModel3D';
import VariantSelector from '@/components/VariantSelector';
import QuantitySelector from '@/components/QuantitySelector';
import RelatedProducts from '@/components/RelatedProducts';
import ProductReviewsSection from '@/components/ProductReviewsSection';
import { useCart } from '@/hooks/useCart';
import '@/styles/product-detail.css';

interface Props {
  product: Product;
}

export default function ProductDetail({ product }: Props) {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [viewMode, setViewMode] = useState<'photo' | '3d'>('photo');
  const t = useTranslations('storefront');

  const [addToCartLabel, setAddToCartLabel]   = useState('');
  const [reviewsTitle, setReviewsTitle]       = useState('');
  const [relatedTitle, setRelatedTitle]       = useState('');

  useEffect(() => {
    fetch('/api/theme')
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, string>) => {
        setAddToCartLabel(d['page:product-detail:content:addToCart']   || '');
        setReviewsTitle(d['page:product-detail:content:reviewsTitle']  || '');
        setRelatedTitle(d['page:product-detail:content:relatedTitle']  || '');
      })
      .catch(() => {});
  }, []);

  const currentVariant = product.variants[selectedVariant];
  const displayPrice   = currentVariant?.price ?? product.price;
  const stock          = product.stock;

  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      variantId: currentVariant?.id ?? product.id,
      quantity: selectedQuantity,
      price: displayPrice,
      title: product.title,
      category: product.category,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* Left column: viewer with photo/3D toggle */}
        <div className="product-detail-left">
          <div className="pd-viewer-toggle">
            <button className={`pd-toggle-btn${viewMode === 'photo' ? ' active' : ''}`} onClick={() => setViewMode('photo')}>Photo</button>
            <button className={`pd-toggle-btn${viewMode === '3d' ? ' active' : ''}`} onClick={() => setViewMode('3d')}>3D</button>
          </div>

          <div className="pd-viewer-area">
            {viewMode === 'photo' ? (
              <div className="pd-photo-view">
                <img
                  src={product.image}
                  alt={product.title}
                  className="pd-product-image"
                  onError={e => { (e.target as HTMLImageElement).src = '/images/product-tshirt.jpg'; }}
                />
              </div>
            ) : (
              <ProductModel3D />
            )}
          </div>
        </div>

        {/* Right column: Info & CTA */}
        <div className="product-detail-right">
          <div className="product-header">
            <h1>{product.title}</h1>
            <p className="product-sku">{t('sku')}: {product.sku}</p>
          </div>

          <div className="product-description">
            <p>{product.description}</p>
          </div>

          <div className="product-price">
            <span className="price-label">{t('price')}</span>
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

          <button className="add-to-cart-btn" onClick={handleAddToCart} disabled={stock === 0}>
            {stock === 0 ? t('outOfStock') : (addToCartLabel || t('addToCart'))}
          </button>

          {addedToCart && (
            <div className="toast-success" role="status" aria-live="polite">
              ✓ {t('addedToCart')}
            </div>
          )}
        </div>
      </div>

      <RelatedProducts
        currentProductId={product.id}
        category={product.category}
        titleOverride={relatedTitle || undefined}
      />

      <ProductReviewsSection titleOverride={reviewsTitle || undefined} />
    </div>
  );
}
