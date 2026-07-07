/**
 * Component tests for ProductReviewsSection
 */
import React from 'react';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => ({
    customerReviews: 'Customer Reviews',
    reviewsComingSoon: 'Reviews Coming Soon',
    reviewsComingSoonDesc: 'Be the first to leave a review',
  }[key] || key),
}));

import { render, screen } from '@testing-library/react';
import ProductReviewsSection from '@/components/ProductReviewsSection';

describe('ProductReviewsSection', () => {
  it('renders the section heading', () => {
    render(<ProductReviewsSection />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Customer Reviews');
  });

  it('renders the coming soon message', () => {
    render(<ProductReviewsSection />);
    expect(screen.getByText('Reviews Coming Soon')).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<ProductReviewsSection />);
    expect(screen.getByText('Be the first to leave a review')).toBeInTheDocument();
  });
});
