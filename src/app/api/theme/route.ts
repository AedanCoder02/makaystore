import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    const rows = await sql`SELECT settings FROM theme_settings WHERE id = 1`;
    return NextResponse.json(rows[0]?.settings ?? {});
  } catch {
    return NextResponse.json({});
  }
}
