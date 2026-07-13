'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { animate } from 'animejs';
import Link from 'next/link';
import '../styles/featured-collection.css';

export default function FeaturedCollection() {
  const t = useTranslations('featured');
  const sectionRef = useRef<any>(null);
  const headingRef = useRef<any>(null);
  const items = t.raw('items') as any[];

  // Images are language-independent - same for EN and ES
  // Beach club lifestyle: golden hour, people wearing at beach, community events
  const PRODUCT_IMAGES = [
    'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=750&fit=crop', // person white tee beach
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=750&fit=crop', // woman beach fashion
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=750&fit=crop', // golden hour beach
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&h=750&fit=crop', // beach club experience
  ];

  // Scroll-triggered animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        // Animate heading
        if (headingRef.current) {
          animate(headingRef.current, {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 700,
            easing: 'easeOutQuad',
          });
        }

        // Stagger product cards
        const cards = sectionRef.current?.querySelectorAll('.product-card-featured');
        if (cards) {
          Array.from(cards).forEach((card: any, idx) => {
            animate(card, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 600,
              delay: idx * 100,
              easing: 'easeOutQuad',
            });
          });
        }

        observer.unobserve(entry.target);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const products = items.map((item: any, idx: number) => ({ ...item, image: PRODUCT_IMAGES[idx] ?? item.image }));

  return (
    <section ref={sectionRef} id="featured-collection" className="featured-collection">
      <div className="featured-collection-container">
        <h2 ref={headingRef} className="featured-heading">
          {t('title')}
        </h2>
        <p className="featured-subtitle">{t('description')}</p>

        <div className="featured-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card-featured">
              <div className="featured-image-wrapper">
                <img
                  src={product.image}
                  alt={product.name}
                  className="featured-image"
                />
                <div className="featured-overlay">
                  <Link href={`/products/${product.id}`} className="featured-view-link">
                    {t('viewProduct')}
                  </Link>
                </div>
              </div>
              <div className="featured-content">
                <h3 className="featured-name">{product.name}</h3>
                <p className="featured-description">{product.description}</p>
                <div className="featured-footer">
                  <span className="featured-price">{product.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="featured-cta-wrapper">
          <Link href="/products" className="featured-view-all">
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
