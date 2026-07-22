import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export const revalidate = 0;

export async function GET() {
  try {
    const rows = await sql`SELECT settings FROM theme_settings WHERE id = 1`;
    let settings = rows[0]?.settings ?? {};
    // If stored as a string (legacy bug), parse it
    if (typeof settings === 'string') {
      try { settings = JSON.parse(settings); } catch { settings = {}; }
    }
    // If corrupted into char-index object (spread-string bug), discard
    if (typeof settings === 'object' && settings !== null && '0' in settings) {
      settings = {};
    }
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({});
  }
}
