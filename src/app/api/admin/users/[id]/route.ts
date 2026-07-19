import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const ALLOWED_ROLES = ['customer', 'seller', 'supervisor', 'admin'];

// All toggleable sections per role
export const ROLE_SECTIONS: Record<string, { key: string; label: string }[]> = {
  seller: [
    { key: 'sell',     label: 'Sell to Client' },
    { key: 'products', label: 'Products' },
    { key: 'stock',    label: 'Stock' },
    { key: 'rotation', label: 'Rotation' },
    { key: 'studio',   label: 'Studio' },
    { key: 'activity', label: 'My Activity' },
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

  const { id } = await params;
  const body = await req.json();
  const { role, permissions } = body;

  try {
    const client = await clerkClient();
    const updates: Record<string, unknown> = {};

    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updates.role = role;
    }

    if (permissions !== undefined) {
      // permissions stored in unsafeMetadata so user can read it client-side
      await client.users.updateUserMetadata(id, { unsafeMetadata: { permissions } });
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
