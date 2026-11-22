import sql from '@/lib/db';
import { STORE_LOCATION } from '@/lib/location';
import { getShippingCost, membershipPrice, roundMoney } from '@/lib/pricing';

export interface IncomingItem {
  productId?: unknown;
  variantId?: unknown;
  quantity?: unknown;
  duration?: unknown;
}

export interface PricedItem {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  title: string;
  category: string;
  duration?: string;
}

export interface PricedCart {
  items: PricedItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

export class PricingError extends Error {}

interface Variant { id?: string | number; price?: number | string }

/**
 * Rebuilds the cart from the database: product title, category and price
 * (variant price when the variant carries one), membership price from the
 * duration table. Throws PricingError for unknown, inactive or out-of-scope
 * products and invalid quantities.
 */
export async function priceCart(items: IncomingItem[], shippingMethod: string): Promise<PricedCart> {
  if (items.length === 0 || items.length > 50) throw new PricingError('Carrito inválido');

  const ids = [...new Set(items.map(i => String(i.productId ?? '')))].filter(Boolean);
  const rows = ids.length
    ? await sql`
        SELECT p.id, p.title, p.category, p.variants,
               COALESCE(po.price, p.price)::numeric AS price
        FROM products p
        LEFT JOIN product_overrides po ON po.product_id = p.id
        WHERE p.id IN ${sql(ids)} AND p.status = 'active' AND p.location = ${STORE_LOCATION}
      `
    : [];
  const byId = new Map(rows.map(r => [String(r.id), r]));

  const priced: PricedItem[] = items.map(raw => {
    const productId = String(raw.productId ?? '');
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new PricingError('Cantidad inválida');
    }
    const row = byId.get(productId);
    if (!row) throw new PricingError('Un producto del carrito ya no está disponible');

    const variantId = String(raw.variantId ?? productId);
    let unit = Number(row.price);

    if (productId.startsWith('membership-')) {
      const duration = String(raw.duration ?? 'trimestral');
      const p = membershipPrice(productId, duration);
      if (p === null) throw new PricingError('Duración de membresía inválida');
      return {
        productId, variantId, quantity: 1, price: p,
        title: String(row.title), category: String(row.category ?? ''), duration,
      };
    }

    const variants: Variant[] = typeof row.variants === 'string' ? JSON.parse(row.variants) : (row.variants ?? []);
    const variant = Array.isArray(variants) ? variants.find(v => String(v.id) === variantId) : undefined;
    if (variant?.price !== undefined && variant.price !== null && !Number.isNaN(Number(variant.price))) {
      unit = Number(variant.price);
    }
    if (!(unit >= 0)) throw new PricingError('Precio inválido');

    return {
      productId, variantId, quantity, price: roundMoney(unit),
      title: String(row.title), category: String(row.category ?? ''),
    };
  });

  const subtotal = roundMoney(priced.reduce((s, i) => s + i.price * i.quantity, 0));
  const shippingCost = getShippingCost(shippingMethod);
  return { items: priced, subtotal, shippingCost, total: roundMoney(subtotal + shippingCost) };
}
