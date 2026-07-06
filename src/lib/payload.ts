import { getPayload, type Payload } from 'payload';
import config from '../../payload.config';
import { mockProducts } from './mockData';
import { mockWorkers } from './mockWorkers';
import { mockOrders } from './mockOrders';

let cachedPayload: Payload | null = null;

/**
 * Get or initialize the Payload CMS client instance.
 * Caches the instance to avoid reinitializing on every call.
 */
export async function getPayloadClient(): Promise<Payload> {
  if (!cachedPayload) {
    cachedPayload = await getPayload({ config });
  }
  return cachedPayload;
}

/**
 * Fetch products from the Payload CMS.
 * @param limit - Maximum number of products to fetch (default: 50)
 * @param offset - Number of products to skip (default: 0)
 * @returns Promise with products array
 */
export async function fetchProducts(limit = 50, offset = 0): Promise<any> {
  const payload = await getPayloadClient();
  const products = await (payload.find as any)({
    collection: 'products',
    limit,
    offset,
    depth: 2,
  });
  return products;
}

/**
 * Fetch a single product by ID.
 * @param id - Product ID
 * @returns Promise with product object
 */
export async function fetchProductById(id: string | number): Promise<any> {
  const payload = await getPayloadClient();
  const product = await (payload.findByID as any)({
    collection: 'products',
    id,
    depth: 2,
  });
  return product;
}

/**
 * Fetch the design system global configuration.
 * @returns Promise with design-system global object
 */
export async function fetchDesignSystem(): Promise<any> {
  const payload = await getPayloadClient();
  const designSystem = await (payload.findGlobal as any)({
    slug: 'design-system',
    depth: 2,
  });
  return designSystem;
}

// Mock data exports — used by all API routes until post-approval
// Swap: import from './mockData' → real Payload queries (zero other code changes needed)
export { mockProducts, mockWorkers, mockOrders };
