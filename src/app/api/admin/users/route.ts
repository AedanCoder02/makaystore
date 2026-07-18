import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 200 });

    const result = users.map((u) => ({
      id: u.id,
      fullName: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || '—',
      email: u.emailAddresses[0]?.emailAddress ?? '',
      role: (u.publicMetadata?.role as string) ?? 'customer',
      createdAt: u.createdAt,
      imageUrl: u.imageUrl,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('admin users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
