/**
 * Creates users in Clerk + seeds user_profiles in Neon DB.
 * Run: node scripts/create-users.mjs
 * Requires CLERK_SECRET_KEY and DATABASE_URL env vars.
 */
import postgres from 'postgres';

const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const DB_URL       = process.env.DATABASE_URL;
if (!CLERK_SECRET || !DB_URL) { console.error('Missing CLERK_SECRET_KEY or DATABASE_URL'); process.exit(1); }

const sql = postgres(DB_URL);

async function createClerkUser({ firstName, lastName, email, phone }) {
  // Generate unique username from email prefix + random suffix
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  const username = `${base}${suffix}`;

  const body = {
    first_name:    firstName,
    last_name:     lastName ?? '',
    email_address: [email],
    username,
    password:      generatePassword(),
    public_metadata: { role: 'customer' },
    ...(phone ? { unsafe_metadata: { phone } } : {}),
  };
  const res = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${CLERK_SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    // If email already exists, look up the existing user
    if (data.errors?.some(e => e.code === 'form_identifier_exists')) {
      console.log(`  ↩ Already exists: ${email} — looking up`);
      return lookupByEmail(email);
    }
    throw new Error(JSON.stringify(data.errors ?? data));
  }
  return data;
}

async function lookupByEmail(email) {
  const res = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}&limit=1`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET}` },
  });
  const list = await res.json();
  return Array.isArray(list) ? list[0] : list?.data?.[0];
}

async function seedProfile(clerkId, { bio, dollar_balance }) {
  await sql`
    INSERT INTO user_profiles (clerk_id, bio, wallet_points, dollar_balance, membership_tier)
    VALUES (${clerkId}, ${bio ?? ''}, 0, ${Number(dollar_balance ?? 0)}, 'free')
    ON CONFLICT (clerk_id) DO UPDATE SET
      bio            = EXCLUDED.bio,
      dollar_balance = GREATEST(user_profiles.dollar_balance, EXCLUDED.dollar_balance),
      updated_at     = NOW()
  `;
  if (dollar_balance && Number(dollar_balance) > 0) {
    const prof = await sql`SELECT id FROM user_profiles WHERE clerk_id = ${clerkId} LIMIT 1`;
    if (prof.length) {
      await sql`
        INSERT INTO wallet_transactions (user_id, type, points, description)
        VALUES (${prof[0].id}, 'admin_credit', 0, ${'Saldo inicial: $' + dollar_balance})
        ON CONFLICT DO NOTHING
      `.catch(() => {});
    }
  }
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  let p = ''; for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]; return p;
}

// ── User list ─────────────────────────────────────────────
// NOTE: Jenifer De Sousa skipped — no email address provided.
const USERS = [
  {
    firstName: 'Selen',   lastName: 'de Valera',
    email: 'camposdavila1512@gmail.com',
    dollar_balance: 400,
  },
  {
    firstName: 'Martha',  lastName: 'Venturelli',
    email: 'marthaventurelli@gmail.com',
    phone: '04143144279',
  },
  {
    firstName: 'Rosamaria', lastName: 'Garrido Alvarenga',
    email: 'rosamariaalvarenga7@gmail.com',
    phone: '04145495188',
  },
  {
    firstName: 'Jose Gregorio', lastName: 'Rojas Yanez',
    email: 'rojasjgx@gmail.com',
    bio: 'Cédula: 15788401',
  },
  {
    firstName: 'Alejandro', lastName: 'Scholtz',
    email: 'parquediverland@gmail.com',
    bio: 'El Paraíso 1, conjunto residencial Atlantis, casa #20, Pampatar',
  },
  {
    firstName: 'Orlis Karina', lastName: 'Vegas',
    email: 'pachamamavegas@gmail.com',
    bio: 'Av. Aldonza Manriques, Res. Bahía Dorada / PB4',
  },
  {
    firstName: 'Sandra',  lastName: 'Sánchez',
    email: 'sanchezsandracarolinag@gmail.com',
    bio: 'Avenida Bolívar, edificio Vincenzo, frente al centro comercial la Vela',
  },
  {
    firstName: 'María Yolanda', lastName: 'Rivas',
    email: 'myrivas@gmail.com',
    bio: 'Aguamarina Country Club TH 79, Pampatar',
  },
  {
    firstName: 'Yomnarys', lastName: 'Lira',
    email: 'yomnaryslira@gmail.com',
    bio: 'Urb. Playa El Angel, edificio Terrasol Suites',
  },
  {
    firstName: 'Daniella', lastName: 'Parra',
    email: 'danidani68@hotmail.com',
  },
  {
    firstName: 'Pedro',   lastName: 'Bravo',
    email: 'brafer0166@gmail.com',
  },
];

console.log(`Creating ${USERS.length} users...\n`);
const results = [];

for (const u of USERS) {
  process.stdout.write(`→ ${u.firstName} ${u.lastName} (${u.email})... `);
  try {
    const clerk = await createClerkUser(u);
    if (!clerk?.id) { console.log('✗ No Clerk ID returned'); results.push({ ...u, status: 'error' }); continue; }
    await seedProfile(clerk.id, { bio: u.bio, dollar_balance: u.dollar_balance });
    console.log(`✓ clerk_id: ${clerk.id}${u.dollar_balance ? ` | wallet: $${u.dollar_balance}` : ''}`);
    results.push({ name: `${u.firstName} ${u.lastName}`, email: u.email, clerk_id: clerk.id, status: 'created' });
  } catch (err) {
    console.log(`✗ ${err.message}`);
    results.push({ ...u, status: 'error', error: err.message });
  }
  await new Promise(r => setTimeout(r, 300)); // rate limit
}

console.log('\n── Summary ──');
results.forEach(r => console.log(`${r.status === 'created' ? '✓' : '✗'} ${r.name ?? r.firstName} — ${r.status}${r.error ? ': ' + r.error : ''}`));

await sql.end();
