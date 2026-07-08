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

  const products = [
    {
      id: 1,
      name: t('product1.name'),
      description: t('product1.description'),
      image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=500&fit=crop',
      price: '$89',
    },
    {
      id: 2,
      name: t('product2.name'),
      description: t('product2.description'),
      image: 'https://images.unsplash.com/photo-1535536411ee-b64dde1fbfb0?w=400&h=500&fit=crop',
      price: '$129',
    },
    {
      id: 3,
      name: t('product3.name'),
      description: t('product3.description'),
      image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=500&fit=crop',
      price: '$149',
    },
    {
      id: 4,
      name: t('product4.name'),
      description: t('product4.description'),
      image: 'https://images.unsplash.com/photo-1469461436442-bb4016447550?w=400&h=500&fit=crop',
      price: '$99',
    },
  ];

  return (
    <section ref={sectionRef} className="featured-collection">
      <div className="featured-collection-container">
        <h2 ref={headingRef} className="featured-heading">
          {t('heading')}
        </h2>

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
