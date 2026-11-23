import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Back-office access levels for API routes.
 *  - 'staff':      any back-office account (seller, worker, supervisor, admin)
 *  - 'supervisor': supervisor or admin
 *  - 'admin':      admin only
 *
 * Roles come from Clerk publicMetadata (role + optional roles[]), which only
 * the backend admin API can write. Never read unsafeMetadata here.
 */
export type AccessLevel = 'staff' | 'supervisor' | 'admin';

const ALLOWED: Record<AccessLevel, string[]> = {
  staff: ['seller', 'worker', 'supervisor', 'admin'],
  supervisor: ['supervisor', 'admin'],
  admin: ['admin'],
};

export interface StaffCaller {
  userId: string;
  role: string;
  roles: string[];
}

/**
 * Returns the caller when they hold the required level, otherwise a 401/403
 * response to return as-is:
 *
 *   const gate = await requireAccess('admin');
 *   if (gate instanceof NextResponse) return gate;
 */
export async function requireAccess(
  level: AccessLevel,
  opts: { orPermission?: string } = {},
): Promise<StaffCaller | NextResponse> {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? 'customer';
  const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];
  const allowed = ALLOWED[level];
  const permissions = (user?.publicMetadata?.permissions as string[] | undefined) ?? [];
  const isStaff = ALLOWED.staff.includes(role) || roles.some(r => ALLOWED.staff.includes(r));
  // A staff account explicitly granted a section (e.g. 'events') may use that
  // section's endpoints even below the level the endpoint otherwise requires.
  const viaPermission = !!opts.orPermission && isStaff && permissions.includes(opts.orPermission);
  if (!viaPermission && !allowed.includes(role) && !roles.some(r => allowed.includes(r))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { userId, role, roles };
}
