import { config } from 'dotenv';
config({ path: '.env.local' });

process.env.GMAIL_USER = 'ap.bymakay@gmail.com';
process.env.GMAIL_APP_PASSWORD = 'jfwhaajnojpaqkpn';

const { sendMembershipWelcomeEmail, sendMembershipContractEmail } = await import('../src/lib/email.ts');

const TEST_ADDRESSES = [
  'mentoriabelo@gmail.com',
];

const TEST_DATA = {
  name: 'Aedan Proger',
  tier: 'gold',
  duration: 'trimestral',
  amount: 450,
  orderId: 'TEST-001',
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  locale: 'es',
};

for (const email of TEST_ADDRESSES) {
  console.log(`\nSending to ${email}...`);
  try {
    await sendMembershipWelcomeEmail({ ...TEST_DATA, to: email });
    console.log(`  ✓ Welcome sent`);
  } catch (e) {
    console.error(`  ✗ Welcome failed:`, e.message);
  }
  try {
    await sendMembershipContractEmail({ ...TEST_DATA, to: email });
    console.log(`  ✓ Contract sent`);
  } catch (e) {
    console.error(`  ✗ Contract failed:`, e.message);
  }
}

console.log('\nDone.');
