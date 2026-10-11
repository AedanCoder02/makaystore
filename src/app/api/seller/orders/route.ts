import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { getPanelLocation } from '@/lib/location.server';

interface PaymentEntry {
  method: string;
  amount: number;
  transactionId?: string;
  description?: string;
}


export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const rows = await sql`
    SELECT * FROM seller_orders WHERE seller_id = ${userId} AND location = ${location} ORDER BY created_at DESC LIMIT 50
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const location = await getPanelLocation();
  const { client_id, client_name, client_email, items, subtotal, payment_methods, notes, is_gift } = await req.json();

  if (!client_id || !items?.length) {
    return NextResponse.json({ error: 'client_id y items son requeridos' }, { status: 400 });
  }

  // Gift orders: skip payment validation, record at $0
  if (is_gift) {
    const row = await sql`
      INSERT INTO seller_orders (seller_id, client_id, client_name, client_email, items, subtotal, payment_method, notes, is_gift, location)
      VALUES (
        ${userId},
        ${client_id},
        ${client_name ?? ''},
        ${client_email ?? ''},
        ${JSON.stringify(items)},
        0,
        ${'[]'},
        ${notes ?? ''},
        TRUE,
        ${location}
      )
      RETURNING *
    `;
    return NextResponse.json(row[0]);
  }

  // Paid orders: full payment validation
  if (!subtotal) {
    return NextResponse.json({ error: 'subtotal requerido' }, { status: 400 });
  }

  const payments: PaymentEntry[] = Array.isArray(payment_methods) ? payment_methods : [];
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);

  if (payments.length === 0) {
    return NextResponse.json({ error: 'Al menos un método de pago es requerido' }, { status: 400 });
  }
  if (Math.abs(totalPaid - Number(subtotal)) > 0.02) {
    return NextResponse.json(
      { error: `El total pagado ($${totalPaid.toFixed(2)}) no coincide con el subtotal ($${Number(subtotal).toFixed(2)})` },
      { status: 400 }
    );
  }

  // Credit payments: verify and deduct from client's dollar_balance
  const creditTotal = payments
    .filter(p => p.method === 'credit')
    .reduce((s, p) => s + Number(p.amount), 0);

  if (creditTotal > 0) {
    const profiles = await sql`
      SELECT dollar_balance FROM user_profiles WHERE clerk_id = ${client_id}
    `;
    const balance = Number(profiles[0]?.dollar_balance ?? 0);
    if (balance < creditTotal - 0.001) {
      return NextResponse.json(
        { error: `Saldo Makay insuficiente. Disponible: $${balance.toFixed(2)}, Requerido: $${creditTotal.toFixed(2)}` },
        { status: 400 }
      );
    }
    await sql`
      UPDATE user_profiles
      SET dollar_balance = dollar_balance - ${creditTotal}
      WHERE clerk_id = ${client_id}
    `;
  }

  let row;
  try {
    row = await sql`
      INSERT INTO seller_orders (seller_id, client_id, client_name, client_email, items, subtotal, payment_method, notes, is_gift, location)
      VALUES (
        ${userId},
        ${client_id},
        ${client_name ?? ''},
        ${client_email ?? ''},
        ${JSON.stringify(items)},
        ${subtotal},
        ${JSON.stringify(payments)},
        ${notes ?? ''},
        FALSE,
        ${location}
      )
      RETURNING *
    `;
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? 'DB error';
    console.error('[seller/orders POST insert]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Log sale to activities so supervisor sees it in real-time feed
  const itemsDesc = (items as { title: string; quantity?: number }[])
    .slice(0, 2).map(i => `${i.title} ×${i.quantity ?? 1}`).join(', ')
    + (items.length > 2 ? ` +${items.length - 2} más` : '');
  await sql`
    INSERT INTO activities (seller_id, type, note, status)
    VALUES (${userId}, 'sale', ${`Venta a ${client_name ?? 'cliente'}: ${itemsDesc} — $${Number(subtotal).toFixed(2)}`}, 'approved')
  `.catch(() => {});

  return NextResponse.json(row[0]);
}
