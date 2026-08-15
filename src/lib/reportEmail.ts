import nodemailer from 'nodemailer';
import sql from '@/lib/db';
import { clerkClient } from '@clerk/nextjs/server';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

interface ReportRange {
  start: Date;
  end: Date;
  label: string;
  periodLabel: string;
}

export function getReportRange(period: ReportPeriod, now: Date): ReportRange {
  const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  if (period === 'daily') {
    const yesterday = new Date(ny);
    yesterday.setDate(yesterday.getDate() - 1);
    const start = new Date(yesterday); start.setHours(0, 0, 0, 0);
    const end   = new Date(yesterday); end.setHours(23, 59, 59, 999);
    return {
      start, end,
      label: yesterday.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      periodLabel: 'DIARIO',
    };
  }

  if (period === 'weekly') {
    // Last week: Mon–Sun
    const monday = new Date(ny);
    monday.setDate(ny.getDate() - ny.getDay() - 6);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const fmt = (d: Date) => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    return {
      start: monday, end: sunday,
      label: `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`,
      periodLabel: 'SEMANAL',
    };
  }

  // monthly: last full month
  const firstThisMonth = new Date(ny.getFullYear(), ny.getMonth(), 1);
  const start = new Date(ny.getFullYear(), ny.getMonth() - 1, 1);
  const end   = new Date(firstThisMonth.getTime() - 1);
  const monthName = start.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  return {
    start, end,
    label: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    periodLabel: 'MENSUAL',
  };
}

interface ReportData {
  period: ReportPeriod;
  range: ReportRange;
  revenue: number;
  orders: number;
  gifts: number;
  avgOrder: number;
  monthTarget: number;
  monthActual: number;
  topProducts: { title: string; units: number; revenue: number }[];
  topSellers: { name: string; orders: number; revenue: number }[];
  topClients: { name: string; orders: number; spent: number }[];
  topCategories: { category: string; units: number; revenue: number }[];
  stock: { total: number; inStock: number; low: number; outOfStock: number };
  costPct: number;
  grossMargin: number;
}

async function collectData(range: ReportRange, period: ReportPeriod): Promise<ReportData> {
  const { start, end } = range;

  // Ensure is_gift column exists (created lazily by seller order route)
  await sql`ALTER TABLE seller_orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE`.catch(() => {});

  const [salesRow] = await sql`
    SELECT
      COALESCE(SUM(subtotal::numeric), 0) AS revenue,
      COUNT(*) AS orders,
      COUNT(*) FILTER (WHERE COALESCE(is_gift, FALSE) = TRUE) AS gifts
    FROM seller_orders
    WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
  `;

  const revenue = Number(salesRow.revenue);
  const orders  = Number(salesRow.orders);
  const gifts   = Number(salesRow.gifts);
  const avgOrder = (orders - gifts) > 0 ? revenue / (orders - gifts) : 0;

  // Monthly target (always current month context)
  const [targetRow] = await sql`SELECT value FROM theme_settings WHERE key = 'monthly_target'`.catch(() => [{ value: '400000' }]);
  const [monthActualRow] = await sql`
    SELECT COALESCE(SUM(subtotal::numeric), 0) AS actual
    FROM seller_orders
    WHERE created_at >= date_trunc('month', NOW()) AND COALESCE(is_gift, FALSE) = FALSE
  `;

  // Top products from seller_orders items JSONB
  const topProductsRaw = await sql`
    SELECT
      item->>'title' AS title,
      SUM((item->>'qty')::numeric) AS units,
      SUM((item->>'price')::numeric * (item->>'qty')::numeric) AS revenue
    FROM seller_orders,
    jsonb_array_elements(items::jsonb) AS item
    WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY title
    ORDER BY revenue DESC
    LIMIT 10
  `.catch(() => []);

  // Top sellers
  const topSellersRaw = await sql`
    SELECT
      seller_id,
      COUNT(*) AS orders,
      SUM(subtotal::numeric) AS revenue
    FROM seller_orders
    WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY seller_id
    ORDER BY revenue DESC
    LIMIT 8
  `.catch(() => []);

  // Resolve seller names from Clerk
  const clerk = await clerkClient().catch(() => null);
  const topSellers = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (topSellersRaw as any[]).map(async (r: { seller_id: string; orders: number; revenue: number }) => {
      let name = r.seller_id.slice(-8);
      try {
        const user = clerk ? await clerk.users.getUser(r.seller_id) : null;
        if (user) name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || name;
      } catch { /* no-op */ }
      return { name, orders: Number(r.orders), revenue: Number(r.revenue) };
    })
  );

  // Top clients
  const topClientsRaw = await sql`
    SELECT
      COALESCE(NULLIF(client_name, ''), client_email, 'Desconocido') AS name,
      COUNT(*) AS orders,
      SUM(subtotal::numeric) AS spent
    FROM seller_orders
    WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY name
    ORDER BY spent DESC
    LIMIT 10
  `.catch(() => []);

  // Top categories from items JSONB
  const topCategoriesRaw = await sql`
    SELECT
      COALESCE(NULLIF(item->>'category', ''), 'Sin categoría') AS category,
      SUM((item->>'qty')::numeric) AS units,
      SUM((item->>'price')::numeric * (item->>'qty')::numeric) AS revenue
    FROM seller_orders,
    jsonb_array_elements(items::jsonb) AS item
    WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY category
    ORDER BY revenue DESC
    LIMIT 8
  `.catch(() => []);

  // Stock snapshot (current, not date-ranged)
  const stockRows = await sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE COALESCE((metadata->>'stock')::int, 0) > 5) AS in_stock,
      COUNT(*) FILTER (WHERE COALESCE((metadata->>'stock')::int, 0) BETWEEN 1 AND 5) AS low,
      COUNT(*) FILTER (WHERE COALESCE((metadata->>'stock')::int, 0) = 0) AS out_of_stock
    FROM products
  `.catch(() => [{ total: 0, in_stock: 0, low: 0, out_of_stock: 0 }]);

  // Cost data from products (avg cost vs price ratio)
  const costRow = await sql`
    SELECT
      AVG(
        CASE WHEN price > 0 AND cost > 0
          THEN (cost / price) * 100
          ELSE NULL END
      ) AS avg_cost_pct
    FROM products
    WHERE price > 0
  `.catch(() => [{ avg_cost_pct: null }]);

  const costPct = Number(costRow[0]?.avg_cost_pct ?? 0);
  const grossMargin = 100 - costPct;

  return {
    period,
    range,
    revenue,
    orders,
    gifts,
    avgOrder,
    monthTarget: Number(targetRow?.value ?? 400000),
    monthActual: Number(monthActualRow.actual),
    topProducts: topProductsRaw.map((r: any) => ({ title: r.title ?? '—', units: Number(r.units), revenue: Number(r.revenue) })),
    topSellers,
    topClients: topClientsRaw.map((r: any) => ({ name: r.name, orders: Number(r.orders), spent: Number(r.spent) })),
    topCategories: topCategoriesRaw.map((r: any) => ({ category: r.category, units: Number(r.units), revenue: Number(r.revenue) })),
    stock: {
      total: Number(stockRows[0]?.total ?? 0),
      inStock: Number(stockRows[0]?.in_stock ?? 0),
      low: Number(stockRows[0]?.low ?? 0),
      outOfStock: Number(stockRows[0]?.out_of_stock ?? 0),
    },
    costPct,
    grossMargin,
  };
}

const $ = (n: number) => `$${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

function tableRows(rows: string[][]): string {
  return rows.map((cols, i) => {
    const bg = i % 2 === 0 ? '#FFFFFF' : '#FBF6F1';
    return `<tr style="background:${bg};">${cols.map((c, ci) =>
      `<td style="font-family:Arial,sans-serif;font-size:12px;color:${ci === 0 ? '#3D2B1F' : '#1e1611'};padding:7px 10px;border-bottom:1px solid #EDE5DA;${ci > 0 ? 'text-align:right;font-weight:600;' : ''}">${c}</td>`
    ).join('')}</tr>`;
  }).join('');
}

function section(title: string, icon: string, content: string): string {
  return `
    <div style="margin-bottom:28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <thead>
          <tr style="background:#1e1611;">
            <th colspan="99" style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#D4A574;padding:9px 12px;text-align:left;">${icon}&nbsp;&nbsp;${title}</th>
          </tr>
        </thead>
        <tbody>${content}</tbody>
      </table>
    </div>`;
}

function kpiRow(kpis: { label: string; value: string; sub?: string }[]): string {
  return `
    <tr style="background:#FBF6F1;">
      ${kpis.map(k => `
        <td style="padding:16px 12px;text-align:center;border-right:1px solid #EDE5DA;">
          <div style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#D4A574;">${k.value}</div>
          <div style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#9c8070;margin-top:3px;">${k.label}</div>
          ${k.sub ? `<div style="font-family:Arial,sans-serif;font-size:10px;color:#b0a090;margin-top:2px;">${k.sub}</div>` : ''}
        </td>
      `).join('')}
    </tr>`;
}

function buildHtml(d: ReportData): string {
  const { range } = d;
  const progressPct = d.monthTarget > 0 ? Math.min(100, (d.monthActual / d.monthTarget) * 100) : 0;
  const barColor = progressPct >= 90 ? '#22c55e' : progressPct >= 60 ? '#D4A574' : '#ef4444';

  // Sections
  const s1 = section('RESUMEN EJECUTIVO', '📊', kpiRow([
    { label: 'Ingresos', value: $(d.revenue) },
    { label: 'Órdenes', value: String(d.orders), sub: `${d.gifts} regalos` },
    { label: 'Ticket Promedio', value: $(d.avgOrder) },
    { label: 'Margen Bruto Est.', value: pct(d.grossMargin) },
  ]));

  const s2 = section('META MENSUAL', '🎯', `
    <tr style="background:#FBF6F1;">
      <td colspan="4" style="padding:16px 14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
          <span style="font-family:Arial,sans-serif;font-size:12px;color:#3D2B1F;">Progreso: <strong>${$(d.monthActual)}</strong> de <strong>${$(d.monthTarget)}</strong></span>
          <span style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${barColor};">${pct(progressPct)}</span>
        </div>
        <div style="background:#EDE5DA;border-radius:100px;height:10px;overflow:hidden;">
          <div style="width:${progressPct.toFixed(1)}%;background:${barColor};height:10px;border-radius:100px;"></div>
        </div>
      </td>
    </tr>
    <tr style="background:#FFFFFF;">
      <td colspan="4" style="font-family:Arial,sans-serif;font-size:11px;color:#9c8070;padding:8px 14px;">
        Datos: acumulado del mes en curso al momento del informe.
      </td>
    </tr>
  `);

  const s3 = section('COSTOS Y RENTABILIDAD', '💰', kpiRow([
    { label: 'Ingresos Totales', value: $(d.revenue) },
    { label: '% Costo Est.', value: pct(d.costPct) },
    { label: 'Costo Estimado', value: $(d.revenue * d.costPct / 100) },
    { label: 'Ganancia Bruta Est.', value: $(d.revenue * d.grossMargin / 100) },
  ]));

  const s4 = section('TOP EMPLEADOS', '🏆', d.topSellers.length === 0
    ? `<tr><td style="padding:12px;font-family:Arial,sans-serif;font-size:12px;color:#9c8070;">Sin datos en este período.</td></tr>`
    : `
      <tr style="background:#F5EDE4;">
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;">Empleado</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Órdenes</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Ingresos</th>
      </tr>
      ${tableRows(d.topSellers.map(s => [s.name, String(s.orders), $(s.revenue)]))}
    `);

  const s5 = section('TOP PRODUCTOS', '🛒', d.topProducts.length === 0
    ? `<tr><td style="padding:12px;font-family:Arial,sans-serif;font-size:12px;color:#9c8070;">Sin datos en este período.</td></tr>`
    : `
      <tr style="background:#F5EDE4;">
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;">Producto</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Unidades</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Ingresos</th>
      </tr>
      ${tableRows(d.topProducts.map(p => [p.title, String(p.units), $(p.revenue)]))}
    `);

  const s6 = section('TOP CLIENTES', '👥', d.topClients.length === 0
    ? `<tr><td style="padding:12px;font-family:Arial,sans-serif;font-size:12px;color:#9c8070;">Sin datos en este período.</td></tr>`
    : `
      <tr style="background:#F5EDE4;">
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;">Cliente</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Órdenes</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Total Gastado</th>
      </tr>
      ${tableRows(d.topClients.map(c => [c.name, String(c.orders), $(c.spent)]))}
    `);

  const s7 = section('TOP CATEGORÍAS', '📦', d.topCategories.length === 0
    ? `<tr><td style="padding:12px;font-family:Arial,sans-serif;font-size:12px;color:#9c8070;">Sin datos en este período.</td></tr>`
    : `
      <tr style="background:#F5EDE4;">
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;">Categoría</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Unidades</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Ingresos</th>
      </tr>
      ${tableRows(d.topCategories.map(c => [c.category, String(c.units), $(c.revenue)]))}
    `);

  const s8 = section('INVENTARIO (ACTUAL)', '🗂️', kpiRow([
    { label: 'Total SKUs', value: String(d.stock.total) },
    { label: 'En Stock', value: String(d.stock.inStock) },
    { label: 'Stock Bajo', value: String(d.stock.low) },
    { label: 'Agotados', value: String(d.stock.outOfStock) },
  ]));

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5efe5;font-family:Arial,sans-serif;">
<div style="max-width:660px;margin:0 auto;padding:24px 16px;">

  <!-- Header -->
  <div style="background:#1e1611;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
    <img src="https://makaystore-sandy.vercel.app/images/makay-logo.png" alt="Makay" width="160" style="height:auto;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
    <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin:0 0 6px;">INFORME ${range.periodLabel} DE VENTAS</p>
    <p style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFFFFF;margin:0 0 4px;">MAKAY <span style="color:#D4A574;">BEACH CLUB</span></p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);margin:0;">${range.label}</p>
  </div>

  <!-- Body -->
  <div style="background:#FFFFFF;padding:28px 28px 8px;border:1px solid #EDE5DA;border-top:none;">
    ${s1}
    ${s2}
    ${s3}
    ${s4}
    ${s5}
    ${s6}
    ${s7}
    ${s8}
  </div>

  <!-- Footer -->
  <div style="background:#F5EDE4;border-radius:0 0 12px 12px;padding:16px 28px;border:1px solid #EDE5DA;border-top:none;text-align:center;">
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#9c8070;margin:0;">
      Generado automáticamente · Makay Beach Club &middot; <a href="https://makay.club" style="color:#D4A574;text-decoration:none;">makay.club</a>
    </p>
    <p style="font-family:Arial,sans-serif;font-size:10px;color:#b0a090;margin:4px 0 0;">
      Por favor no responder a este correo. Para soporte: <a href="mailto:ap.bymakay@gmail.com" style="color:#D4A574;text-decoration:none;">ap.bymakay@gmail.com</a>
    </p>
  </div>

</div>
</body></html>`;
}

function getTransport() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

const SUBJECT: Record<ReportPeriod, string> = {
  daily:   'Informe Diario — Makay Beach Club',
  weekly:  'Informe Semanal — Makay Beach Club',
  monthly: 'Informe Mensual — Makay Beach Club',
};

export async function sendReport(period: ReportPeriod): Promise<{ ok: boolean; period: string; range: string }> {
  const range = getReportRange(period, new Date());
  const data  = await collectData(range, period);
  const html  = buildHtml(data);
  const to    = process.env.REPORT_EMAIL ?? process.env.GMAIL_USER ?? '';

  await getTransport().sendMail({
    from: `Makay Reportes <${process.env.GMAIL_USER}>`,
    to,
    subject: `${SUBJECT[period]} · ${range.label}`,
    html,
  });

  return { ok: true, period, range: range.label };
}
