import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id               SERIAL PRIMARY KEY,
      name             TEXT NOT NULL,
      email            TEXT NOT NULL,
      phone            TEXT NOT NULL,
      party_size       INT NOT NULL,
      reservation_date DATE NOT NULL,
      reservation_time TEXT NOT NULL,
      zone             TEXT NOT NULL,
      notes            TEXT,
      status           TEXT DEFAULT 'confirmed',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS experience_key TEXT`.catch(() => {});
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS experience_name TEXT`.catch(() => {});
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS total_price NUMERIC`.catch(() => {});
  await sql`ALTER TABLE reservations ADD COLUMN IF NOT EXISTS has_extra_addon BOOLEAN DEFAULT FALSE`.catch(() => {});
}

export async function POST(req: NextRequest) {
  const { name, email, phone, partySize, date, time, experienceKey, experienceName, totalPrice, hasExtraAddon, notes } = await req.json();

  if (!name || !email || !phone || !partySize || !date || !time || !experienceKey) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
  }

  try {
    await ensureTable();
    const row = await sql`
      INSERT INTO reservations (
        name, email, phone, party_size, reservation_date, reservation_time, zone, notes,
        experience_key, experience_name, total_price, has_extra_addon
      )
      VALUES (
        ${name}, ${email}, ${phone}, ${Number(partySize)}, ${date}, ${time}, ${experienceKey}, ${notes ?? ''},
        ${experienceKey}, ${experienceName ?? ''}, ${totalPrice ?? null}, ${!!hasExtraAddon}
      )
      RETURNING id, reservation_date, reservation_time
    `;
    return NextResponse.json(row[0]);
  } catch (e: any) {
    console.error('[POST /api/reservations]', e?.message);
    return NextResponse.json({ error: 'No se pudo crear la reserva' }, { status: 500 });
  }
}
