import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const permissions = user?.unsafeMetadata?.permissions as string[] | undefined;
  // Studio is reachable from the seller panel via the 'studio' permission flag
  // (see SellerSidebar's ALL_NAV filter) — honor that grant here too, not just
  // the admin role, or a seller with Studio access can open the editor and
  // have every save silently 403.
  //
  // unsafeMetadata is Clerk's user-editable metadata bucket (any signed-in
  // user can rewrite their own via the client SDK), so it must never be the
  // sole gate on a write endpoint — it only narrows access *within* an
  // already-trusted staff role, never grants access on its own. publicMetadata
  // is set exclusively by the backend/admin API (see /api/admin/create-user,
  // /api/admin/users/[id]) and is safe to trust here.
  const isTrustedStaffRole = role === 'admin' || role === 'seller' || role === 'supervisor';
  const canEditTheme = role === 'admin' || (isTrustedStaffRole && !!permissions && permissions.includes('studio'));
  if (!canEditTheme) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const settings = await req.json();
  // Cast to jsonb so PostgreSQL stores an object, not a string
  await sql`
    INSERT INTO theme_settings (id, settings, updated_at)
    VALUES (1, ${JSON.stringify(settings)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET settings = EXCLUDED.settings, updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
