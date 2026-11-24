import { NextRequest, NextResponse } from 'next/server';
import { syncFlyers } from '@/lib/flyerSync';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Daily Vercel cron: imports new flyers from the Guacuco Drive folder as events.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    return NextResponse.json(await syncFlyers());
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
