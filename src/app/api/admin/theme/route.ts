import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const settings = await req.json();
  await sql`
    INSERT INTO theme_settings (id, settings, updated_at)
    VALUES (1, ${JSON.stringify(settings)}, NOW())
    ON CONFLICT (id) DO UPDATE
    SET settings = EXCLUDED.settings, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
