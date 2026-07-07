'use client';

import { ComponentData } from '@/stores/editorStore';
import { ReactNode } from 'react';

interface PageCanvasProps {
  components: ComponentData[];
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string) => void;
  onReorderComponent: (componentId: string, newOrder: number) => void;
}

const getComponentPreview = (component: ComponentData): ReactNode => {
  const content = component.content;

  switch (component.type) {
    case 'hero':
      return (
        <div
          className="canvas-hero"
          style={{
            backgroundColor: (content.bgColor as string) || '#f59e0b',
          }}
        >
          <div className="canvas-hero-content">
            <h1>{(content.title as string) || 'Titular del Hero'}</h1>
            <p>{(content.description as string) || 'Descripción breve'}</p>
            <button className="btn-canvas">
              {(content.buttonText as string) || 'Botón'}
            </button>
          </div>
        </div>
      );

    case 'features':
      return (
        <div className="canvas-features">
          <h2>{(content.title as string) || 'Características'}</h2>
          <div
            className="features-grid"
            style={{
              gridTemplateColumns: `repeat(${(content.columns as number) || 3}, 1fr)`,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} className="feature-card-preview">
                <div className="feature-icon">⭐</div>
                <div className="feature-text">Característica {i}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="canvas-testimonials">
          <h2>{(content.title as string) || 'Testimonios'}</h2>
          <div className="testimonials-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="testimonial-card-preview">
                {(content.showRating as boolean) && (
                  <div className="rating">⭐⭐⭐⭐⭐</div>
                )}
                <p className="testimonial-text">
                  &quot;Testimonio del cliente {i}&quot;
                </p>
                <p className="testimonial-author">- Cliente {i}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="canvas-cta">
          <div className="cta-content">
            <h2>{(content.title as string) || 'Llamada a la Acción'}</h2>
            <button
              className="btn-canvas"
              style={{
                backgroundColor: (content.buttonColor as string) || '#10b981',
              }}
            >
              {(content.buttonText as string) || 'Botón CTA'}
            </button>
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="canvas-faq">
          <h2>{(content.title as string) || 'Preguntas Frecuentes'}</h2>
          <p className="faq-description">
            {(content.description as string) || 'Descripción de las FAQs'}
          </p>
          <div className="faq-items">
            {[1, 2, 3].map((i) => (
              <div key={i} className="faq-item-preview">
                <div className="faq-question">¿Pregunta frecuente {i}?</div>
                <div className="faq-answer">Respuesta a la pregunta {i}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'gallery':
      return (
        <div className="canvas-gallery">
          <h2>{(content.title as string) || 'Galería'}</h2>
          <div
            className="gallery-grid"
            style={{
              gridTemplateColumns: `repeat(${(content.columns as number) || 3}, 1fr)`,
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="gallery-item-preview">
                <div className="gallery-placeholder">Imagen {i}</div>
              </div>
            ))}
          </div>
        </div>
      );

    default:
      return null;
  }
};

export default function PageCanvas({
  components,
  selectedComponentId,
  onSelectComponent,
  onReorderComponent,
}: PageCanvasProps) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (sourceIndex !== targetIndex && components[sourceIndex]) {
      onReorderComponent(components[sourceIndex].id, targetIndex);
    }
  };

  return (
    <div className="page-canvas">
      <div className="canvas-scroll">
        {components.length === 0 ? (
          <div className="canvas-empty">
            <p>Arrastra componentes aquí para empezar</p>
          </div>
        ) : (
          components.map((component, index) => (
            <div
              key={component.id}
              className={`canvas-component ${
                selectedComponentId === component.id ? 'selected' : ''
              }`}
              onClick={() => onSelectComponent(component.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectComponent(component.id);
                }
              }}
              aria-label={`Componente ${component.type}, orden ${index + 1}`}
            >
              {getComponentPreview(component)}
              {selectedComponentId === component.id && (
                <div className="component-selected-border" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
