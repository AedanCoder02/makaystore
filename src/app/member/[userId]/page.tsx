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
  } catch {}

  // Load card colors from theme settings
  let cardColors = { bg_from: '#1E1A14', bg_to: '#2C2416', bg_angle: 135, text: '#F5EFE5', accent: '#D4AF37' };
  try {
    const rows = await sql`SELECT settings FROM theme_settings WHERE id = 1`;
    const s = rows[0]?.settings as Record<string, string> | undefined;
    if (s?.card_colors) {
      const parsed = JSON.parse(s.card_colors);
      cardColors = { ...cardColors, ...parsed };
    }
  } catch {}

  return (
    <MemberCard
      firstName={user.firstName ?? ''}
      lastName={user.lastName ?? ''}
      imageUrl={user.imageUrl}
      membershipTier={membershipTier}
      memberSince={new Date(user.createdAt).getFullYear()}
      userId={userId}
      cardColors={cardColors}
    />
  );
}
