import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import {
  ensurePaymentSchema, getPaymentSettings, enabledMethods, isGatewayMethod, isManualMethod,
  parseJsonArray, type CheckoutMethod,
} from '@/lib/payments';
import { STORE_LOCATION } from '@/lib/location';
import { priceCart, PricingError, type IncomingItem, type PricedCart } from '@/lib/orderPricing';

// GET — customer's own orders
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensurePaymentSchema();

  const rows = await sql`
    SELECT * FROM orders
    WHERE customer_id = ${userId}
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

const MAX_PROOF_BYTES = 4 * 1024 * 1024;
const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

interface IncomingPayment {
  method: string;
  amount: number;
  reference?: string;
}

// POST — create order from storefront checkout.
// Gateway methods (stripe, binance) create the order as `awaiting_payment`; the provider confirms it later.
// Manual methods (pago_movil, transferencia, zelle, binance_pay_id) need a reference + proof file each
// and wait for staff verification. Fulfillment (points, memberships, emails) runs only once payment settles.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  await ensurePaymentSchema();

  const locale = req.cookies.get('NEXT_LOCALE')?.value ?? 'es';

  let body: Record<string, unknown>;
  let form: FormData | null = null;
  if ((req.headers.get('content-type') ?? '').includes('multipart/form-data')) {
    form = await req.formData();
    try { body = JSON.parse(String(form.get('payload') ?? '{}')); } catch { body = {}; }
  } else {
    body = await req.json();
  }

  const { items, total, shipping_address, shipping_method, customer_email } = body as {
    items?: unknown[]; total?: number;
    shipping_address?: Record<string, unknown>; shipping_method?: string; customer_email?: string;
  };
  const payments = parseJsonArray<IncomingPayment>(body.payment_methods);

  if (!Array.isArray(items) || items.length === 0 || total === undefined || !(Number(total) > 0)) {
    return NextResponse.json({ error: 'items and total required' }, { status: 400 });
  }

  // ── Recompute the cart from the database; never trust client prices ──
  let cart: PricedCart;
  try {
    cart = await priceCart(items as IncomingItem[], String(shipping_method ?? 'standard'));
  } catch (e) {
    if (e instanceof PricingError) return NextResponse.json({ error: e.message }, { status: 400 });
    throw e;
  }
  if (Math.abs(cart.total - Number(total)) > 0.02) {
    return NextResponse.json(
      { error: 'Los precios cambiaron. Actualiza tu carrito e intenta de nuevo.', total: cart.total },
      { status: 409 },
    );
  }

  // ── Validate payment methods ──
  const settings = await getPaymentSettings();
  const allowed = enabledMethods(settings);
  if (payments.length === 0 || payments.length > 2) {
    return NextResponse.json({ error: 'Selecciona uno o dos métodos de pago' }, { status: 400 });
  }
  for (const p of payments) {
    if (!allowed.includes(p.method as CheckoutMethod)) {
      return NextResponse.json({ error: `Método de pago no disponible: ${p.method}` }, { status: 400 });
    }
    if (!(Number(p.amount) > 0)) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }
  }
  const hasGateway = payments.some(p => isGatewayMethod(p.method));
  if (hasGateway && payments.length > 1) {
    return NextResponse.json({ error: 'Tarjeta y Binance Pay no se pueden combinar con otro método' }, { status: 400 });
  }
  const paidSum = payments.reduce((s, p) => s + Number(p.amount), 0);
  if (Math.abs(paidSum - cart.total) > 0.02) {
    return NextResponse.json({ error: 'La suma de los pagos no coincide con el total' }, { status: 400 });
  }

  // Manual methods: reference + proof file are required.
  const proofFiles: (File | null)[] = [];
  for (let i = 0; i < payments.length; i++) {
    const p = payments[i];
    if (!isManualMethod(p.method)) { proofFiles.push(null); continue; }
    const file = form?.get(`proof_${i}`);
    if (!String(p.reference ?? '').trim()) {
      return NextResponse.json({ error: 'Ingresa el número de referencia del pago' }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Adjunta el comprobante (captura) del pago' }, { status: 400 });
    }
    if (file.size > MAX_PROOF_BYTES) {
      return NextResponse.json({ error: 'El comprobante supera 4 MB' }, { status: 400 });
    }
    if (!PROOF_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'El comprobante debe ser una imagen o PDF' }, { status: 400 });
    }
    proofFiles.push(file);
  }

  const id = `ORD-${Date.now()}`;

  const paymentStatus = hasGateway ? 'awaiting_payment' : 'pending_verification';
  const proofBuffers = await Promise.all(
    proofFiles.map(async f => (f ? Buffer.from(await f.arrayBuffer()) : null)),
  );

  const row = await sql.begin(async tx => {
    const storedPayments: Array<Record<string, unknown>> = [];
    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];
      const entry: Record<string, unknown> = { method: p.method, amount: Number(p.amount) };
      const file = proofFiles[i];
      const buf = proofBuffers[i];
      if (file && buf) {
        const proof = await tx`
          INSERT INTO payment_proofs (order_id, method, mime, filename, size, data)
          VALUES (${id}, ${p.method}, ${file.type}, ${file.name.slice(0, 200)}, ${file.size}, ${buf})
          RETURNING id
        `;
        entry.reference = String(p.reference).trim().slice(0, 100);
        entry.proof_id = proof[0].id;
      }
      storedPayments.push(entry);
    }

    return tx`
      INSERT INTO orders
        (id, customer_id, customer_email, items, subtotal, shipping_cost, total,
         shipping_address, shipping_method, payment_id, payment_methods, status,
         payment_status, locale, location)
      VALUES
        (${id}, ${userId ?? null}, ${customer_email ?? null},
         ${JSON.stringify(cart.items)}, ${cart.subtotal}, ${cart.shippingCost}, ${cart.total},
         ${JSON.stringify(shipping_address ?? {})}, ${shipping_method ?? 'standard'},
         ${null}, ${JSON.stringify(storedPayments)}, 'pending',
         ${paymentStatus}, ${locale}, ${STORE_LOCATION})
      RETURNING id, total, status, payment_status, payment_methods
    `;
  });

  return NextResponse.json(row[0], { status: 201 });
}
