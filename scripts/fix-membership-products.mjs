import postgres from 'postgres';

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error('Missing DATABASE_URL'); process.exit(1); }
const sql = postgres(DB_URL);

const updates = [
  {
    id: 'membership-bronze',
    price: 150,
    description: 'Membresía trimestral Bronce. Incluye: 10% de descuento en todos nuestros productos y servicios • Priority Access: reservas prioritarias en fechas especiales y eventos • Acceso Exclusivo: invitación a nuestras catas y eventos cerrados • Asesoría personalizada con tu Vacation Planner • Membresía Transferible (hasta 3 personas autorizadas)',
  },
  {
    id: 'membership-silver',
    price: 300,
    description: 'Membresía trimestral Plata. Incluye: Toldo GRATIS durante la temporada baja • 10% de descuento en todos nuestros productos y servicios • Priority Access: reservas prioritarias en fechas especiales y eventos • Acceso Exclusivo: invitación a nuestras catas y eventos cerrados • Asesoría personalizada con tu Vacation Planner • Membresía Transferible (hasta 3 personas autorizadas)',
  },
  {
    id: 'membership-gold',
    price: 450,
    description: 'Membresía trimestral Oro. Incluye: Toldo GRATIS durante la temporada baja • 10% de descuento en todos nuestros productos y servicios • Priority Access: reservas prioritarias en fechas especiales y eventos • Acceso Exclusivo: invitación a nuestras catas y eventos cerrados • Acceso Deportivo GRATIS: Beach Tennis y Voleibol de playa • Descuentos Exclusivos en todas nuestras marcas aliadas • Asesoría personalizada con tu Vacation Planner • Membresía Transferible (hasta 3 personas autorizadas)',
  },
];

for (const u of updates) {
  await sql`
    UPDATE products
    SET price = ${u.price}, description = ${u.description}, updated_at = NOW()
    WHERE id = ${u.id}
  `;
  console.log(`Updated ${u.id} → $${u.price}`);
}

// Verify
const rows = await sql`SELECT id, title, price, status FROM products WHERE id IN ('membership-bronze','membership-silver','membership-gold')`;
console.log('\nVerified:', JSON.stringify(rows, null, 2));

await sql.end();
