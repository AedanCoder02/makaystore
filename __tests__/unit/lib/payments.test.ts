jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/lib/email', () => ({ sendMembershipWelcomeEmail: jest.fn(), sendMembershipContractEmail: jest.fn() }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), currentUser: jest.fn() }));

import { enabledMethods, DEFAULT_PAYMENT_SETTINGS, isManualMethod, isGatewayMethod } from '@/lib/payments';
import { toMerchantTradeNo } from '@/lib/binancePay';

const ENV = process.env;

describe('enabledMethods', () => {
  beforeEach(() => { process.env = { ...ENV }; });
  afterAll(() => { process.env = ENV; });

  const settings = (patch: Partial<typeof DEFAULT_PAYMENT_SETTINGS> = {}) => ({ ...DEFAULT_PAYMENT_SETTINGS, ...patch });

  it('offers nothing when no gateway keys and no manual method is enabled', () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.BINANCE_PAY_API_KEY;
    expect(enabledMethods(settings())).toEqual([]);
  });

  it('needs both Stripe keys to offer cards', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    expect(enabledMethods(settings())).not.toContain('stripe');
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_x';
    expect(enabledMethods(settings())).toContain('stripe');
  });

  it('lists enabled manual methods', () => {
    const s = settings({
      pago_movil: { ...DEFAULT_PAYMENT_SETTINGS.pago_movil, enabled: true },
      zelle: { ...DEFAULT_PAYMENT_SETTINGS.zelle, enabled: true },
    });
    expect(enabledMethods(s)).toEqual(expect.arrayContaining(['pago_movil', 'zelle']));
    expect(enabledMethods(s)).not.toContain('transferencia');
  });

  it('hides the manual Binance Pay ID when the Binance Pay API is configured', () => {
    const s = settings({ binance_pay_id: { ...DEFAULT_PAYMENT_SETTINGS.binance_pay_id, enabled: true } });
    delete process.env.BINANCE_PAY_API_KEY;
    expect(enabledMethods(s)).toContain('binance_pay_id');
    process.env.BINANCE_PAY_API_KEY = 'k';
    process.env.BINANCE_PAY_SECRET_KEY = 's';
    expect(enabledMethods(s)).toContain('binance');
    expect(enabledMethods(s)).not.toContain('binance_pay_id');
  });
});

describe('method helpers', () => {
  it('classifies methods', () => {
    expect(isManualMethod('zelle')).toBe(true);
    expect(isManualMethod('stripe')).toBe(false);
    expect(isGatewayMethod('binance')).toBe(true);
    expect(isGatewayMethod('pago_movil')).toBe(false);
  });

  it('builds a Binance merchantTradeNo with letters/digits only, max 32 chars', () => {
    expect(toMerchantTradeNo('ORD-1732280000000')).toBe('ORD1732280000000');
    expect(toMerchantTradeNo('x'.repeat(40) + '-1')).toHaveLength(32);
  });
});
