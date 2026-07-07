'use client';

import { ComponentData } from '@/stores/editorStore';
import { ReactNode } from 'react';

interface PagePreviewProps {
  title: string;
  components: ComponentData[];
}

const renderComponentPreview = (component: ComponentData): ReactNode => {
  const content = component.content;

  switch (component.type) {
    case 'hero':
      return (
        <div
          className="preview-hero"
          style={{
            backgroundColor: (content.bgColor as string) || '#f59e0b',
          }}
        >
          <h1>{(content.title as string) || 'Titular del Hero'}</h1>
          <p>{(content.description as string) || 'Descripción breve'}</p>
          <button className="btn-primary">
            {(content.buttonText as string) || 'Botón'}
          </button>
        </div>
      );

    case 'features':
      return (
        <section className="preview-features">
          <h2>{(content.title as string) || 'Características'}</h2>
          <div
            className="preview-features-grid"
            style={{
              gridTemplateColumns: `repeat(${(content.columns as number) || 3}, 1fr)`,
            }}
          >
            {[1, 2, 3].map((i) => (
              <article key={i} className="feature-card">
                <div className="feature-icon">⭐</div>
                <h3>Característica {i}</h3>
                <p>Descripción de la característica {i}</p>
              </article>
            ))}
          </div>
        </section>
      );

    case 'testimonials':
      return (
        <section className="preview-testimonials">
          <h2>{(content.title as string) || 'Testimonios'}</h2>
          <div className="preview-testimonials-grid">
            {[1, 2, 3].map((i) => (
              <article key={i} className="testimonial-card">
                {(content.showRating as boolean) && (
                  <div className="rating">⭐⭐⭐⭐⭐</div>
                )}
                <p className="testimonial-text">
                  &quot;Testimonio del cliente {i}&quot;
                </p>
                <p className="testimonial-author">- Cliente {i}</p>
              </article>
            ))}
          </div>
        </section>
      );

    case 'cta':
      return (
        <section className="preview-cta">
          <div className="cta-inner">
            <h2>{(content.title as string) || 'Llamada a la Acción'}</h2>
            <button
              className="btn-primary"
              style={{
                backgroundColor: (content.buttonColor as string) || '#10b981',
              }}
            >
              {(content.buttonText as string) || 'Botón CTA'}
            </button>
          </div>
        </section>
      );

    case 'faq':
      return (
        <section className="preview-faq">
          <h2>{(content.title as string) || 'Preguntas Frecuentes'}</h2>
          <p className="faq-description">
            {(content.description as string) || 'Descripción de las FAQs'}
          </p>
          <div className="preview-faq-items">
            {[1, 2, 3].map((i) => (
              <details key={i} className="faq-item">
                <summary>¿Pregunta frecuente {i}?</summary>
                <p>Respuesta a la pregunta {i}</p>
              </details>
            ))}
          </div>
        </section>
      );

    case 'gallery':
      return (
        <section className="preview-gallery">
          <h2>{(content.title as string) || 'Galería'}</h2>
          <div
            className="preview-gallery-grid"
            style={{
              gridTemplateColumns: `repeat(${(content.columns as number) || 3}, 1fr)`,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <figure key={i} className="gallery-item">
                <div className="gallery-image-placeholder">Imagen {i}</div>
              </figure>
            ))}
          </div>
        </section>
      );

    default:
      return null;
  }
};

export default function PagePreview({ title, components }: PagePreviewProps) {
  return (
    <div className="page-preview">
      <div className="preview-header">
        <h1 className="preview-title">{title}</h1>
        <p className="preview-subtitle">Vista previa en vivo</p>
      </div>

      <div className="preview-content">
        {components.length === 0 ? (
          <div className="preview-empty">
            <p>Añade componentes para ver la vista previa</p>
          </div>
        ) : (
          components
            .sort((a, b) => a.order - b.order)
            .map((component) => (
              <div key={component.id} className="preview-component">
                {renderComponentPreview(component)}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
