/**
 * Smoke tests for small presentation components.
 * Covers: SaveConfirmationStep, SuccessStep, ActivityLogWorker, TaskListWorker,
 *         OrderSummaryCheckout, RelatedProducts, VariantSelector, WorkerStatusOverview
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      todayActivity: "Today's Activity",
      noActivity: 'No activity today',
      clockIn: 'Clock In',
      clockOut: 'Clock Out',
      tasksToday: 'Tasks Today',
      noTasks: 'No tasks',
      orderSummary: 'Order Summary',
      items: 'Items',
      subtotal: 'Subtotal',
      shippingCost: 'Shipping',
      total: 'Total',
      relatedProducts: 'Related Products',
      chooseSize: 'Choose Size',
      stock: 'In Stock',
      outOfStock: 'Out of Stock',
      workerStatus: 'Worker Status',
      clockedIn: 'Clocked In',
      clockedOut: 'Clocked Out',
      tasks: 'Tasks',
    };
    return map[key] || key;
  },
  useLocale: () => 'en',
}));

jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

jest.mock('@/hooks/useCart', () => ({
  useCart: () => ({ addToCart: jest.fn(), items: [], totalItems: 0, totalPrice: 0, removeFromCart: jest.fn(), updateQuantity: jest.fn(), clearCart: jest.fn() }),
}));

jest.mock('@/styles/variant-selector.css', () => ({}), { virtual: true });

import { render, screen, fireEvent } from '@testing-library/react';

// ─── SaveConfirmationStep ────────────────────────────────────────────────────
import SaveConfirmationStep from '@/components/SaveConfirmationStep';

describe('SaveConfirmationStep', () => {
  const props = { productId: 'p1', imageUrl: 'http://img.test/a.jpg', glbUrl: 'http://cdn.test/model.glb', onSave: jest.fn(), onDiscard: jest.fn() };

  it('renders heading', () => {
    render(<SaveConfirmationStep {...props} />);
    expect(screen.getByText('Confirm & Save')).toBeInTheDocument();
  });

  it('renders product id', () => {
    render(<SaveConfirmationStep {...props} />);
    expect(screen.getByText('p1')).toBeInTheDocument();
  });

  it('calls onSave when Save button clicked', () => {
    const onSave = jest.fn();
    render(<SaveConfirmationStep {...props} onSave={onSave} />);
    fireEvent.click(screen.getByText('Save 3D Model'));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('calls onDiscard when Discard button clicked', () => {
    const onDiscard = jest.fn();
    render(<SaveConfirmationStep {...props} onDiscard={onDiscard} />);
    fireEvent.click(screen.getByText('Discard'));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

// ─── SuccessStep ─────────────────────────────────────────────────────────────
import SuccessStep from '@/components/SuccessStep';

describe('SuccessStep', () => {
  it('renders success heading', () => {
    render(<SuccessStep productId="p1" onGenerateAnother={jest.fn()} />);
    expect(screen.getByText('3D Model Saved!')).toBeInTheDocument();
  });

  it('renders view product link', () => {
    render(<SuccessStep productId="p42" onGenerateAnother={jest.fn()} />);
    expect(screen.getByText('View Product').closest('a')).toHaveAttribute('href', '/products/p42');
  });

  it('calls onGenerateAnother when clicked', () => {
    const onGenerateAnother = jest.fn();
    render(<SuccessStep productId="p1" onGenerateAnother={onGenerateAnother} />);
    fireEvent.click(screen.getByText('Generate Another'));
    expect(onGenerateAnother).toHaveBeenCalledTimes(1);
  });
});

// ─── ActivityLogWorker ────────────────────────────────────────────────────────
import ActivityLogWorker from '@/components/ActivityLogWorker';
import type { Activity } from '@/stores/workerStore';

describe('ActivityLogWorker', () => {
  it('renders heading', () => {
    render(<ActivityLogWorker activityLog={[]} />);
    expect(screen.getByText("Today's Activity")).toBeInTheDocument();
  });

  it('shows no-activity message when log is empty', () => {
    render(<ActivityLogWorker activityLog={[]} />);
    expect(screen.getByText('No activity today')).toBeInTheDocument();
  });

  it('renders activity items', () => {
    const log: Activity[] = [
      { timestamp: new Date().toISOString(), action: 'clock-in' },
      { timestamp: new Date().toISOString(), action: 'clock-out' },
    ];
    render(<ActivityLogWorker activityLog={log} />);
    expect(screen.getByText(/→ Clock In/)).toBeInTheDocument();
    expect(screen.getByText(/← Clock Out/)).toBeInTheDocument();
  });
});

// ─── TaskListWorker ───────────────────────────────────────────────────────────
import TaskListWorker from '@/components/TaskListWorker';
import type { Task } from '@/hooks/useWorkerActivity';

describe('TaskListWorker', () => {
  it('renders heading', () => {
    render(<TaskListWorker tasks={[]} />);
    expect(screen.getByText('Tasks Today')).toBeInTheDocument();
  });

  it('shows no-tasks message when empty', () => {
    render(<TaskListWorker tasks={[]} />);
    expect(screen.getByText('No tasks')).toBeInTheDocument();
  });

  it('renders task titles', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Restock shelves', priority: 'high', completed: false },
      { id: '2', title: 'Clean floor', priority: 'low', completed: false },
    ];
    render(<TaskListWorker tasks={tasks} />);
    expect(screen.getByText('Restock shelves')).toBeInTheDocument();
    expect(screen.getByText('Clean floor')).toBeInTheDocument();
  });
});

// ─── OrderSummaryCheckout ─────────────────────────────────────────────────────
import OrderSummaryCheckout from '@/components/OrderSummaryCheckout';
import type { CartItem } from '@/stores/cartStore';

describe('OrderSummaryCheckout', () => {
  const items: CartItem[] = [
    { productId: 'p1', variantId: 'v1', quantity: 2, price: 50, title: 'Beach Shirt', category: 'Shirts' },
  ];

  it('renders order summary heading', () => {
    render(<OrderSummaryCheckout items={items} totalPrice={100} shippingCost={5.99} />);
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
  });

  it('renders total including shipping', () => {
    render(<OrderSummaryCheckout items={items} totalPrice={100} shippingCost={5.99} />);
    expect(screen.getByText('$105.99')).toBeInTheDocument();
  });

  it('renders item line', () => {
    render(<OrderSummaryCheckout items={items} totalPrice={100} shippingCost={5.99} />);
    expect(screen.getByText(/Beach Shirt/)).toBeInTheDocument();
  });
});

// ─── VariantSelector ─────────────────────────────────────────────────────────
import VariantSelector from '@/components/VariantSelector';
import type { Product } from '@/lib/mockData';

describe('VariantSelector', () => {
  const variants: Product['variants'] = [
    { id: 'v1', name: 'Small', type: 'storefront', price: 79.99 },
    { id: 'v2', name: 'Medium', type: 'dropshipping', price: 74.99 },
  ];

  it('renders size heading', () => {
    render(<VariantSelector variants={variants} selectedVariant={0} onChange={jest.fn()} stock={5} />);
    expect(screen.getByText('Choose Size')).toBeInTheDocument();
  });

  it('renders variant names', () => {
    render(<VariantSelector variants={variants} selectedVariant={0} onChange={jest.fn()} stock={5} />);
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('calls onChange when a variant is clicked', () => {
    const onChange = jest.fn();
    render(<VariantSelector variants={variants} selectedVariant={0} onChange={onChange} stock={5} />);
    fireEvent.click(screen.getByText('Medium').closest('button')!);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('shows stock count', () => {
    render(<VariantSelector variants={variants} selectedVariant={0} onChange={jest.fn()} stock={3} />);
    expect(screen.getByText(/In Stock.*3|3.*In Stock/)).toBeInTheDocument();
  });

  it('shows out of stock when stock is 0', () => {
    render(<VariantSelector variants={variants} selectedVariant={0} onChange={jest.fn()} stock={0} />);
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });
});

// ─── WorkerStatusOverview ─────────────────────────────────────────────────────
import WorkerStatusOverview from '@/components/WorkerStatusOverview';
import type { WorkerStatus } from '@/stores/supervisorStore';

describe('WorkerStatusOverview', () => {
  const workers: WorkerStatus[] = [
    { workerId: 'w1', name: 'Alice', clockedIn: true, startTime: new Date().toISOString(), taskCount: 3 },
    { workerId: 'w2', name: 'Bob', clockedIn: false, taskCount: 0 },
  ];

  it('renders heading', () => {
    render(<WorkerStatusOverview workersStatus={workers} />);
    expect(screen.getByText('Worker Status')).toBeInTheDocument();
  });

  it('renders worker names', () => {
    render(<WorkerStatusOverview workersStatus={workers} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows clocked-in badge for active worker', () => {
    render(<WorkerStatusOverview workersStatus={workers} />);
    expect(screen.getByText('Clocked In')).toBeInTheDocument();
  });

  it('shows clocked-out badge for inactive worker', () => {
    render(<WorkerStatusOverview workersStatus={workers} />);
    expect(screen.getByText('Clocked Out')).toBeInTheDocument();
  });
});
