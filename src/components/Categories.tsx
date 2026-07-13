'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { animate } from 'animejs';
import Link from 'next/link';
import '../styles/categories.css';

export default function Categories() {
  const t = useTranslations('categories');
  const sectionRef = useRef<any>(null);
  const headingRef = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        if (headingRef.current) {
          animate(headingRef.current, {
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 700,
            easing: 'easeOutQuad',
          });
        }

        const cards = sectionRef.current?.querySelectorAll('.category-card');
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

  const categories = [
    {
      name: t('women.name'),
      description: t('women.description'),
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&h=400&fit=crop',
      slug: 'women',
    },
    {
      name: t('men.name'),
      description: t('men.description'),
      image: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=500&h=400&fit=crop',
      slug: 'men',
    },
    {
      name: t('accessories.name'),
      description: t('accessories.description'),
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=400&fit=crop',
      slug: 'accessories',
    },
  ];

  return (
    <section ref={sectionRef} id="categories" className="categories">
      <div className="categories-container">
        <h2 ref={headingRef} className="categories-heading">
          {t('heading')}
        </h2>

        <div className="categories-grid">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="category-card"
            >
              <div className="category-image-wrapper">
                <img
                  src={category.image}
                  alt={category.name}
                  className="category-image"
                />
                <div className="category-overlay" />
              </div>
              <div className="category-content">
                <h3 className="category-name">{category.name}</h3>
                <p className="category-description">{category.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
