/**
 * Component tests for QuantitySelector
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    quantity: 'Quantity',
    stock: 'in stock',
    outOfStockShort: 'Out of stock',
  }[key] || key),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import QuantitySelector from '@/components/QuantitySelector';

describe('QuantitySelector', () => {
  it('renders with the current quantity', () => {
    render(<QuantitySelector maxQuantity={10} selectedQuantity={3} onChange={jest.fn()} />);
    const input = screen.getByRole('spinbutton');
    expect((input as HTMLInputElement).value).toBe('3');
  });

  it('shows stock count text', () => {
    render(<QuantitySelector maxQuantity={10} selectedQuantity={1} onChange={jest.fn()} />);
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
  });

  it('shows out of stock when maxQuantity is 0', () => {
    render(<QuantitySelector maxQuantity={0} selectedQuantity={1} onChange={jest.fn()} />);
    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('calls onChange with decremented value on decrement click', () => {
    const onChange = jest.fn();
    render(<QuantitySelector maxQuantity={10} selectedQuantity={3} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('calls onChange with incremented value on increment click', () => {
    const onChange = jest.fn();
    render(<QuantitySelector maxQuantity={10} selectedQuantity={3} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not decrement below 1', () => {
    const onChange = jest.fn();
    render(<QuantitySelector maxQuantity={10} selectedQuantity={1} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not increment above maxQuantity', () => {
    const onChange = jest.fn();
    render(<QuantitySelector maxQuantity={5} selectedQuantity={5} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles direct input change', () => {
    const onChange = jest.fn();
    render(<QuantitySelector maxQuantity={10} selectedQuantity={3} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '7' } });
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('clamps input to maxQuantity when value exceeds max', () => {
    const onChange = jest.fn();
    render(<QuantitySelector maxQuantity={5} selectedQuantity={3} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '99' } });
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('defaults to 1 for invalid input', () => {
    const onChange = jest.fn();
    render(<QuantitySelector maxQuantity={10} selectedQuantity={3} onChange={onChange} />);
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
