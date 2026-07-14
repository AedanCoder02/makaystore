import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const client = await clerkClient();
  const result = await client.users.getUserList({ limit: 100, orderBy: '-created_at' });

  const customers = result.data
    .filter(u => {
      const role = u.publicMetadata?.role as string | undefined;
      return !role || role === 'customer';
    })
    .map(u => ({
      id: u.id,
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email: u.emailAddresses[0]?.emailAddress ?? '',
      imageUrl: u.imageUrl,
    }));

  return NextResponse.json(customers);
}
