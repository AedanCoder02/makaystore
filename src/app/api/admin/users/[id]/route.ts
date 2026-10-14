import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';

const ALLOWED_ROLES = ['customer', 'seller', 'supervisor', 'admin'];

// All toggleable sections per role
export const ROLE_SECTIONS: Record<string, { key: string; label: string }[]> = {
  seller: [
    { key: 'sell',        label: 'Sell to Client' },
    { key: 'products',    label: 'Products' },
    { key: 'stock',       label: 'Stock' },
    { key: 'rotation',    label: 'Rotation' },
    { key: 'studio',      label: 'Studio' },
    { key: 'activity',    label: 'My Activity' },
    { key: 'models3d',    label: 'Modelos 3D' },
    { key: 'events',      label: 'Events' },
    { key: 'memberships', label: 'Memberships' },
  ],
  supervisor: [
    { key: 'sup-overview', label: 'Overview' },
    { key: 'sup-staff',    label: 'Staff' },
    { key: 'sup-orders',   label: 'Orders' },
    { key: 'sup-shifts',   label: 'Shifts' },
  ],
  admin: [
    { key: 'admin-orders',  label: 'Orders' },
    { key: 'admin-users',   label: 'Users' },
    { key: 'admin-reports', label: 'Reports' },
    { key: 'admin-events',  label: 'Events' },
  ],
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // This route grants role and permissions to ANY target user — it must be
  // admin-only. Its absence let any authenticated user (including a plain
  // customer) PATCH their own role to 'admin' or grant themselves arbitrary
  // permissions with a single request; this is the actual fix, the
  // publicMetadata-vs-unsafeMetadata change on its own didn't close it.
  const caller = await currentUser();
  if ((caller?.publicMetadata?.role as string | undefined) !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { role, roles, permissions } = body;

  try {
    const client = await clerkClient();
    const updates: Record<string, unknown> = {};

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = role;
    }

    if (roles !== undefined) {
      if (!Array.isArray(roles) || roles.some(r => !ALLOWED_ROLES.includes(r))) {
        return NextResponse.json({ error: 'Invalid roles' }, { status: 400 });
      }
      updates.roles = roles;
    }

    if (permissions !== undefined) {
      // publicMetadata, not unsafeMetadata: publicMetadata is readable client-side
      // (what the original comment here wanted) but — unlike unsafeMetadata — is
      // writable only through the backend Clerk client, never by the user's own
      // browser session. unsafeMetadata would let any signed-in user grant
      // themselves arbitrary permissions via the client SDK.
      await client.users.updateUserMetadata(id, { publicMetadata: { permissions } });
    }

    if (Object.keys(updates).length > 0) {
      await client.users.updateUserMetadata(id, { publicMetadata: updates });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('update user error:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
