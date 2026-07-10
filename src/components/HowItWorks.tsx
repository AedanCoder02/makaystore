'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { animate } from 'animejs';
import { Lightbulb, Shirt, Users, Sparkles } from 'lucide-react';
import '../styles/how-it-works.css';

export default function HowItWorks() {
  const t = useTranslations('howItWorks');
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

        // Animate steps
        const steps = sectionRef.current?.querySelectorAll('.how-step');
        if (steps) {
          Array.from(steps).forEach((step: any, idx) => {
            animate(step, {
              opacity: [0, 1],
              translateY: [30, 0],
              duration: 600,
              delay: idx * 150,
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

  const steps = [
    {
      number: '01',
      title: t('step1.title'),
      description: t('step1.description'),
      Icon: Lightbulb,
    },
    {
      number: '02',
      title: t('step2.title'),
      description: t('step2.description'),
      Icon: Shirt,
    },
    {
      number: '03',
      title: t('step3.title'),
      description: t('step3.description'),
      Icon: Users,
    },
    {
      number: '04',
      title: t('step4.title'),
      description: t('step4.description'),
      Icon: Sparkles,
    },
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="how-it-works">
      <div className="how-it-works-container">
        <h2 ref={headingRef} className="how-heading">
          {t('heading')}
        </h2>

        <div className="how-steps-wrapper">
          <div className="how-steps">
            {steps.map((step, idx) => (
              <div key={idx} className="how-step">
                <div className="how-step-number">{step.number}</div>
                <div className="how-step-icon">
                  <step.Icon size={40} />
                </div>
                <h3 className="how-step-title">{step.title}</h3>
                <p className="how-step-description">{step.description}</p>
                {idx < steps.length - 1 && <div className="how-step-arrow">→</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
