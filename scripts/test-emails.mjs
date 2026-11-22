// Sends the membership welcome + contract emails to test inboxes.
// Usage: GMAIL_USER and GMAIL_APP_PASSWORD in .env.local,
//        TEST_EMAILS="a@example.com,b@example.com" node scripts/test-emails.mjs
import { config } from 'dotenv';
config({ path: '.env.local' });

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.error('Set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local');
  process.exit(1);
}

const TEST_ADDRESSES = (process.env.TEST_EMAILS ?? '').split(',').map(s => s.trim()).filter(Boolean);
if (TEST_ADDRESSES.length === 0) {
  console.error('Set TEST_EMAILS to a comma-separated list of recipients');
  process.exit(1);
}

const { sendMembershipWelcomeEmail, sendMembershipContractEmail } = await import('../src/lib/email.ts');

const TEST_DATA = {
  name: 'Test Member',
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
