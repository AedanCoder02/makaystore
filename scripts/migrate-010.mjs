/**
 * Copies each Clerk user's existing unsafeMetadata.permissions into
 * publicMetadata.permissions, so no currently-granted seller/supervisor
 * permission silently disappears once the app switches to reading
 * permissions from publicMetadata only (unsafeMetadata is user-editable
 * client-side and must never gate authorization — see commit b6228d3).
 *
 * Idempotent: a user whose publicMetadata.permissions already matches is
 * skipped. Does NOT remove the old unsafeMetadata.permissions value —
 * leaving it in place is harmless now that nothing reads it for auth.
 *
 * Run: CLERK_SECRET_KEY=... node scripts/migrate-010.mjs
 */
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET) { console.error('Missing CLERK_SECRET_KEY'); process.exit(1); }

const headers = { Authorization: `Bearer ${CLERK_SECRET}`, 'Content-Type': 'application/json' };

async function listAllUsers() {
  const users = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const res = await fetch(`https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) throw new Error(`list users failed: ${res.status} ${await res.text()}`);
    const page = await res.json();
    users.push(...page);
    if (page.length < limit) break;
    offset += limit;
  }
  return users;
}

function sameArray(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

let migrated = 0;
let skippedNoPermissions = 0;
let skippedAlreadyMatching = 0;

const users = await listAllUsers();
console.log(`Found ${users.length} Clerk users`);

for (const user of users) {
  const unsafePermissions = user.unsafe_metadata?.permissions;
  const publicPermissions = user.public_metadata?.permissions;

  if (!Array.isArray(unsafePermissions) || unsafePermissions.length === 0) {
    skippedNoPermissions++;
    continue;
  }
  if (sameArray(unsafePermissions, publicPermissions)) {
    skippedAlreadyMatching++;
    continue;
  }

  const res = await fetch(`https://api.clerk.com/v1/users/${user.id}/metadata`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ public_metadata: { permissions: unsafePermissions } }),
  });
  if (!res.ok) {
    console.error(`  ✗ ${user.id} (${user.email_addresses?.[0]?.email_address ?? 'no email'}): ${res.status} ${await res.text()}`);
    continue;
  }
  migrated++;
  console.log(`  ✓ ${user.id} (${user.email_addresses?.[0]?.email_address ?? 'no email'}): [${unsafePermissions.join(', ')}]`);
}

console.log(`\nMigrated: ${migrated}, already matching: ${skippedAlreadyMatching}, no permissions to migrate: ${skippedNoPermissions}`);
console.log('Migration 010 complete');
