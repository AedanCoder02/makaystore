import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profiles = await sql`
    SELECT id, wallet_points, COALESCE(dollar_balance, 0) AS dollar_balance
    FROM user_profiles WHERE clerk_id = ${userId}
  `;

  if (!profiles.length) {
    return NextResponse.json({ points: 0, dollar_balance: 0, pts_per_dollar: 10, total_spend: 0, transactions: [], credit_lines: [] });
  }

  const profile = profiles[0];

  const [transactions, creditRows, configRows, spendRows] = await Promise.all([
    sql`
      SELECT id, type, points, order_id, description, created_at
      FROM wallet_transactions
      WHERE user_id = ${profile.id}
      ORDER BY created_at DESC
      LIMIT 50
    `,
    sql`
      SELECT id, principal, interest_rate, issued_at, due_date, status, notes
      FROM credit_lines
      WHERE user_id = ${profile.id} AND status = 'active'
      ORDER BY created_at DESC
    `.catch(() => []),
    sql`SELECT pts_per_dollar FROM wallet_config WHERE id = 1`.catch(() => []),
    sql`
      SELECT COALESCE(SUM(total), 0) AS total
      FROM orders
      WHERE customer_id = ${userId}
        AND status NOT IN ('cancelled', 'refunded')
    `.catch(() => [{ total: 0 }]),
  ]);

  const pts_per_dollar = (configRows[0] as { pts_per_dollar: number } | undefined)?.pts_per_dollar ?? 10;
  const total_spend = Number((spendRows[0] as { total: string | number } | undefined)?.total ?? 0);

  const credit_lines = (creditRows as Array<{
    id: number; principal: string; interest_rate: string;
    issued_at: string; due_date: string; status: string; notes: string | null;
  }>).map(cl => {
    const principal = Number(cl.principal);
    const rate = Number(cl.interest_rate);
    const days_elapsed = Math.max(0, Math.floor((Date.now() - new Date(cl.issued_at).getTime()) / 86_400_000));
    const accumulated_interest = Math.round(principal * rate * (days_elapsed / 365) * 100) / 100;
    return {
      id: cl.id, principal, interest_rate: rate,
      issued_at: cl.issued_at, due_date: cl.due_date, status: cl.status, notes: cl.notes,
      days_elapsed, accumulated_interest,
      total_owed: Math.round((principal + accumulated_interest) * 100) / 100,
    };
  });

  return NextResponse.json({
    points: profile.wallet_points,
    dollar_balance: Number(profile.dollar_balance),
    pts_per_dollar,
    total_spend,
    transactions,
    credit_lines,
  });
}
