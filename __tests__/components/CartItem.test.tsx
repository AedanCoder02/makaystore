/**
 * Component tests for CartItem
 */
import React from 'react';

// Setup mocks BEFORE any component imports
const translations = {
  remove: 'Remove',
  each: 'each',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));

import { render, screen, fireEvent } from '@testing-library/react';
import CartItem from '@/components/CartItem';

const mockItem = {
  productId: '1',
  variantId: 'v1',
  quantity: 2,
  price: 79.99,
  title: 'Beach Linen Shirt',
  category: 'Shirts',
};

describe('CartItem', () => {
  it('renders the item title', () => {
    render(
      <CartItem item={mockItem} onRemove={jest.fn()} onQuantityChange={jest.fn()} />
    );
    expect(screen.getByText('Beach Linen Shirt')).toBeInTheDocument();
  });

  it('renders the item price', () => {
    render(
      <CartItem item={mockItem} onRemove={jest.fn()} onQuantityChange={jest.fn()} />
    );
    expect(screen.getByText('$79.99 each')).toBeInTheDocument();
  });

  it('renders the subtotal (price × quantity)', () => {
    render(
      <CartItem item={mockItem} onRemove={jest.fn()} onQuantityChange={jest.fn()} />
    );
    // 2 × 79.99 = 159.98
    expect(screen.getByText('$159.98')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();
    render(
      <CartItem item={mockItem} onRemove={onRemove} onQuantityChange={jest.fn()} />
    );
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('calls onQuantityChange with updated value on input change', () => {
    const onQuantityChange = jest.fn();
    render(
      <CartItem item={mockItem} onRemove={jest.fn()} onQuantityChange={onQuantityChange} />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '5' } });
    expect(onQuantityChange).toHaveBeenCalledWith(5);
  });

  it('enforces minimum quantity of 1 on invalid input', () => {
    const onQuantityChange = jest.fn();
    render(
      <CartItem item={mockItem} onRemove={jest.fn()} onQuantityChange={onQuantityChange} />
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '0' } });
    expect(onQuantityChange).toHaveBeenCalledWith(1);
  });

  it('renders the category badge', () => {
    render(
      <CartItem item={mockItem} onRemove={jest.fn()} onQuantityChange={jest.fn()} />
    );
    expect(screen.getByText('Shirts')).toBeInTheDocument();
  });
});
