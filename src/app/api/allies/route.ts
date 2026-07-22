import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

const TIER_RANK: Record<string, number> = { free: 0, bronze: 1, silver: 2, gold: 3, vip: 4 };

export async function GET() {
  const { userId } = await auth();

  let userTier = 'free';
  if (userId) {
    const rows = await sql`SELECT membership_tier FROM user_profiles WHERE clerk_id = ${userId}`;
    userTier = rows[0]?.membership_tier ?? 'free';
  }

  const allies = await sql`
    SELECT id, name, logo_url, description, discount_percent, discount_code, min_tier, display_order
    FROM allies
    WHERE active = true
    ORDER BY display_order ASC, id ASC
  `;

  const userRank = TIER_RANK[userTier] ?? 0;

  const result = allies.map(a => {
    const minRank = TIER_RANK[a.min_tier] ?? 1;
    const hasAccess = userRank >= minRank;
    return {
      id: a.id,
      name: a.name,
      logo_url: a.logo_url,
      description: a.description,
      discount_percent: a.discount_percent,
      discount_code: hasAccess ? a.discount_code : null,
      min_tier: a.min_tier,
      has_access: hasAccess,
    };
  });

  return NextResponse.json(result);
}
