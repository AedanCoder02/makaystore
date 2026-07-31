import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

// 1. Add provider column
await sql.unsafe(`ALTER TABLE products ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT '';`);
console.log('provider column ready');

// 2. Skip if already seeded
const existing = await sql`SELECT id FROM products WHERE title = 'Short blanco' AND provider = 'Makay' LIMIT 1`;
if (existing.length > 0) {
  console.log('Products already seeded — skipping insert.');
  await sql.end();
  process.exit(0);
}

const products = [
  // ── Ropa Makay ──
  { title: 'Short blanco',              provider: 'Makay', price: 30,   stock: 7,  category: 'Ropa' },
  { title: 'Short negro',               provider: 'Makay', price: 30,   stock: 16, category: 'Ropa' },
  { title: 'Franela manga larga negra', provider: 'Makay', price: 30,   stock: 4,  category: 'Ropa' },
  { title: 'Franela manga larga blanca',provider: 'Makay', price: 30,   stock: 0,  category: 'Ropa' },
  { title: 'Franela manga corta blanca',provider: 'Makay', price: 20,   stock: 4,  category: 'Ropa' },
  { title: 'Franela manga corta rosada',provider: 'Makay', price: 20,   stock: 8,  category: 'Ropa' },
  { title: 'Franela manga corta azul',  provider: 'Makay', price: 20,   stock: 3,  category: 'Ropa' },
  { title: 'Franela manga corta morada',provider: 'Makay', price: 20,   stock: 2,  category: 'Ropa' },
  { title: 'Franela manga corta verde', provider: 'Makay', price: 20,   stock: 7,  category: 'Ropa' },
  { title: 'Conjunto largo',            provider: 'Makay', price: 40,   stock: 0,  category: 'Ropa' },
  { title: 'Conjunto corto',            provider: 'Makay', price: 30,   stock: 0,  category: 'Ropa' },
  // ── Accesorios Makay ──
  { title: 'Cartera Makay',             provider: 'Makay', price: 10,   stock: 6,  category: 'Accesorios' },
  { title: 'Gorra blanca',              provider: 'Makay', price: 25,   stock: 0,  category: 'Accesorios' },
  { title: 'Gorra negra',               provider: 'Makay', price: 25,   stock: 0,  category: 'Accesorios' },
  { title: 'Sombrero pq',               provider: 'Makay', price: 14,   stock: 14, category: 'Accesorios' },
  { title: 'Sombrero gd',               provider: 'Makay', price: 25,   stock: 0,  category: 'Accesorios' },
  { title: 'Tote bag Makay',            provider: 'Makay', price: 25,   stock: 1,  category: 'Accesorios' },
  { title: 'Vaso térmico grande',        provider: 'Makay', price: 50,   stock: 0,  category: 'Accesorios' },
  { title: 'Vaso térmico pq',            provider: 'Makay', price: 40,   stock: 0,  category: 'Accesorios' },
  { title: 'Gafas OKLEY',               provider: 'Makay', price: 40,   stock: 0,  category: 'Accesorios' },
  // ── Snacks ──
  { title: 'Doritos',                   provider: 'Makay', price: 7,    stock: 5,  category: 'Snacks' },
  { title: 'Natuchips',                 provider: 'Makay', price: 8,    stock: 0,  category: 'Snacks' },
  { title: 'Pepito',                    provider: 'Makay', price: 3,    stock: 2,  category: 'Snacks' },
  { title: 'Tostitos',                  provider: 'Makay', price: 4,    stock: 1,  category: 'Snacks' },
  { title: 'Maní',                      provider: 'Makay', price: 8,    stock: 7,  category: 'Snacks' },
  { title: 'Ruffles',                   provider: 'Makay', price: 9,    stock: 0,  category: 'Snacks' },
  { title: 'Cheese tris',               provider: 'Makay', price: 5,    stock: 0,  category: 'Snacks' },
  { title: 'Jack chicharrón picante',   provider: 'Makay', price: 7,    stock: 0,  category: 'Snacks' },
  { title: 'Belmont',                   provider: 'Makay', price: 10,   stock: 1,  category: 'Snacks' },
  { title: 'Lucky nova',                provider: 'Makay', price: 10,   stock: 12, category: 'Snacks' },
  { title: 'Samba',                     provider: 'Makay', price: 2.5,  stock: 8,  category: 'Snacks' },
  { title: 'Snickers',                  provider: 'Makay', price: 5,    stock: 6,  category: 'Snacks' },
  { title: 'M&M',                       provider: 'Makay', price: 6,    stock: 9,  category: 'Snacks' },
  { title: 'Flips pq',                  provider: 'Makay', price: 2,    stock: 8,  category: 'Snacks' },
  { title: 'Lucky red',                 provider: 'Makay', price: 10,   stock: 0,  category: 'Snacks' },
  { title: 'Lucky eclipse',             provider: 'Makay', price: 10,   stock: 0,  category: 'Snacks' },
  { title: 'Lucky Cosmic',              provider: 'Makay', price: 10,   stock: 0,  category: 'Snacks' },
  { title: 'Caramelos de menta',        provider: 'Big mama', price: 1, stock: 0,  category: 'Snacks' },
  // ── Higiene ──
  { title: 'Always toallas',            provider: 'Makay', price: 8,    stock: 4,  category: 'Higiene' },
  { title: 'Kotex Protector diarios',   provider: 'Makay', price: 5,    stock: 6,  category: 'Higiene' },
  // ── Belleza ──
  { title: 'Agrado Bruma solar facial',              provider: 'Makay', price: 15, stock: 2,  category: 'Belleza' },
  { title: 'Zoah Protector solar corporal gd aerosol',provider: 'Makay', price: 21, stock: 9,  category: 'Belleza' },
  { title: 'Zoah pantalla solar corporal gd en crema',provider: 'Makay', price: 15, stock: 8,  category: 'Belleza' },
  { title: 'Zoah Crema aclarante bright skin',        provider: 'Makay', price: 12, stock: 2,  category: 'Belleza' },
  { title: 'Zoah Crema corporal para las estrías',    provider: 'Makay', price: 15, stock: 2,  category: 'Belleza' },
  { title: 'Zoah crema corporal para la celulitis',   provider: 'Makay', price: 15, stock: 7,  category: 'Belleza' },
  { title: 'Zoah gel de limpieza íntima',             provider: 'Makay', price: 15, stock: 1,  category: 'Belleza' },
  { title: 'Zoah protector solar facial pq en crema', provider: 'Makay', price: 12, stock: 0,  category: 'Belleza' },
  { title: 'Bronceador Australian Gold',              provider: 'Makay', price: 30, stock: 2,  category: 'Belleza' },
  { title: 'La piel Crema líquida negra',             provider: 'Makay', price: 6,  stock: 2,  category: 'Belleza' },
  { title: 'La piel Crema líquida incolora',          provider: 'Makay', price: 6,  stock: 2,  category: 'Belleza' },
  { title: 'Colágeno Nutribrain',                     provider: 'Nutribrain', price: 30, stock: 5, category: 'Belleza' },
  // ── Calzado Havaianas ──
  { title: 'Flip flop Top athletic lemon green',      provider: 'Havaianas', price: 22, stock: 0,  category: 'Calzado' },
  { title: 'Flip flop Brasil navy blue',              provider: 'Havaianas', price: 22, stock: 0,  category: 'Calzado' },
  { title: 'Flip flop Slim gloss navy',               provider: 'Havaianas', price: 25, stock: 3,  category: 'Calzado' },
  { title: 'Flip flop Top pride al over azul',        provider: 'Havaianas', price: 34, stock: 0,  category: 'Calzado' },
  { title: 'Flip flop Slim gloss ballet rose GD',     provider: 'Havaianas', price: 25, stock: 0,  category: 'Calzado' },
  { title: 'Flip flop Slim dark brown/metal',         provider: 'Havaianas', price: 21, stock: 1,  category: 'Calzado' },
  { title: 'Flip flop Slim Golden',                   provider: 'Havaianas', price: 21, stock: 1,  category: 'Calzado' },
  { title: 'Flip flop Top logomanía 2 rojo rubí',     provider: 'Havaianas', price: 25, stock: 4,  category: 'Calzado' },
  { title: 'Flip flop Brasil',                        provider: 'Havaianas', price: 22, stock: 2,  category: 'Calzado' },
  { title: 'Flip flop Slim square glitter velvet',    provider: 'Havaianas', price: 41, stock: 0,  category: 'Calzado' },
  { title: 'Flip flop Kids Minecraft WT/blue',        provider: 'Havaianas', price: 25, stock: 4,  category: 'Calzado' },
  { title: 'Flip flop Slim Disney princess yellow',   provider: 'Havaianas', price: 25, stock: 3,  category: 'Calzado' },
  { title: 'Flip flop Kids slim princess Golden',     provider: 'Havaianas', price: 25, stock: 3,  category: 'Calzado' },
  { title: 'Flip flop Top athletic azul turquesa',    provider: 'Havaianas', price: 19, stock: 3,  category: 'Calzado' },
  { title: 'Flip flop Slim Disney prisma purple',     provider: 'Havaianas', price: 25, stock: 6,  category: 'Calzado' },
  { title: 'Flip flop baby Brasil logo marinos/amarillo', provider: 'Havaianas', price: 21, stock: 9, category: 'Calzado' },
  { title: 'Flip flop Brasil Black',                  provider: 'Havaianas', price: 22, stock: 3,  category: 'Calzado' },
  { title: 'Flip flop Slim Brasil black',             provider: 'Havaianas', price: 37, stock: 0,  category: 'Calzado' },
  { title: 'Flip flop Top max comfort FC',            provider: 'Havaianas', price: 30, stock: 0,  category: 'Calzado' },
  { title: 'Tote bag Havaianas',                      provider: 'Havaianas', price: 14, stock: 1,  category: 'Accesorios' },
  // ── Tallulah ──
  { title: 'Bolso pequeño',   provider: 'Tallulah', price: 30, stock: 9,  category: 'Accesorios' },
  { title: 'Bolso mediano',   provider: 'Tallulah', price: 45, stock: 9,  category: 'Accesorios' },
  { title: 'Bolso grande',    provider: 'Tallulah', price: 50, stock: 0,  category: 'Accesorios' },
  // ── Idealo ──
  { title: 'Taza isla margarita', provider: 'Idealo', price: 15, stock: 1, category: 'Recuerdos' },
  { title: 'Cartuchera',          provider: 'Idealo', price: 7,  stock: 2, category: 'Recuerdos' },
  { title: 'Barquito',            provider: 'Idealo', price: 6,  stock: 1, category: 'Recuerdos' },
  { title: 'Sombrero Idealo',     provider: 'Idealo', price: 15, stock: 1, category: 'Recuerdos' },
  { title: 'Imanes',              provider: 'Idealo', price: 5,  stock: 3, category: 'Recuerdos' },
  { title: 'Tote bag Idealo',     provider: 'Idealo', price: 15, stock: 2, category: 'Recuerdos' },
  // ── Shop artesanal ──
  { title: 'Collar de estrellas',   provider: 'Shop artesanal', price: 16, stock: 8, category: 'Accesorios' },
  { title: 'Collar de ojo turco',   provider: 'Shop artesanal', price: 26, stock: 1, category: 'Accesorios' },
  // ── Ilovemgta ──
  { title: 'Franela Ilovemgta', provider: 'Ilovemgta', price: 35, stock: 3, category: 'Ropa' },
  // ── Tarbay ──
  { title: 'Traje baño 1 pieza',        provider: 'Tarbay', price: 119, stock: 1,  category: 'Ropa' },
  { title: 'Gafas ($85)',               provider: 'Tarbay', price: 85,  stock: 1,  category: 'Accesorios' },
  { title: 'Gafas ($75)',               provider: 'Tarbay', price: 75,  stock: 2,  category: 'Accesorios' },
  { title: 'Gafas ($65)',               provider: 'Tarbay', price: 65,  stock: 3,  category: 'Accesorios' },
  { title: 'Cartera clutch ($169)',      provider: 'Tarbay', price: 169, stock: 0,  category: 'Accesorios' },
  { title: 'Cartera con asa pq ($210)', provider: 'Tarbay', price: 210, stock: 1,  category: 'Accesorios' },
  { title: 'Cartera con asa pq ($175)', provider: 'Tarbay', price: 175, stock: 1,  category: 'Accesorios' },
  { title: 'Cartera clutch ($189)',      provider: 'Tarbay', price: 189, stock: 1,  category: 'Accesorios' },
  { title: 'Cartera clutch especial',    provider: 'Tarbay', price: 199, stock: 0,  category: 'Accesorios' },
  { title: 'Cartera clutch ($159)',      provider: 'Tarbay', price: 159, stock: 0,  category: 'Accesorios' },
  { title: 'Cartera mediana ($299)',     provider: 'Tarbay', price: 299, stock: 2,  category: 'Accesorios' },
  { title: 'Cartera mediana ($329)',     provider: 'Tarbay', price: 329, stock: 0,  category: 'Accesorios' },
  { title: 'Cartera grande ($389)',      provider: 'Tarbay', price: 389, stock: 1,  category: 'Accesorios' },
  { title: 'Cartera grande ($429)',      provider: 'Tarbay', price: 429, stock: 1,  category: 'Accesorios' },
  { title: 'Cartera grande ($585)',      provider: 'Tarbay', price: 585, stock: 0,  category: 'Accesorios' },
  { title: 'Pareo Tarbay',              provider: 'Tarbay', price: 75,  stock: 3,  category: 'Ropa' },
  { title: 'Sandalias Tarbay',          provider: 'Tarbay', price: 145, stock: 13, category: 'Calzado' },
  // ── Alejandra López ──
  { title: 'Velo traje baño 2 piezas',   provider: 'Alejandra López', price: 60, stock: 4, category: 'Ropa' },
  { title: 'Pulseras men ($30)',          provider: 'Alejandra López', price: 30, stock: 6, category: 'Accesorios' },
  { title: 'Pulseras men ($25)',          provider: 'Alejandra López', price: 25, stock: 8, category: 'Accesorios' },
  { title: 'Collares virgen',             provider: 'Alejandra López', price: 25, stock: 4, category: 'Accesorios' },
  { title: 'Collares varios ($35)',       provider: 'Alejandra López', price: 35, stock: 4, category: 'Accesorios' },
  { title: 'Collares varios ($55)',       provider: 'Alejandra López', price: 55, stock: 5, category: 'Accesorios' },
  { title: 'Collares varios ($65)',       provider: 'Alejandra López', price: 65, stock: 3, category: 'Accesorios' },
  // ── MOYA ──
  { title: 'Sal condimentada',            provider: 'MOYA', price: 4.5, stock: 11, category: 'Alimentos' },
  { title: 'Picante de mango',            provider: 'MOYA', price: 9.0, stock: 10, category: 'Alimentos' },
  { title: 'Ají margariteño polvo',       provider: 'MOYA', price: 6.0, stock: 10, category: 'Alimentos' },
  { title: 'Ají margariteño deshidratado',provider: 'MOYA', price: 5.5, stock: 5,  category: 'Alimentos' },
  // ── Varios ──
  { title: 'Ambientadores',                        provider: 'Big mama', price: 0, stock: 26, category: 'Varios' },
  { title: 'Plantilla de gel con microfibra',       provider: 'Makay',    price: 6, stock: 1,  category: 'Varios' },
  { title: 'La piel almohadilla plantar',           provider: 'Makay',    price: 4, stock: 2,  category: 'Varios' },
  { title: 'La piel parches protectores circulares',provider: 'Makay',    price: 4, stock: 2,  category: 'Varios' },
  { title: 'La piel parches protectores cuadrados', provider: 'Makay',    price: 4, stock: 2,  category: 'Varios' },
  { title: 'Estrellitas',                           provider: 'Makay',    price: 2, stock: 78, category: 'Varios' },
  { title: 'Colores',                               provider: 'Makay',    price: 5, stock: 15, category: 'Varios' },
];

console.log(`Inserting ${products.length} products…`);
let inserted = 0;
for (let i = 0; i < products.length; i++) {
  const p = products[i];
  const id = `prod-seed-${String(i + 1).padStart(3, '0')}`;
  await sql`
    INSERT INTO products (id, title, description, price, image, sku, stock, category, status, provider, sizes, colors, variants)
    VALUES (
      ${id}, ${p.title}, '', ${p.price}, '', '',
      ${p.stock}, ${p.category}, 'active', ${p.provider},
      '{}', '[]', '[]'
    )
    ON CONFLICT (id) DO NOTHING
  `;
  inserted++;
}
console.log(`Migration 006 done — ${inserted} products loaded, provider column added.`);
await sql.end();
