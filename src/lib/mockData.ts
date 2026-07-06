export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  sku: string;
  stock: number;
  category: string;
  variants: Array<{
    id: string;
    name: string;
    type: 'dropshipping' | 'storefront';
    price: number;
  }>;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Makay Beach Linen Shirt',
    description: 'Lightweight linen shirt perfect for beach days',
    price: 79.99,
    image: '/assets/images/beach-shirt.jpg',
    sku: 'MAKAY-001',
    stock: 45,
    category: 'Shirts',
    variants: [
      { id: 'v1', name: 'Small', type: 'storefront', price: 79.99 },
      { id: 'v2', name: 'Medium', type: 'dropshipping', price: 74.99 },
      { id: 'v3', name: 'Large', type: 'storefront', price: 79.99 },
    ],
  },
  {
    id: '2',
    title: 'Makay Vintage Denim Shorts',
    description: 'Comfortable vintage-style denim shorts',
    price: 69.99,
    image: '/assets/images/denim-shorts.jpg',
    sku: 'MAKAY-002',
    stock: 32,
    category: 'Shorts',
    variants: [
      { id: 'v4', name: 'XS', type: 'dropshipping', price: 64.99 },
      { id: 'v5', name: 'S', type: 'storefront', price: 69.99 },
      { id: 'v6', name: 'M', type: 'storefront', price: 69.99 },
    ],
  },
  {
    id: '3',
    title: 'Makay Organic Cotton Tank Top',
    description: 'Sustainable organic cotton tank for warm days',
    price: 49.99,
    image: '/assets/images/tank-top.jpg',
    sku: 'MAKAY-003',
    stock: 78,
    category: 'Shirts',
    variants: [
      { id: 'v7', name: 'Small', type: 'storefront', price: 49.99 },
      { id: 'v8', name: 'Medium', type: 'dropshipping', price: 44.99 },
    ],
  },
  {
    id: '4',
    title: 'Makay Resort Wrap Dress',
    description: 'Elegant wrap dress for resort wear',
    price: 129.99,
    image: '/assets/images/wrap-dress.jpg',
    sku: 'MAKAY-004',
    stock: 20,
    category: 'Dresses',
    variants: [
      { id: 'v9', name: 'XS', type: 'dropshipping', price: 124.99 },
      { id: 'v10', name: 'S', type: 'storefront', price: 129.99 },
    ],
  },
  {
    id: '5',
    title: 'Makay Linen Pants',
    description: 'Breathable linen pants for tropical climates',
    price: 89.99,
    image: '/assets/images/linen-pants.jpg',
    sku: 'MAKAY-005',
    stock: 35,
    category: 'Shorts',
    variants: [
      { id: 'v11', name: 'Small', type: 'storefront', price: 89.99 },
      { id: 'v12', name: 'Medium', type: 'dropshipping', price: 84.99 },
    ],
  },
  {
    id: '6',
    title: 'Makay Bohemian Blouse',
    description: 'Relaxed bohemian-style blouse',
    price: 74.99,
    image: '/assets/images/boho-blouse.jpg',
    sku: 'MAKAY-006',
    stock: 42,
    category: 'Shirts',
    variants: [
      { id: 'v13', name: 'XS', type: 'dropshipping', price: 69.99 },
      { id: 'v14', name: 'S', type: 'storefront', price: 74.99 },
    ],
  },
  {
    id: '7',
    title: 'Makay Stripe Swimsuit',
    description: 'Classic striped one-piece swimsuit',
    price: 99.99,
    image: '/assets/images/swimsuit.jpg',
    sku: 'MAKAY-007',
    stock: 28,
    category: 'Accessories',
    variants: [
      { id: 'v15', name: 'S', type: 'storefront', price: 99.99 },
      { id: 'v16', name: 'M', type: 'dropshipping', price: 94.99 },
    ],
  },
  {
    id: '8',
    title: 'Makay Lace Camisole',
    description: 'Delicate lace camisole top',
    price: 59.99,
    image: '/assets/images/lace-camisole.jpg',
    sku: 'MAKAY-008',
    stock: 55,
    category: 'Shirts',
    variants: [
      { id: 'v17', name: 'XS', type: 'storefront', price: 59.99 },
      { id: 'v18', name: 'S', type: 'dropshipping', price: 54.99 },
    ],
  },
  {
    id: '9',
    title: 'Makay Linen Blazer',
    description: 'Lightweight linen blazer for styling',
    price: 149.99,
    image: '/assets/images/linen-blazer.jpg',
    sku: 'MAKAY-009',
    stock: 16,
    category: 'Shirts',
    variants: [
      { id: 'v19', name: 'S', type: 'dropshipping', price: 144.99 },
      { id: 'v20', name: 'M', type: 'storefront', price: 149.99 },
    ],
  },
  {
    id: '10',
    title: 'Makay Floral Print Skirt',
    description: 'Vibrant floral print skirt',
    price: 84.99,
    image: '/assets/images/floral-skirt.jpg',
    sku: 'MAKAY-010',
    stock: 38,
    category: 'Dresses',
    variants: [
      { id: 'v21', name: 'XS', type: 'storefront', price: 84.99 },
      { id: 'v22', name: 'S', type: 'dropshipping', price: 79.99 },
    ],
  },
  {
    id: '11',
    title: 'Makay Crop Top',
    description: 'Modern crop top perfect for summer',
    price: 44.99,
    image: '/assets/images/crop-top.jpg',
    sku: 'MAKAY-011',
    stock: 67,
    category: 'Shirts',
    variants: [
      { id: 'v23', name: 'XS', type: 'dropshipping', price: 39.99 },
      { id: 'v24', name: 'S', type: 'storefront', price: 44.99 },
    ],
  },
  {
    id: '12',
    title: 'Makay Maxi Dress',
    description: 'Flowing maxi dress for evening wear',
    price: 139.99,
    image: '/assets/images/maxi-dress.jpg',
    sku: 'MAKAY-012',
    stock: 22,
    category: 'Dresses',
    variants: [
      { id: 'v25', name: 'S', type: 'storefront', price: 139.99 },
      { id: 'v26', name: 'M', type: 'dropshipping', price: 134.99 },
    ],
  },
  {
    id: '13',
    title: 'Makay Denim Jacket',
    description: 'Classic denim jacket for layering',
    price: 109.99,
    image: '/assets/images/denim-jacket.jpg',
    sku: 'MAKAY-013',
    stock: 26,
    category: 'Accessories',
    variants: [
      { id: 'v27', name: 'XS', type: 'dropshipping', price: 104.99 },
      { id: 'v28', name: 'S', type: 'storefront', price: 109.99 },
    ],
  },
  {
    id: '14',
    title: 'Makay Silk Scarf',
    description: 'Luxury silk scarf with beach prints',
    price: 54.99,
    image: '/assets/images/silk-scarf.jpg',
    sku: 'MAKAY-014',
    stock: 89,
    category: 'Accessories',
    variants: [
      { id: 'v29', name: 'One Size', type: 'storefront', price: 54.99 },
      { id: 'v30', name: 'One Size', type: 'dropshipping', price: 49.99 },
    ],
  },
  {
    id: '15',
    title: 'Makay Linen Cardigan',
    description: 'Comfortable linen cardigan for transitional weather',
    price: 94.99,
    image: '/assets/images/linen-cardigan.jpg',
    sku: 'MAKAY-015',
    stock: 31,
    category: 'Accessories',
    variants: [
      { id: 'v31', name: 'S', type: 'storefront', price: 94.99 },
      { id: 'v32', name: 'M', type: 'dropshipping', price: 89.99 },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return mockProducts.find((p) => p.id === id);
}
