// ─── Product fixtures ──────────────────────────────────────────────────────
const mockProducts = [
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
    ],
  },
];

const mockCartItem = {
  productId: '1',
  variantId: 'v1',
  quantity: 2,
  price: 79.99,
  title: 'Makay Beach Linen Shirt',
  category: 'Shirts',
};

const mockCartItem2 = {
  productId: '2',
  variantId: 'v4',
  quantity: 1,
  price: 64.99,
  title: 'Makay Vintage Denim Shorts',
  category: 'Shorts',
};

const mockAdminUser = {
  id: 'user_admin_001',
  email: 'admin@makay.com',
  firstName: 'Admin',
  lastName: 'User',
  publicMetadata: { role: 'admin' },
};

const mockWorkerUser = {
  id: 'user_worker_001',
  email: 'worker@makay.com',
  firstName: 'Worker',
  lastName: 'User',
  publicMetadata: { role: 'worker' },
};

const mockShippingData = {
  name: 'John Doe',
  email: 'john@example.com',
  address: '123 Main St',
  city: 'New York',
  zip: '10001',
  country: 'US',
};

const mockRotationProducts = ['prod-001', 'prod-002', 'prod-003'];

module.exports = {
  mockProducts,
  mockCartItem,
  mockCartItem2,
  mockAdminUser,
  mockWorkerUser,
  mockShippingData,
  mockRotationProducts,
};
