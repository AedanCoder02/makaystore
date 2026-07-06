import { GlobalConfig } from 'payload';

const DesignSystem: GlobalConfig = {
  slug: 'design-system',
  fields: [
    {
      name: 'primaryColor',
      type: 'text',
      defaultValue: '#F59E0B',
      required: true,
    },
    {
      name: 'secondaryColor',
      type: 'text',
      defaultValue: '#FBBF24',
      required: true,
    },
    {
      name: 'accentColor',
      type: 'text',
      defaultValue: '#D97706',
      required: true,
    },
    {
      name: 'fontFamily',
      type: 'text',
      defaultValue: "'Inter', sans-serif",
      required: true,
    },
    {
      name: 'fontSize',
      type: 'number',
      defaultValue: 16,
      required: true,
    },
  ],
};

export default DesignSystem;
