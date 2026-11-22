'use client';

import { ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface Props {
  children: ReactNode;
}

export default function StripeProvider({ children }: Props) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
