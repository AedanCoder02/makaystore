import { NextRequest, NextResponse } from 'next/server';
import { getPaymentSettings, savePaymentSettings, getStaffRole, stripeEnabled, binanceApiEnabled } from '@/lib/payments';

async function requireAdmin() {
  const staff = await getStaffRole();
  return staff?.role === 'admin' ? staff : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const settings = await getPaymentSettings();
  return NextResponse.json({
    settings,
    gateways: {
      stripe: stripeEnabled(),
      stripe_webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      binance: binanceApiEnabled(),
    },
  });
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const settings = await savePaymentSettings(await req.json(), admin.userId);
  return NextResponse.json({ settings });
}
