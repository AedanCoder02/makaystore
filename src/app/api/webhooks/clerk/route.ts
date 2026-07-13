import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'No webhook secret' }, { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { type: string; data: { id: string; public_metadata?: Record<string, unknown> } };
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as typeof evt;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (evt.type === 'user.created') {
    const { id: clerkId, public_metadata } = evt.data;

    // Only assign customer role if no role is set
    if (!public_metadata?.role) {
      const client = await clerkClient();
      await client.users.updateUser(clerkId, {
        publicMetadata: { role: 'customer' },
      });
    }

    // Create their profile row
    await sql`
      INSERT INTO user_profiles (clerk_id)
      VALUES (${clerkId})
      ON CONFLICT (clerk_id) DO NOTHING
    `;
  }

  return NextResponse.json({ received: true });
}
