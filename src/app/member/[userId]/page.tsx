import { clerkClient } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
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
      description: 'Makay Beach Club Membership Card',
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

  // Detect locale
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'es';

  let membershipTier = 'free';
  let membershipExpiresAt: string | null = null;
  let membershipStartedAt: string | null = null;
  let membershipDuration: string | null = null;

  try {
    const rows = await sql`
      SELECT membership_tier, membership_expires_at, membership_started_at, membership_duration
      FROM user_profiles WHERE clerk_id = ${userId}
    `;
    if (rows.length > 0) {
      membershipTier      = (rows[0].membership_tier as string) ?? 'free';
      membershipExpiresAt = rows[0].membership_expires_at ? String(rows[0].membership_expires_at) : null;
      membershipStartedAt = rows[0].membership_started_at ? String(rows[0].membership_started_at) : null;
      membershipDuration  = (rows[0].membership_duration as string) ?? null;
    }
  } catch {}

  const isActive = membershipTier !== 'free' && membershipTier !== 'member'
    ? (membershipExpiresAt ? new Date(membershipExpiresAt) > new Date() : true)
    : false;

  return (
    <MemberCard
      firstName={user.firstName ?? ''}
      lastName={user.lastName ?? ''}
      imageUrl={user.imageUrl}
      membershipTier={membershipTier}
      memberSince={new Date(user.createdAt).getFullYear()}
      userId={userId}
      isActive={isActive}
      membershipExpiresAt={membershipExpiresAt}
      membershipStartedAt={membershipStartedAt}
      membershipDuration={membershipDuration}
      locale={locale}
    />
  );
}
