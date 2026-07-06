'use client';

import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface Props {
  children: ReactNode;
}

export default function StripeProvider({ children }: Props) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
