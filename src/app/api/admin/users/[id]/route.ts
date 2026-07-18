import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const ALLOWED_ROLES = ['customer', 'seller', 'supervisor', 'admin'];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { role } = await req.json();

  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const client = await clerkClient();
    await client.users.updateUserMetadata(id, { publicMetadata: { role } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('update role error:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
