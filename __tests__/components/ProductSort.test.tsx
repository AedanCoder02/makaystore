/**
 * Component tests for ProductSort
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    sortBy: 'Sort by',
    'sortOptions.popular': 'Popular',
    'sortOptions.newest': 'Newest',
    'sortOptions.priceAsc': 'Price: Low to High',
    'sortOptions.priceDesc': 'Price: High to Low',
  }[key] || key),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import ProductSort, { SortOption } from '@/components/ProductSort';

describe('ProductSort', () => {
  it('renders the sort label', () => {
    render(<ProductSort sort="popular" onChange={jest.fn()} />);
    expect(screen.getByText('Sort by')).toBeInTheDocument();
  });

  it('renders a select element', () => {
    render(<ProductSort sort="popular" onChange={jest.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays the currently selected sort option', () => {
    render(<ProductSort sort="price-low" onChange={jest.fn()} />);
    expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('price-low');
  });

  it('calls onChange when a new option is selected', () => {
    const onChange = jest.fn();
    render(<ProductSort sort="popular" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'newest' } });
    expect(onChange).toHaveBeenCalledWith('newest' as SortOption);
  });

  it('calls onChange with price-high option', () => {
    const onChange = jest.fn();
    render(<ProductSort sort="popular" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price-high' } });
    expect(onChange).toHaveBeenCalledWith('price-high');
  });
});
