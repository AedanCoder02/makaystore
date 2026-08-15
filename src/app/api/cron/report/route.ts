import { NextRequest, NextResponse } from 'next/server';
import { sendReport, ReportPeriod } from '@/lib/reportEmail';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  // Convert to New York time to evaluate day/weekday/date
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const dayOfMonth  = ny.getDate();
  const dayOfWeek   = ny.getDay(); // 0=Sun, 1=Mon

  const reports: ReportPeriod[] = ['daily'];
  if (dayOfWeek === 1) reports.push('weekly');   // Every Monday → send weekly
  if (dayOfMonth === 1) reports.push('monthly'); // Every 1st → send monthly

  const results = [];
  for (const period of reports) {
    try {
      const result = await sendReport(period);
      results.push(result);
    } catch (err) {
      results.push({ ok: false, period, error: String(err) });
    }
  }

  return NextResponse.json({ sent: results });
}
