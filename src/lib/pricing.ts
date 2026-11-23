/**
 * Prices shared by the storefront UI and the order API. The server recomputes
 * every order from these values and the products table; client prices are
 * never trusted.
 */

export const SHIPPING_OPTIONS = [
  { id: 'standard', cost: 5 },
  { id: 'express', cost: 15 },
  { id: 'overnight', cost: 30 },
] as const;

export type ShippingMethodId = (typeof SHIPPING_OPTIONS)[number]['id'];

export function getShippingCost(method: string): number {
  return SHIPPING_OPTIONS.find(o => o.id === method)?.cost ?? 0;
}

/** Monthly membership price (USD) by product id. */
export const MEMBERSHIP_MONTHLY: Record<string, number> = {
  'membership-bronze': 50,
  'membership-silver': 100,
  'membership-gold': 150,
};

export const MEMBERSHIP_DURATION_MONTHS: Record<string, number> = { trimestral: 3, semestral: 6, anual: 12 };

export function membershipPrice(productId: string, duration: string): number | null {
  const monthly = MEMBERSHIP_MONTHLY[productId];
  const months = MEMBERSHIP_DURATION_MONTHS[duration];
  if (monthly === undefined || months === undefined) return null;
  return monthly * months;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}
