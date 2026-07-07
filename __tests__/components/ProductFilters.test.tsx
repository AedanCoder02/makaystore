/**
 * Component tests for ProductFilters
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      filters: 'Filters',
      filtersClear: 'Clear',
      search: 'Search',
      searchByName: 'Search by name...',
      priceRange: 'Price Range',
      minPrice: 'Min price',
      maxPrice: 'Max price',
      category: 'Category',
    };
    return map[key] || key;
  },
}));

import { render, screen, fireEvent } from '@testing-library/react';
import ProductFilters, { Filters } from '@/components/ProductFilters';

const defaultFilters: Filters = { search: '', category: [], priceMin: 0, priceMax: 160 };

describe('ProductFilters', () => {
  it('renders the Filters heading', () => {
    render(<ProductFilters filters={defaultFilters} onChange={jest.fn()} />);
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('renders the search input', () => {
    render(<ProductFilters filters={defaultFilters} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
  });

  it('calls onChange when search text changes', () => {
    const onChange = jest.fn();
    render(<ProductFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'shirt' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'shirt' }));
  });

  it('renders all four category checkboxes', () => {
    render(<ProductFilters filters={defaultFilters} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Shirts')).toBeInTheDocument();
    expect(screen.getByLabelText('Shorts')).toBeInTheDocument();
    expect(screen.getByLabelText('Dresses')).toBeInTheDocument();
    expect(screen.getByLabelText('Accessories')).toBeInTheDocument();
  });

  it('adds category when checkbox is checked', () => {
    const onChange = jest.fn();
    render(<ProductFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Shirts'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ category: ['Shirts'] }));
  });

  it('removes category when already-checked checkbox is clicked', () => {
    const onChange = jest.fn();
    const filters = { ...defaultFilters, category: ['Shirts'] };
    render(<ProductFilters filters={filters} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Shirts'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ category: [] }));
  });

  it('resets all filters when Clear is clicked', () => {
    const onChange = jest.fn();
    const filters = { search: 'shirt', category: ['Shirts'], priceMin: 20, priceMax: 100 };
    render(<ProductFilters filters={filters} onChange={onChange} />);
    fireEvent.click(screen.getByText('Clear'));
    expect(onChange).toHaveBeenCalledWith({ search: '', category: [], priceMin: 0, priceMax: 160 });
  });

  it('renders price range sliders', () => {
    render(<ProductFilters filters={defaultFilters} onChange={jest.fn()} />);
    expect(screen.getByLabelText('Min price')).toBeInTheDocument();
    expect(screen.getByLabelText('Max price')).toBeInTheDocument();
  });

  it('calls onChange when min price slider changes', () => {
    const onChange = jest.fn();
    render(<ProductFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Min price'), { target: { value: '30' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ priceMin: 30 }));
  });

  it('calls onChange when max price slider changes', () => {
    const onChange = jest.fn();
    render(<ProductFilters filters={defaultFilters} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Max price'), { target: { value: '120' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ priceMax: 120 }));
  });
});
