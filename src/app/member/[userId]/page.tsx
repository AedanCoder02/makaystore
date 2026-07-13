import { clerkClient } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import sql from '@/lib/db';
import MemberCard from '@/components/profile/MemberCard';

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return {
      title: `${user.firstName} ${user.lastName} — Makay Beach Club`,
      description: 'Makay Beach Club Member',
    };
  } catch {
    return { title: 'Makay Beach Club Member' };
  }
}

export default async function MemberPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  let user;
  try {
    const client = await clerkClient();
    user = await client.users.getUser(userId);
  } catch {
    notFound();
  }

  let membershipTier = 'free';
  try {
    const rows = await sql`SELECT membership_tier FROM user_profiles WHERE clerk_id = ${userId}`;
    if (rows.length > 0) membershipTier = (rows[0].membership_tier as string) ?? 'free';
  } catch {
    // stays free
  }

  return (
    <MemberCard
      firstName={user.firstName ?? ''}
      lastName={user.lastName ?? ''}
      imageUrl={user.imageUrl}
      membershipTier={membershipTier}
      memberSince={new Date(user.createdAt).getFullYear()}
      userId={userId}
    />
  );
}
