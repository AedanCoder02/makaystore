/**
 * Component tests for ShippingMethodSelector
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      shippingMethod: 'Shipping Method',
      'shippingMethods.standard': 'Standard',
      'shippingMethods.standardDays': '5-7 days',
      'shippingMethods.express': 'Express',
      'shippingMethods.expressDays': '2-3 days',
      'shippingMethods.overnight': 'Overnight',
      'shippingMethods.overnightDays': 'Next day',
    };
    return map[key] || key;
  },
}));

import { render, screen, fireEvent } from '@testing-library/react';
import ShippingMethodSelector, { getShippingCost } from '@/components/ShippingMethodSelector';

describe('ShippingMethodSelector', () => {
  it('renders the heading', () => {
    render(<ShippingMethodSelector selected="standard" onChange={jest.fn()} />);
    expect(screen.getByText('Shipping Method')).toBeInTheDocument();
  });

  it('renders all three shipping options', () => {
    render(<ShippingMethodSelector selected="standard" onChange={jest.fn()} />);
    expect(screen.getByDisplayValue('standard')).toBeInTheDocument();
    expect(screen.getByDisplayValue('express')).toBeInTheDocument();
    expect(screen.getByDisplayValue('overnight')).toBeInTheDocument();
  });

  it('marks the selected option as checked', () => {
    render(<ShippingMethodSelector selected="express" onChange={jest.fn()} />);
    expect((screen.getByDisplayValue('express') as HTMLInputElement).checked).toBe(true);
    expect((screen.getByDisplayValue('standard') as HTMLInputElement).checked).toBe(false);
  });

  it('calls onChange when a different option is selected', () => {
    const onChange = jest.fn();
    render(<ShippingMethodSelector selected="standard" onChange={onChange} />);
    fireEvent.click(screen.getByDisplayValue('express'));
    expect(onChange).toHaveBeenCalledWith('express');
  });

  it('shows price for each option', () => {
    render(<ShippingMethodSelector selected="standard" onChange={jest.fn()} />);
    expect(screen.getByText('$5')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
    expect(screen.getByText('$30')).toBeInTheDocument();
  });
});

describe('getShippingCost', () => {
  it('returns 5 for standard', () => {
    expect(getShippingCost('standard')).toBe(5);
  });

  it('returns 15 for express', () => {
    expect(getShippingCost('express')).toBe(15);
  });

  it('returns 30 for overnight', () => {
    expect(getShippingCost('overnight')).toBe(30);
  });

  it('returns 0 for unknown method', () => {
    expect(getShippingCost('pigeon')).toBe(0);
  });
});
