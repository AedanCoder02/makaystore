export interface Order {
  id: string;
  customerId: string;
  products: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: Date;
}

export const mockOrders: Order[] = [
  {
    id: 'order-001',
    customerId: 'cust-001',
    products: [
      { productId: '1', quantity: 2, price: 79.99 },
      { productId: '3', quantity: 1, price: 49.99 },
    ],
    total: 209.97,
    status: 'delivered',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60000),
  },
  {
    id: 'order-002',
    customerId: 'cust-002',
    products: [
      { productId: '4', quantity: 1, price: 129.99 },
    ],
    total: 129.99,
    status: 'shipped',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60000),
  },
  {
    id: 'order-003',
    customerId: 'cust-003',
    products: [
      { productId: '7', quantity: 1, price: 99.99 },
      { productId: '14', quantity: 1, price: 54.99 },
    ],
    total: 154.98,
    status: 'processing',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60000),
  },
  {
    id: 'order-004',
    customerId: 'cust-004',
    products: [
      { productId: '5', quantity: 1, price: 89.99 },
      { productId: '6', quantity: 2, price: 74.99 },
    ],
    total: 239.97,
    status: 'pending',
    createdAt: new Date(),
  },
];
