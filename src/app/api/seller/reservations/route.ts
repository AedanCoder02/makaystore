import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const range = req.nextUrl.searchParams.get('range') ?? 'upcoming';

  try {
    let rows;
    if (range === 'month') {
      rows = await sql`
        SELECT * FROM reservations
        WHERE reservation_date >= date_trunc('month', CURRENT_DATE)
          AND reservation_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
        ORDER BY reservation_date ASC, reservation_time ASC
      `;
    } else if (range === 'all') {
      rows = await sql`SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC LIMIT 500`;
    } else {
      rows = await sql`
        SELECT * FROM reservations
        WHERE reservation_date >= CURRENT_DATE AND status != 'cancelled'
        ORDER BY reservation_date ASC, reservation_time ASC
      `;
    }
    return NextResponse.json(rows);
  } catch (e: any) {
    console.error('[GET /api/seller/reservations]', e?.message);
    return NextResponse.json({ error: 'No se pudieron cargar las reservas' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !['confirmed', 'attended', 'cancelled'].includes(status)) {
    return NextResponse.json({ error: 'id y status válido son requeridos' }, { status: 400 });
  }

  try {
    await sql`UPDATE reservations SET status = ${status} WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[PATCH /api/seller/reservations]', e?.message);
    return NextResponse.json({ error: 'No se pudo actualizar la reserva' }, { status: 500 });
  }
}
