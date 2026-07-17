import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { activityId, action } = await req.json();
  if (!activityId || !action) {
    return NextResponse.json({ error: 'activityId and action required' }, { status: 400 });
  }
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const row = await sql`
    UPDATE activities SET status = ${newStatus} WHERE id = ${Number(activityId)} RETURNING *
  `;

  if (!row.length) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
  return NextResponse.json(row[0]);
}
