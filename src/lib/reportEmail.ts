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
  periodTarget: number;
  topProducts: { title: string; units: number; revenue: number }[];
  topSellers: { name: string; orders: number; revenue: number }[];
  topClients: { name: string; orders: number; spent: number }[];
  topCategories: { category: string; units: number; revenue: number }[];
  stock: { total: number; inStock: number; low: number; outOfStock: number };
  outOfStockProducts: { title: string; sku: string | null; qty: number }[];
  lowStockProducts: { title: string; sku: string | null; qty: number }[];
  costPct: number;
  grossMargin: number;
  paymentBreakdown: { method: string; amount: number; count: number }[];
  staff: { name: string; hoursWorked: number; sessions: number; orders: number; revenue: number }[];
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

  // Goal for this report's own period (daily/weekly/monthly target, set via Supervisor Reports → Metas)
  const DEFAULT_TARGETS: Record<ReportPeriod, number> = { daily: 357.14, weekly: 2500, monthly: 10000 };
  const [targetRow] = await sql`SELECT value FROM theme_settings WHERE key = ${`${period}_target`}`.catch(() => []);
  const periodTarget = targetRow ? Number(targetRow.value) : DEFAULT_TARGETS[period];

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

  // Sellers — full list (not capped, small team)
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
  `.catch(() => []);

  // Clock-in/out activity in range — used both for the staff hours summary
  await sql`
    CREATE TABLE IF NOT EXISTS activities (
      id          SERIAL PRIMARY KEY,
      seller_id   TEXT NOT NULL,
      type        TEXT NOT NULL,
      note        TEXT,
      status      TEXT DEFAULT 'pending',
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `.catch(() => {});
  const activityRaw = await sql`
    SELECT seller_id, type, created_at
    FROM activities
    WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      AND type IN ('clock-in', 'clock-out')
    ORDER BY seller_id, created_at ASC
  `.catch(() => []);

  // Pair clock-in → next clock-out per seller to compute hours worked
  const hoursMap: Record<string, { hours: number; sessions: number }> = {};
  {
    const bySeller = new Map<string, { type: string; created_at: string }[]>();
    for (const r of activityRaw as { seller_id: string; type: string; created_at: string }[]) {
      if (!bySeller.has(r.seller_id)) bySeller.set(r.seller_id, []);
      bySeller.get(r.seller_id)!.push(r);
    }
    for (const [sellerId, events] of bySeller) {
      let hours = 0, sessions = 0;
      const outs = events.filter(e => e.type === 'clock-out').map(e => new Date(e.created_at));
      for (const ci of events.filter(e => e.type === 'clock-in')) {
        sessions++;
        const ciTime = new Date(ci.created_at);
        const co = outs.find(o => o > ciTime);
        const endTime = co ?? new Date(); // still clocked in / cut off at range end
        hours += Math.max(0, (endTime.getTime() - ciTime.getTime()) / 3600000);
      }
      hoursMap[sellerId] = { hours, sessions };
    }
  }

  // Payment method breakdown (cash register reconciliation)
  const paymentBreakdownRaw = await sql`
    SELECT
      pm->>'method' AS method,
      SUM((pm->>'amount')::numeric) AS amount,
      COUNT(*) AS count
    FROM seller_orders,
    jsonb_array_elements(payment_method::jsonb) AS pm
    WHERE created_at BETWEEN ${start.toISOString()} AND ${end.toISOString()}
      AND COALESCE(is_gift, FALSE) = FALSE
    GROUP BY method
    ORDER BY amount DESC
  `.catch(() => []);

  // Resolve seller names from Clerk (used for both Top Empleados and Staff/Hours)
  const clerk = await clerkClient().catch(() => null);
  const sellerName = new Map<string, string>();
  const resolveName = async (sellerId: string) => {
    if (sellerName.has(sellerId)) return sellerName.get(sellerId)!;
    let name = sellerId.slice(-8);
    try {
      const user = clerk ? await clerk.users.getUser(sellerId) : null;
      if (user) name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.emailAddresses[0]?.emailAddress?.split('@')[0] || name;
    } catch { /* no-op */ }
    sellerName.set(sellerId, name);
    return name;
  };

  const topSellers = await Promise.all(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (topSellersRaw as any[]).map(async (r: { seller_id: string; orders: number; revenue: number }) => ({
      name: await resolveName(r.seller_id), orders: Number(r.orders), revenue: Number(r.revenue),
    }))
  );

  // Staff summary — union of everyone who sold something OR clocked in during the range
  const staffSellerIds = new Set<string>([
    ...(topSellersRaw as { seller_id: string }[]).map(r => r.seller_id),
    ...Object.keys(hoursMap),
  ]);
  const salesBySeller = new Map((topSellersRaw as { seller_id: string; orders: number; revenue: number }[]).map(r => [r.seller_id, r]));
  const staff = await Promise.all(
    Array.from(staffSellerIds).map(async (sellerId) => {
      const sales = salesBySeller.get(sellerId);
      const h = hoursMap[sellerId];
      return {
        name: await resolveName(sellerId),
        hoursWorked: h ? Math.round(h.hours * 10) / 10 : 0,
        sessions: h?.sessions ?? 0,
        orders: sales ? Number(sales.orders) : 0,
        revenue: sales ? Number(sales.revenue) : 0,
      };
    })
  );
  staff.sort((a, b) => b.revenue - a.revenue || b.hoursWorked - a.hoursWorked);

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

  // Stock snapshot (current, not date-ranged) — mirrors admin stock route logic
  const stockDetailRows = await sql`
    SELECT
      p.title,
      p.sku,
      COALESCE(ps.ps_qty, p.stock, 0)::int AS qty
    FROM products p
    LEFT JOIN (
      SELECT product_id, SUM(quantity)::int AS ps_qty
      FROM product_stock
      GROUP BY product_id
    ) ps ON ps.product_id = p.id
    WHERE p.status = 'active'
    ORDER BY qty ASC
  `.catch(() => []);

  const allActive = stockDetailRows as { title: string; sku: string | null; qty: number }[];
  const outOfStockProducts = allActive.filter(r => r.qty === 0);
  const lowStockProducts   = allActive.filter(r => r.qty > 0 && r.qty < 10).sort((a, b) => a.qty - b.qty);
  const stock = {
    total:      allActive.length,
    inStock:    allActive.filter(r => r.qty >= 10).length,
    low:        lowStockProducts.length,
    outOfStock: outOfStockProducts.length,
  };

  // Cost % from theme_settings (admin-configurable), same as admin cost route
  const costSettingRow = await sql`SELECT value FROM theme_settings WHERE key = 'cost_percentage'`.catch(() => []);
  const costPct = costSettingRow.length > 0 ? Number(costSettingRow[0].value) : 40;
  const grossMargin = 100 - costPct;

  return {
    period,
    range,
    revenue,
    orders,
    gifts,
    avgOrder,
    periodTarget,
    topProducts: topProductsRaw.map((r: any) => ({ title: r.title ?? '—', units: Number(r.units), revenue: Number(r.revenue) })),
    topSellers,
    topClients: topClientsRaw.map((r: any) => ({ name: r.name, orders: Number(r.orders), spent: Number(r.spent) })),
    topCategories: topCategoriesRaw.map((r: any) => ({ category: r.category, units: Number(r.units), revenue: Number(r.revenue) })),
    stock,
    outOfStockProducts,
    lowStockProducts,
    costPct,
    grossMargin,
    paymentBreakdown: (paymentBreakdownRaw as any[]).map(r => ({ method: r.method ?? 'otro', amount: Number(r.amount), count: Number(r.count) })),
    staff,
  };
}

const $ = (n: number) => `$${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n.toFixed(1)}%`;
const hrs = (n: number) => `${n.toFixed(1)}h`;
const METHOD_LABEL: Record<string, string> = {
  cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', credit: 'Crédito',
  pago_movil: 'Pago Móvil', punto_venta: 'P.d.V.', cash_usd: 'Efectivo USD', stripe: 'Tarjeta',
};

function tableRows(rows: string[][]): string {
  return rows.map((cols, i) => {
    const bg = i % 2 === 0 ? '#FFFFFF' : '#FBF6F1';
    return `<tr style="background:${bg};">${cols.map((c, ci) =>
      `<td style="font-family:Arial,sans-serif;font-size:12px;color:${ci === 0 ? '#3D2B1F' : '#1e1611'};padding:7px 10px;border-bottom:1px solid #EDE5DA;word-break:break-word;${ci > 0 ? 'text-align:right;font-weight:600;white-space:nowrap;' : ''}">${c}</td>`
    ).join('')}</tr>`;
  }).join('');
}

function section(title: string, icon: string, content: string): string {
  return `
    <div style="margin-bottom:28px;max-width:100%;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:0;">
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
  const progressPct = d.periodTarget > 0 ? Math.min(100, (d.revenue / d.periodTarget) * 100) : 0;
  const barColor = progressPct >= 90 ? '#22c55e' : progressPct >= 60 ? '#D4A574' : '#ef4444';
  const goalTitle = { daily: 'META DIARIA', weekly: 'META SEMANAL', monthly: 'META MENSUAL' }[d.period];
  const goalNote = { daily: 'Meta del día del informe.', weekly: 'Meta de la semana del informe.', monthly: 'Meta del mes del informe.' }[d.period];

  // Sections
  const s1 = section('RESUMEN EJECUTIVO', '📊', kpiRow([
    { label: 'Ingresos', value: $(d.revenue) },
    { label: 'Órdenes', value: String(d.orders), sub: `${d.gifts} regalos` },
    { label: 'Ticket Promedio', value: $(d.avgOrder) },
    { label: 'Margen Bruto Est.', value: pct(d.grossMargin) },
  ]));

  const s2 = section(goalTitle, '🎯', `
    <tr style="background:#FBF6F1;">
      <td colspan="99" style="padding:16px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-bottom:8px;">
          <tr>
            <td align="left" style="font-family:Arial,sans-serif;font-size:12px;color:#3D2B1F;word-break:break-word;">Progreso: <strong>${$(d.revenue)}</strong> de <strong>${$(d.periodTarget)}</strong></td>
            <td align="right" style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${barColor};white-space:nowrap;padding-left:8px;">${pct(progressPct)}</td>
          </tr>
        </table>
        <div style="background:#EDE5DA;border-radius:100px;height:10px;overflow:hidden;">
          <div style="width:${progressPct.toFixed(1)}%;background:${barColor};height:10px;border-radius:100px;"></div>
        </div>
      </td>
    </tr>
    <tr style="background:#FFFFFF;">
      <td colspan="99" style="font-family:Arial,sans-serif;font-size:11px;color:#9c8070;padding:8px 14px;">
        ${goalNote}
      </td>
    </tr>
  `);

  const s3 = section('COSTOS Y RENTABILIDAD', '💰', kpiRow([
    { label: 'Ingresos Totales', value: $(d.revenue) },
    { label: '% Costo Est.', value: pct(d.costPct) },
    { label: 'Costo Estimado', value: $(d.revenue * d.costPct / 100) },
    { label: 'Ganancia Bruta Est.', value: $(d.revenue * d.grossMargin / 100) },
  ]));

  const sPay = d.paymentBreakdown.length === 0 ? '' : section('MÉTODOS DE PAGO (CIERRE DE CAJA)', '💳', `
    <tr style="background:#F5EDE4;">
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;">Método</th>
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Transacciones</th>
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Monto</th>
    </tr>
    ${tableRows(d.paymentBreakdown.map(p => [METHOD_LABEL[p.method] ?? p.method, String(p.count), $(p.amount)]))}
  `);

  const s4 = section('PERSONAL — HORAS Y VENTAS', '🏆', d.staff.length === 0
    ? `<tr><td style="padding:12px;font-family:Arial,sans-serif;font-size:12px;color:#9c8070;">Sin datos en este período.</td></tr>`
    : `
      <tr style="background:#F5EDE4;">
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;">Empleado</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Horas</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Órdenes</th>
        <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;">Ingresos</th>
      </tr>
      ${tableRows(d.staff.map(s => [s.name, hrs(s.hoursWorked), String(s.orders), $(s.revenue)]))}
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

  const OUT_OF_STOCK_CAP = 15;
  const s9 = d.outOfStockProducts.length === 0 ? '' : section('PRODUCTOS AGOTADOS', '🔴', `
    <tr style="background:#F5EDE4;">
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;width:55%;">Producto</th>
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;width:30%;">SKU</th>
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;width:15%;">Stock</th>
    </tr>
    ${d.outOfStockProducts.slice(0, OUT_OF_STOCK_CAP).map((p, i) => {
      const bg = i % 2 === 0 ? '#FFFFFF' : '#FBF6F1';
      return `<tr style="background:${bg};">
        <td style="font-family:Arial,sans-serif;font-size:12px;color:#3D2B1F;padding:7px 10px;border-bottom:1px solid #EDE5DA;word-break:break-word;">${p.title}</td>
        <td style="font-family:Arial,sans-serif;font-size:12px;color:#9c8070;padding:7px 10px;border-bottom:1px solid #EDE5DA;word-break:break-word;">${p.sku ?? '—'}</td>
        <td style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#ef4444;padding:7px 10px;border-bottom:1px solid #EDE5DA;text-align:right;">0</td>
      </tr>`;
    }).join('')}
    ${d.outOfStockProducts.length > OUT_OF_STOCK_CAP ? `
    <tr><td colspan="99" style="font-family:Arial,sans-serif;font-size:11px;color:#9c8070;padding:8px 10px;font-style:italic;">
      +${d.outOfStockProducts.length - OUT_OF_STOCK_CAP} producto(s) más agotados — ver listado completo en el Panel de Supervisor.
    </td></tr>` : ''}
  `);

  const LOW_STOCK_CAP = 15;
  const s10 = d.lowStockProducts.length === 0 ? '' : section('STOCK BAJO (MENOS DE 10 UNIDADES)', '🟡', `
    <tr style="background:#F5EDE4;">
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;width:55%;">Producto</th>
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:left;width:30%;">SKU</th>
      <th style="font-family:Arial,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9c8070;padding:6px 10px;text-align:right;width:15%;">Unidades</th>
    </tr>
    ${d.lowStockProducts.slice(0, LOW_STOCK_CAP).map((p, i) => {
      const bg = i % 2 === 0 ? '#FFFFFF' : '#FBF6F1';
      const urgency = p.qty <= 3 ? '#ef4444' : '#f59e0b';
      return `<tr style="background:${bg};">
        <td style="font-family:Arial,sans-serif;font-size:12px;color:#3D2B1F;padding:7px 10px;border-bottom:1px solid #EDE5DA;word-break:break-word;">${p.title}</td>
        <td style="font-family:Arial,sans-serif;font-size:12px;color:#9c8070;padding:7px 10px;border-bottom:1px solid #EDE5DA;word-break:break-word;">${p.sku ?? '—'}</td>
        <td style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${urgency};padding:7px 10px;border-bottom:1px solid #EDE5DA;text-align:right;">${p.qty}</td>
      </tr>`;
    }).join('')}
    ${d.lowStockProducts.length > LOW_STOCK_CAP ? `
    <tr><td colspan="99" style="font-family:Arial,sans-serif;font-size:11px;color:#9c8070;padding:8px 10px;font-style:italic;">
      +${d.lowStockProducts.length - LOW_STOCK_CAP} producto(s) más con stock bajo — ver listado completo en el Panel de Supervisor.
    </td></tr>` : ''}
  `);

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<style>
  body, table, td { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table { border-collapse:collapse; }
  img { border:0; outline:none; -ms-interpolation-mode:bicubic; }
  @media screen and (max-width:480px) {
    .mk-container { width:100% !important; max-width:100% !important; }
    .mk-hpad { padding-left:14px !important; padding-right:14px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5efe5;font-family:Arial,sans-serif;width:100%;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#f5efe5;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="mk-container" width="660" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:660px;">

  <!-- Header -->
  <tr><td class="mk-hpad" style="background:#1e1611;border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
    <img src="https://makaystore-sandy.vercel.app/images/makay-logo.png" alt="Makay" width="160" style="height:auto;max-width:160px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;" />
    <p style="font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin:0 0 6px;">INFORME ${range.periodLabel} DE VENTAS</p>
    <p style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#FFFFFF;margin:0 0 4px;">MAKAY <span style="color:#D4A574;">BEACH CLUB</span></p>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.55);margin:0;">${range.label}</p>
  </td></tr>

  <!-- Body -->
  <tr><td class="mk-hpad" style="background:#FFFFFF;padding:28px 28px 8px;border:1px solid #EDE5DA;border-top:none;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
    <tr><td>
    ${s1}
    ${sPay}
    ${s2}
    ${s3}
    ${s4}
    ${s5}
    ${s6}
    ${s7}
    ${s8}
    ${s9}
    ${s10}
    </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td class="mk-hpad" style="background:#F5EDE4;border-radius:0 0 12px 12px;padding:16px 28px;border:1px solid #EDE5DA;border-top:none;text-align:center;">
    <p style="font-family:Arial,sans-serif;font-size:11px;color:#9c8070;margin:0;">
      Generado automáticamente · Makay Beach Club &middot; <a href="https://makay.club" style="color:#D4A574;text-decoration:none;">makay.club</a>
    </p>
    <p style="font-family:Arial,sans-serif;font-size:10px;color:#b0a090;margin:4px 0 0;">
      Por favor no responder a este correo. Para soporte: <a href="mailto:ap.bymakay@gmail.com" style="color:#D4A574;text-decoration:none;">ap.bymakay@gmail.com</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
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
