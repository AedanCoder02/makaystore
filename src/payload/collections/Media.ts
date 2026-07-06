import { CollectionConfig } from 'payload';

const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
  },
  upload: true,
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
};

export default Media;
