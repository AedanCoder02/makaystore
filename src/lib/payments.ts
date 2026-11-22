import { auth, currentUser } from '@clerk/nextjs/server';
import sql from '@/lib/db';

/**
 * Online checkout payment methods.
 * - Gateways settle automatically: `stripe` (card), `binance` (Binance Pay merchant API).
 * - Manual methods show the club's credentials, the customer pays outside the site and
 *   uploads a proof that staff verify in the backoffice.
 */
export const GATEWAY_METHODS = ['stripe', 'binance'] as const;
export const MANUAL_METHODS = ['pago_movil', 'transferencia', 'zelle', 'binance_pay_id'] as const;

export type GatewayMethod = (typeof GATEWAY_METHODS)[number];
export type ManualMethod = (typeof MANUAL_METHODS)[number];
export type CheckoutMethod = GatewayMethod | ManualMethod;

export type PaymentStatus =
  | 'awaiting_payment'      // gateway order created, waiting for the provider
  | 'pending_verification'  // manual proof uploaded, waiting for staff
  | 'paid'                  // gateway confirmed
  | 'verified'              // staff approved a manual proof
  | 'rejected';             // staff rejected a manual proof

export const SETTLED_STATUSES: PaymentStatus[] = ['paid', 'verified'];

export function isManualMethod(m: string): m is ManualMethod {
  return (MANUAL_METHODS as readonly string[]).includes(m);
}
export function isGatewayMethod(m: string): m is GatewayMethod {
  return (GATEWAY_METHODS as readonly string[]).includes(m);
}

export interface PaymentSettings {
  pago_movil:     { enabled: boolean; bank: string; phone: string; id_number: string; holder: string };
  transferencia:  { enabled: boolean; bank: string; account_number: string; account_type: string; id_number: string; holder: string };
  zelle:          { enabled: boolean; email: string; phone: string; holder: string };
  binance_pay_id: { enabled: boolean; pay_id: string; email: string; holder: string };
  /** Bolívares per USD, used to show the Bs amount for Pago Móvil / Transferencia. 0 hides it. */
  ves_rate: number;
  instructions: string;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  pago_movil:     { enabled: false, bank: '', phone: '', id_number: '', holder: '' },
  transferencia:  { enabled: false, bank: '', account_number: '', account_type: '', id_number: '', holder: '' },
  zelle:          { enabled: false, email: '', phone: '', holder: '' },
  binance_pay_id: { enabled: false, pay_id: '', email: '', holder: '' },
  ves_rate: 0,
  instructions: '',
};

let schemaReady: Promise<void> | null = null;

/** Idempotent runtime migration, same pattern as the other `ensureTable` helpers in this repo. */
export function ensurePaymentSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id            TEXT PRIMARY KEY,
          customer_id   TEXT,
          customer_email TEXT,
          items         JSONB NOT NULL DEFAULT '[]',
          subtotal      NUMERIC(10,2) DEFAULT 0,
          shipping_cost NUMERIC(10,2) DEFAULT 0,
          total         NUMERIC(10,2) DEFAULT 0,
          shipping_address JSONB,
          shipping_method  TEXT DEFAULT 'standard',
          payment_id    TEXT,
          status        TEXT DEFAULT 'pending',
          created_at    TIMESTAMPTZ DEFAULT NOW(),
          updated_at    TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`
        ALTER TABLE orders
          ADD COLUMN IF NOT EXISTS payment_methods      JSONB DEFAULT '[]',
          ADD COLUMN IF NOT EXISTS payment_status       TEXT,
          ADD COLUMN IF NOT EXISTS payment_provider_ref TEXT,
          ADD COLUMN IF NOT EXISTS payment_verified_by  TEXT,
          ADD COLUMN IF NOT EXISTS payment_verified_at  TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS payment_note         TEXT,
          ADD COLUMN IF NOT EXISTS fulfilled_at         TIMESTAMPTZ,
          ADD COLUMN IF NOT EXISTS locale               TEXT
      `;
      await sql`CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status)`;
      await sql`CREATE INDEX IF NOT EXISTS orders_payment_provider_ref_idx ON orders (payment_provider_ref)`;
      await sql`
        CREATE TABLE IF NOT EXISTS payment_proofs (
          id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          order_id   TEXT NOT NULL,
          method     TEXT NOT NULL,
          mime       TEXT NOT NULL,
          filename   TEXT,
          size       INTEGER NOT NULL,
          data       BYTEA NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS payment_proofs_order_idx ON payment_proofs (order_id)`;
      await sql`
        CREATE TABLE IF NOT EXISTS payment_settings (
          id         INTEGER PRIMARY KEY DEFAULT 1,
          config     JSONB NOT NULL DEFAULT '{}',
          updated_by TEXT,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
    })().catch(err => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

function mergeSettings(raw: unknown): PaymentSettings {
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = {}; }
  }
  const r =(raw && typeof raw === 'object' ? raw : {}) as Partial<PaymentSettings>;
  const d = DEFAULT_PAYMENT_SETTINGS;
  return {
    pago_movil:     { ...d.pago_movil,     ...(r.pago_movil ?? {}) },
    transferencia:  { ...d.transferencia,  ...(r.transferencia ?? {}) },
    zelle:          { ...d.zelle,          ...(r.zelle ?? {}) },
    binance_pay_id: { ...d.binance_pay_id, ...(r.binance_pay_id ?? {}) },
    ves_rate: Number(r.ves_rate ?? 0) || 0,
    instructions: String(r.instructions ?? ''),
  };
}

export async function getPaymentSettings(): Promise<PaymentSettings> {
  await ensurePaymentSchema();
  const rows = await sql`SELECT config FROM payment_settings WHERE id = 1`;
  return mergeSettings(rows[0]?.config);
}

export async function savePaymentSettings(input: unknown, userId: string): Promise<PaymentSettings> {
  await ensurePaymentSchema();
  const config = mergeSettings(input);
  await sql`
    INSERT INTO payment_settings (id, config, updated_by, updated_at)
    VALUES (1, ${JSON.stringify(config)}, ${userId}, NOW())
    ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_by = EXCLUDED.updated_by, updated_at = NOW()
  `;
  return config;
}

export function stripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
}

export function binanceApiEnabled(): boolean {
  return Boolean(process.env.BINANCE_PAY_API_KEY && process.env.BINANCE_PAY_SECRET_KEY);
}

/** Methods a customer can pick right now, given env keys and admin settings. */
export function enabledMethods(s: PaymentSettings): CheckoutMethod[] {
  const out: CheckoutMethod[] = [];
  if (stripeEnabled()) out.push('stripe');
  if (binanceApiEnabled()) out.push('binance');
  if (s.pago_movil.enabled) out.push('pago_movil');
  if (s.transferencia.enabled) out.push('transferencia');
  if (s.zelle.enabled) out.push('zelle');
  // Manual Binance Pay ID is only offered when the merchant API is not configured.
  if (s.binance_pay_id.enabled && !binanceApiEnabled()) out.push('binance_pay_id');
  return out;
}

export type StaffRole = 'seller' | 'supervisor' | 'admin';

/** Returns the caller's backoffice role, or null for customers / signed-out users. */
export async function getStaffRole(): Promise<{ userId: string; role: StaffRole } | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role === 'seller' || role === 'supervisor' || role === 'admin') return { userId, role };
  return null;
}

export function parseJsonArray<T = unknown>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}
