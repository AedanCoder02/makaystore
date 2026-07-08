'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { animate } from 'animejs';
import '../styles/why-makay.css';

export default function WhyMakay() {
  const t = useTranslations('whyMakay');
  const sectionRef = useRef<any>(null);
  const headingRef = useRef<any>(null);

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

        // Stagger cards
        const cards = sectionRef.current?.querySelectorAll('.why-card');
        if (cards) {
          Array.from(cards).forEach((card: any, idx) => {
            animate(card, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 600,
              delay: idx * 120,
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

  const features = [
    {
      icon: '🌊',
      title: t('feature1.title'),
      description: t('feature1.description'),
    },
    {
      icon: '♻️',
      title: t('feature2.title'),
      description: t('feature2.description'),
    },
    {
      icon: '🤝',
      title: t('feature3.title'),
      description: t('feature3.description'),
    },
  ];

  return (
    <section ref={sectionRef} className="why-makay">
      <div className="why-makay-container">
        <h2 ref={headingRef} className="why-heading">
          {t('heading')}
        </h2>

        <div className="why-grid">
          {features.map((feature, idx) => (
            <div key={idx} className="why-card">
              <div className="why-icon">{feature.icon}</div>
              <h3 className="why-title">{feature.title}</h3>
              <p className="why-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
