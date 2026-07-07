'use client';

import { useEditorStore } from '@/stores/editorStore';
import { useState, useEffect } from 'react';

export function ComponentSettings() {
  const selectedComponentId = useEditorStore((state) => state.selectedComponentId);
  const pages = useEditorStore((state) => state.pages);
  const currentPageId = useEditorStore((state) => state.currentPageId);
  const updateComponent = useEditorStore((state) => state.updateComponent);
  const deleteComponent = useEditorStore((state) => state.deleteComponent);
  const selectComponent = useEditorStore((state) => state.selectComponent);

  const currentPage = pages.find((p) => p.id === currentPageId);
  const component = currentPage?.components.find((c) => c.id === selectedComponentId);
  const [formData, setFormData] = useState<Record<string, unknown>>(
    component?.content || {}
  );

  useEffect(() => {
    if (component) {
      setFormData(component.content || {});
    }
  }, [component]);

  if (!component) {
    return (
      <div className="component-settings">
        <p className="settings-empty">Select a component to edit</p>
      </div>
    );
  }

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateComponent(component.id, formData);
  };

  const handleDelete = () => {
    if (confirm('Delete this component?')) {
      deleteComponent(component.id);
      selectComponent(null);
    }
  };

  const renderFieldsForType = () => {
    switch (component.type) {
      case 'hero':
        return (
          <>
            <div className="form-group">
              <label>Headline</label>
              <input
                type="text"
                placeholder="Ej: Bienvenido a Makay"
                value={(formData.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Descripción breve"
                value={(formData.description as string) || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Button Text</label>
              <input
                type="text"
                placeholder="Ej: Comprar Ahora"
                value={(formData.buttonText as string) || ''}
                onChange={(e) => handleChange('buttonText', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Color de Fondo</label>
              <input
                type="color"
                value={(formData.bgColor as string) || '#f59e0b'}
                onChange={(e) => handleChange('bgColor', e.target.value)}
              />
            </div>
          </>
        );

      case 'features':
        return (
          <>
            <div className="form-group">
              <label>Título de Sección</label>
              <input
                type="text"
                placeholder="Ej: Nuestras Características"
                value={(formData.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Número de Columnas</label>
              <select
                value={(formData.columns as number) || 3}
                onChange={(e) => handleChange('columns', parseInt(e.target.value))}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
          </>
        );

      case 'testimonials':
        return (
          <>
            <div className="form-group">
              <label>Título de Sección</label>
              <input
                type="text"
                placeholder="Ej: Lo que dicen nuestros clientes"
                value={(formData.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Mostrar Estrellas</label>
              <select
                value={(formData.showRating as boolean) ? 'true' : 'false'}
                onChange={(e) => handleChange('showRating', e.target.value === 'true')}
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </>
        );

      case 'cta':
        return (
          <>
            <div className="form-group">
              <label>Headline</label>
              <input
                type="text"
                placeholder="Ej: Oferta Especial"
                value={(formData.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Button Text</label>
              <input
                type="text"
                placeholder="Ej: Aprovechar Ahora"
                value={(formData.buttonText as string) || ''}
                onChange={(e) => handleChange('buttonText', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Color del Botón</label>
              <input
                type="color"
                value={(formData.buttonColor as string) || '#10b981'}
                onChange={(e) => handleChange('buttonColor', e.target.value)}
              />
            </div>
          </>
        );

      case 'faq':
        return (
          <>
            <div className="form-group">
              <label>Título de Sección</label>
              <input
                type="text"
                placeholder="Ej: Preguntas Frecuentes"
                value={(formData.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder="Introducción a las FAQs"
                value={(formData.description as string) || ''}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </div>
          </>
        );

      case 'gallery':
        return (
          <>
            <div className="form-group">
              <label>Título de Sección</label>
              <input
                type="text"
                placeholder="Ej: Galería de Imágenes"
                value={(formData.title as string) || ''}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Número de Columnas</label>
              <select
                value={(formData.columns as number) || 3}
                onChange={(e) => handleChange('columns', parseInt(e.target.value))}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="component-settings">
      <h2 className="settings-title">Properties</h2>
      <div className="settings-type">
        <span className="settings-label">Type:</span>
        <span className="settings-value">{component.type}</span>
      </div>

      <form className="settings-form">
        {renderFieldsForType()}
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save Changes
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
