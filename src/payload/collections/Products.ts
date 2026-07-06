import { CollectionConfig } from 'payload';

const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'sku',
      type: 'text',
      unique: true,
    },
    {
      name: 'stock',
      type: 'number',
      defaultValue: 0,
    },
    {
      name: 'variants',
      type: 'array',
      fields: [
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
        {
          name: 'type',
          type: 'select',
          options: ['dropshipping', 'storefront'],
          required: true,
        },
        {
          name: 'price',
          type: 'number',
        },
      ],
    },
  ],
};

export default Products;
