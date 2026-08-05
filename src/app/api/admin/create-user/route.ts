import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  if (user?.publicMetadata?.role !== 'admin') return null;
  return userId;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { firstName, lastName, email, password, phone, bio, dollar_balance } = await req.json();
  if (!email || !firstName) return NextResponse.json({ error: 'firstName and email required' }, { status: 400 });

  const client = await clerkClient();

  // Create user in Clerk
  let clerkUser;
  try {
    clerkUser = await client.users.createUser({
      firstName,
      lastName: lastName ?? '',
      emailAddress: [email],
      password: password ?? generatePassword(),
      publicMetadata: { role: 'customer' },
      ...(phone ? { unsafeMetadata: { phone } } : {}),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Clerk error';
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  // Create user_profile in DB
  await sql`
    INSERT INTO user_profiles (clerk_id, bio, wallet_points, dollar_balance, membership_tier)
    VALUES (${clerkUser.id}, ${bio ?? ''}, 0, ${Number(dollar_balance ?? 0)}, 'free')
    ON CONFLICT (clerk_id) DO UPDATE SET
      bio            = EXCLUDED.bio,
      dollar_balance = EXCLUDED.dollar_balance,
      updated_at     = NOW()
  `.catch(() => {});

  // Seed wallet transaction if dollar_balance provided
  if (dollar_balance && Number(dollar_balance) > 0) {
    const prof = await sql`SELECT id FROM user_profiles WHERE clerk_id = ${clerkUser.id} LIMIT 1`;
    if (prof.length) {
      await sql`
        INSERT INTO wallet_transactions (user_id, type, points, description)
        VALUES (${prof[0].id}, 'admin_credit', 0, ${'Saldo inicial cargado por administrador: $' + dollar_balance})
      `.catch(() => {});
    }
  }

  return NextResponse.json({
    clerk_id:  clerkUser.id,
    email:     clerkUser.emailAddresses[0]?.emailAddress,
    firstName: clerkUser.firstName,
    lastName:  clerkUser.lastName,
  }, { status: 201 });
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let pass = '';
  for (let i = 0; i < 12; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass;
}
