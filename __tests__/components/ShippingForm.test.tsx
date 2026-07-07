/**
 * Component tests for ShippingForm
 */
import React from 'react';

// Setup mocks BEFORE any component imports
const translations = {
  shippingInfo: 'Shipping Information',
  fullName: 'Full Name',
  email: 'Email',
  address: 'Address',
  city: 'City',
  zipCode: 'ZIP Code',
  country: 'Country',
  selectCountry: 'Select Country',
  continueToPayment: 'Continue to Payment',
  backToShipping: 'Back to Shipping',
  requiredFields: 'Please fill all required fields',
  invalidEmail: 'Please enter a valid email',
  processing: 'Processing...',
};

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => translations[key] || key,
  useLocale: () => 'en',
}));

// ShippingForm uses window.alert for validation errors
global.alert = jest.fn();

import { render, screen, fireEvent } from '@testing-library/react';
import ShippingForm from '@/components/ShippingForm';

const emptyFormData = {
  name: '',
  email: '',
  address: '',
  city: '',
  zip: '',
  country: '',
};

const validFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  address: '123 Main St',
  city: 'New York',
  zip: '10001',
  country: 'US',
};

describe('ShippingForm', () => {
  beforeEach(() => {
    (global.alert as jest.Mock).mockClear();
  });

  it('renders all required fields', () => {
    render(<ShippingForm formData={emptyFormData} onChange={jest.fn()} onSubmit={jest.fn()} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
  });

  it('calls onChange when a field value changes', () => {
    const onChange = jest.fn();
    render(<ShippingForm formData={emptyFormData} onChange={onChange} onSubmit={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Jane Doe' } });
    expect(onChange).toHaveBeenCalledWith('name', 'Jane Doe');
  });

  it('shows alert and does not call onSubmit when required fields are missing', () => {
    const onSubmit = jest.fn();
    render(<ShippingForm formData={emptyFormData} onChange={jest.fn()} onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }).closest('form')!);
    expect(global.alert).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit when all fields are valid', () => {
    const onSubmit = jest.fn();
    render(<ShippingForm formData={validFormData} onChange={jest.fn()} onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }).closest('form')!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('shows alert for invalid email format', () => {
    const onSubmit = jest.fn();
    const badEmailData = { ...validFormData, email: 'notanemail' };
    render(<ShippingForm formData={badEmailData} onChange={jest.fn()} onSubmit={onSubmit} />);

    fireEvent.submit(screen.getByRole('button', { name: /continue to payment/i }).closest('form')!);
    expect(global.alert).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables the submit button when loading', () => {
    render(
      <ShippingForm formData={validFormData} onChange={jest.fn()} onSubmit={jest.fn()} loading={true} />
    );
    expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
  });
});
