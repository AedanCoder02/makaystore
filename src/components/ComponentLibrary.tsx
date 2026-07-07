'use client';

import { ComponentType, useEditorStore } from '@/stores/editorStore';

const COMPONENT_TYPES: Array<{
  type: ComponentType;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    type: 'hero',
    label: 'Hero',
    description: 'Large banner with headline and CTA',
    icon: '🎯',
  },
  {
    type: 'features',
    label: 'Features',
    description: 'Showcase key product features',
    icon: '⭐',
  },
  {
    type: 'testimonials',
    label: 'Testimonials',
    description: 'Customer reviews and quotes',
    icon: '💬',
  },
  {
    type: 'cta',
    label: 'Call to Action',
    description: 'Promotional button section',
    icon: '🔔',
  },
  {
    type: 'faq',
    label: 'FAQ',
    description: 'Frequently asked questions',
    icon: '❓',
  },
  {
    type: 'gallery',
    label: 'Gallery',
    description: 'Image showcase grid',
    icon: '🖼️',
  },
];

export function ComponentLibrary() {
  const addComponent = useEditorStore((state) => state.addComponent);

  return (
    <div className="component-library">
      <h2 className="library-title">Add Components</h2>
      <div className="components-grid">
        {COMPONENT_TYPES.map((component) => (
          <button
            key={component.type}
            className="component-card"
            onClick={() => addComponent(component.type)}
            type="button"
            title={component.description}
          >
            <span className="component-icon">{component.icon}</span>
            <span className="component-label">{component.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
