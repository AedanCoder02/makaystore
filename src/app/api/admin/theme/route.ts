import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  // publicMetadata, not unsafeMetadata — permissions are granted exclusively
  // by the backend admin API (/api/admin/users/[id]) and are safe to trust
  // for authorization; unsafeMetadata is rewritable by the user's own browser
  // session via the Clerk client SDK and must never gate a write endpoint.
  const permissions = user?.publicMetadata?.permissions as string[] | undefined;
  // Studio is reachable from the seller panel via the 'studio' permission flag
  // (see SellerSidebar's ALL_NAV filter) — honor that grant here too, not just
  // the admin role, or a seller with Studio access can open the editor and
  // have every save silently 403.
  const canEditTheme = role === 'admin' || (!!permissions && permissions.includes('studio'));
  if (!canEditTheme) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected an object of settings' }, { status: 400 });
  }
  // Merge on the server so two editors saving different sections don't
  // overwrite each other. A null value deletes that key.
  const set: Record<string, string> = {};
  const remove: string[] = [];
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    if (v === null) remove.push(k);
    else set[k] = String(v);
  }
  await sql`
    INSERT INTO theme_settings (id, settings, updated_at)
    VALUES (1, ${JSON.stringify(set)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
    SET settings = (
          CASE WHEN jsonb_typeof(theme_settings.settings) = 'object' THEN theme_settings.settings ELSE '{}'::jsonb END
          || EXCLUDED.settings
        ) - ${sql.array(remove)}::text[],
        updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}
