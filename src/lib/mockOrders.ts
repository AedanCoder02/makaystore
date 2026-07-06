import { CartItem } from '@/stores/cartStore';

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  total: number;
  shippingAddress: {
    name: string;
    email: string;
    address: string;
    city: string;
    zip: string;
    country: string;
  };
  shippingMethod: 'standard' | 'express' | 'overnight';
  shippingCost: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  paymentId: string;
  createdAt: Date;
}

export interface OrderPayload {
  items: CartItem[];
  total: number;
  shippingAddress: {
    name: string;
    email: string;
    address: string;
    city: string;
    zip: string;
    country: string;
  };
  shippingMethod: 'standard' | 'express' | 'overnight';
  shippingCost: number;
  paymentId: string;
}

// Mock orders array — persists in module scope for this session
export const mockOrders: Order[] = [];

// Create order and add to mock array
export function createOrder(payload: OrderPayload): Order {
  const order: Order = {
    id: `ORD-${Date.now()}`,
    customerId: 'CUSTOMER_001', // Stub until Task 11+
    items: payload.items,
    total: payload.total,
    shippingAddress: payload.shippingAddress,
    shippingMethod: payload.shippingMethod,
    shippingCost: payload.shippingCost,
    status: 'pending',
    paymentId: payload.paymentId,
    createdAt: new Date(),
  };

  mockOrders.push(order);
  return order;
}

// Get order by ID
export function getOrderById(id: string): Order | undefined {
  return mockOrders.find((order) => order.id === id);
}
