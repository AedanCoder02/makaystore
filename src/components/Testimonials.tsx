'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { animate } from 'animejs';
import '../styles/testimonials.css';

export default function Testimonials() {
  const t = useTranslations('testimonials');
  const sectionRef = useRef<any>(null);
  const headingRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonialList = [
    {
      name: t('testimonial1.name'),
      role: t('testimonial1.role'),
      text: t('testimonial1.text'),
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    },
    {
      name: t('testimonial2.name'),
      role: t('testimonial2.role'),
      text: t('testimonial2.text'),
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    },
    {
      name: t('testimonial3.name'),
      role: t('testimonial3.role'),
      text: t('testimonial3.text'),
      rating: 5,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    },
  ];

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

        observer.unobserve(entry.target);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonialList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonialList.length]);

  return (
    <section ref={sectionRef} className="testimonials">
      <div className="testimonials-container">
        <h2 ref={headingRef} className="testimonials-heading">
          {t('heading')}
        </h2>

        <div className="testimonials-carousel">
          {testimonialList.map((testimonial, idx) => (
            <div
              key={idx}
              className={`testimonial-card ${idx === currentIndex ? 'active' : ''}`}
            >
              <div className="testimonial-rating">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <span key={i}>⭐</span>
                ))}
              </div>

              <p className="testimonial-text">&ldquo;{testimonial.text}&rdquo;</p>

              <div className="testimonial-author">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="testimonial-avatar"
                />
                <div className="testimonial-info">
                  <p className="testimonial-name">{testimonial.name}</p>
                  <p className="testimonial-role">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="testimonials-dots">
          {testimonialList.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
