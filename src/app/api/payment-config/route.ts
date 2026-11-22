import { NextResponse } from 'next/server';
import { getPaymentSettings, enabledMethods } from '@/lib/payments';

export const dynamic = 'force-dynamic';

// GET — public: the methods a customer can use and the credentials to show for manual ones.
export async function GET() {
  try {
    const s = await getPaymentSettings();
    const methods = enabledMethods(s);
    return NextResponse.json({
      methods,
      credentials: {
        pago_movil:     methods.includes('pago_movil')     ? s.pago_movil     : null,
        transferencia:  methods.includes('transferencia')  ? s.transferencia  : null,
        zelle:          methods.includes('zelle')          ? s.zelle          : null,
        binance_pay_id: methods.includes('binance_pay_id') ? s.binance_pay_id : null,
      },
      ves_rate: s.ves_rate,
      instructions: s.instructions,
    });
  } catch (e) {
    console.error('[payment-config]', e);
    return NextResponse.json({ error: 'Failed to load payment config' }, { status: 500 });
  }
}
