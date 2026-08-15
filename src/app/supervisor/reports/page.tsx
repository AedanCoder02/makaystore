'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileBarChart2, CreditCard, Smartphone, PocketKnife, Banknote } from 'lucide-react';

type DateRange = '7d' | '30d' | '3m' | 'all';

interface OrderItem { title: string; quantity: number; price: number; }
interface PaymentEntry { method: string; amount: number; }
interface SaleRow {
  id: string;
  sellerName: string;
  clientName: string;
  items: OrderItem[];
  subtotal: number;
  paymentMethods: PaymentEntry[];
  createdAt: string;
}
interface ReportData {
  orders: SaleRow[];
  monthlyTarget: number;
  monthlyActual: number;
  costPercent: number;
}

const DATE_LABELS: Record<DateRange, string> = {
  '7d': '7 días', '30d': '30 días', '3m': '3 meses', 'all': 'Todo',
};
const METHOD_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  stripe: CreditCard, pago_movil: Smartphone, punto_venta: PocketKnife, cash: Banknote,
};
const METHOD_LABEL: Record<string, string> = {
  stripe: 'Tarjeta', pago_movil: 'Pago Móvil', punto_venta: 'P.d.V.', cash: 'Efectivo',
};

const fmt = (n: number) => `$${Number(n).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type ReportTab = 'ventas' | 'costo' | 'metas' | 'inventario';

export default function SupervisorReportsPage() {
  const [tab, setTab]           = useState<ReportTab>('ventas');
  const [range, setRange]       = useState<DateRange>('30d');
  const [data, setData]         = useState<ReportData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [costInput, setCostInput] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/supervisor/report?range=${range}`)
      .then(r => r.ok ? r.json() : null)
      .then((d: ReportData | null) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);

  const costPct = costInput ?? data?.costPercent ?? 40;
  const totalRevenue = data?.orders.reduce((s, o) => s + o.subtotal, 0) ?? 0;
  const totalCost    = totalRevenue * (costPct / 100);
  const grossProfit  = totalRevenue - totalCost;
  const avgOrder     = data?.orders.length ? totalRevenue / data.orders.length : 0;

  // Product-level aggregation for cost tab
  const productMap: Record<string, { title: string; units: number; revenue: number }> = {};
  for (const order of data?.orders ?? []) {
    for (const item of order.items) {
      if (!productMap[item.title]) productMap[item.title] = { title: item.title, units: 0, revenue: 0 };
      productMap[item.title].units   += item.quantity;
      productMap[item.title].revenue += Number(item.price) * item.quantity;
    }
  }
  const products = Object.values(productMap).sort((a, b) => b.revenue - a.revenue);

  const monthPct = data ? Math.min(100, (data.monthlyActual / data.monthlyTarget) * 100) : 0;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed  = now.getDate();
  const dailyRate   = daysPassed > 0 && data ? data.monthlyActual / daysPassed : 0;
  const projected   = dailyRate * daysInMonth;

  const TABS: { id: ReportTab; label: string }[] = [
    { id: 'ventas',     label: 'Ventas' },
    { id: 'costo',      label: 'Costo/Margen' },
    { id: 'metas',      label: 'Metas' },
    { id: 'inventario', label: 'Inventario' },
  ];

  return (
    <div className="sup-page">
      {/* Header + date range */}
      <div className="sup-page-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileBarChart2 size={22} className="sup-page-icon" />
          <h1 className="sup-page-title">Reportes</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {(['7d', '30d', '3m', 'all'] as DateRange[]).map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '0.3rem 0.75rem', borderRadius: 8, fontSize: '0.75rem',
              fontFamily: 'var(--font-montserrat)', fontWeight: 600, cursor: 'pointer',
              border: '1px solid', transition: 'all .15s',
              borderColor: range === r ? 'var(--makay-peachy-rose)' : '#e5e7eb',
              background: range === r ? 'var(--makay-peachy-rose)' : '#fff',
              color: range === r ? '#fff' : 'var(--makay-mauve)',
            }}>{DATE_LABELS[r]}</button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '0.45rem 1rem', borderRadius: 100, fontSize: '0.78rem',
            fontFamily: 'var(--font-montserrat)', fontWeight: 600, cursor: 'pointer',
            border: '1px solid', transition: 'all .15s',
            borderColor: tab === t.id ? 'var(--makay-dark-navy)' : '#e5e7eb',
            background: tab === t.id ? 'var(--makay-dark-navy)' : '#fff',
            color: tab === t.id ? '#fff' : 'var(--makay-mauve)',
          }}>{t.label}</button>
        ))}
      </div>

      {loading && <p className="sup-loading">Cargando…</p>}

      {/* ── VENTAS ── */}
      {!loading && tab === 'ventas' && (
        <div>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Ingresos', value: fmt(totalRevenue) },
              { label: 'Pedidos', value: String(data?.orders.length ?? 0) },
              { label: 'Promedio / Pedido', value: fmt(avgOrder) },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: '0 0 0.25rem' }}>{k.label}</p>
                <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Sales table */}
          {!data?.orders.length ? (
            <p className="sup-empty-state">No hay ventas en este período.</p>
          ) : (
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Vendedor</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th>Método</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map(o => (
                    <tr key={o.id}>
                      <td className="sup-td-muted" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}{' '}
                        <span style={{ color: '#9ca3af' }}>{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--makay-dark-navy)' }}>{o.sellerName}</td>
                      <td>{o.clientName}</td>
                      <td>
                        {o.items.map((it, i) => (
                          <div key={i} style={{ fontSize: '0.78rem', color: 'var(--makay-dark-navy)', whiteSpace: 'nowrap' }}>
                            {it.title} × {it.quantity}
                            <span style={{ color: 'var(--makay-peachy-rose)', marginLeft: '0.3rem' }}>{fmt(Number(it.price) * it.quantity)}</span>
                          </div>
                        ))}
                      </td>
                      <td>
                        {o.paymentMethods.map((pm, i) => {
                          const Icon = METHOD_ICON[pm.method] ?? CreditCard;
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--makay-mauve)', whiteSpace: 'nowrap' }}>
                              <Icon size={11} />{METHOD_LABEL[pm.method] ?? pm.method}
                              {o.paymentMethods.length > 1 && <span style={{ color: 'var(--makay-peachy-rose)', fontWeight: 600 }}>{fmt(pm.amount)}</span>}
                            </div>
                          );
                        })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--makay-peachy-rose)', whiteSpace: 'nowrap' }}>{fmt(o.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── COSTO / MARGEN ── */}
      {!loading && tab === 'costo' && (
        <div>
          {/* Cost % adjuster */}
          <div style={{ background: '#fffbf0', border: '1px solid #f59e0b30', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--makay-dark-navy)' }}>% de Costo global:</label>
            <input
              type="number" min={0} max={100} value={costPct}
              onChange={e => setCostInput(Number(e.target.value))}
              style={{ width: 64, padding: '0.3rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', textAlign: 'center' }}
            />
            <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)' }}>Margen bruto: <strong>{(100 - costPct).toFixed(1)}%</strong></span>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Ingresos', value: fmt(totalRevenue), accent: '#10b981' },
              { label: 'Costo estimado', value: fmt(totalCost), accent: '#f59e0b' },
              { label: 'Ganancia bruta', value: fmt(grossProfit), accent: 'var(--makay-peachy-rose)' },
              { label: 'Margen', value: `${(100 - costPct).toFixed(1)}%`, accent: '#8b5cf6' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 12, padding: '1rem 1.25rem', borderLeft: `4px solid ${k.accent}` }}>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: '0 0 0.25rem' }}>{k.label}</p>
                <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Product breakdown table */}
          {!products.length ? (
            <p className="sup-empty-state">No hay productos en este período.</p>
          ) : (
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Unidades</th>
                    <th style={{ textAlign: 'right' }}>Ingresos</th>
                    <th style={{ textAlign: 'right' }}>Costo ({costPct}%)</th>
                    <th style={{ textAlign: 'right' }}>Ganancia</th>
                    <th style={{ textAlign: 'right' }}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => {
                    const cost   = p.revenue * (costPct / 100);
                    const profit = p.revenue - cost;
                    return (
                      <tr key={p.title}>
                        <td style={{ fontWeight: 600, color: 'var(--makay-dark-navy)' }}>{p.title}</td>
                        <td style={{ textAlign: 'right', color: 'var(--makay-mauve)' }}>{p.units}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(p.revenue)}</td>
                        <td style={{ textAlign: 'right', color: '#f59e0b' }}>{fmt(cost)}</td>
                        <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{fmt(profit)}</td>
                        <td style={{ textAlign: 'right', color: '#8b5cf6' }}>{(100 - costPct).toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #f0ebe4', fontWeight: 700 }}>
                    <td>Total</td>
                    <td style={{ textAlign: 'right' }}>{products.reduce((s, p) => s + p.units, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(totalRevenue)}</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>{fmt(totalCost)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>{fmt(grossProfit)}</td>
                    <td style={{ textAlign: 'right', color: '#8b5cf6' }}>{(100 - costPct).toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── METAS ── */}
      {!loading && tab === 'metas' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 16, padding: '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: 0 }}>Progreso mensual</p>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--makay-dark-navy)', margin: 0 }}>
                {fmt(data?.monthlyActual ?? 0)} / {fmt(data?.monthlyTarget ?? 0)}
              </p>
            </div>
            <div style={{ height: 16, background: '#f5f0ea', borderRadius: 100, overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ height: '100%', width: `${Math.min(100, monthPct)}%`, background: monthPct >= 100 ? '#10b981' : 'var(--makay-peachy-rose)', borderRadius: 100, transition: 'width .4s' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>{monthPct.toFixed(1)}% completado</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Días transcurridos', value: `${daysPassed}/${daysInMonth}` },
              { label: 'Tasa diaria', value: fmt(dailyRate) },
              { label: 'Proyección mes', value: fmt(projected) },
              { label: 'Faltan', value: fmt(Math.max(0, (data?.monthlyTarget ?? 0) - (data?.monthlyActual ?? 0))) },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 12, padding: '1rem 1.25rem' }}>
                <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: '0 0 0.25rem' }}>{k.label}</p>
                <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Top sellers toward goal */}
          {(() => {
            const sellers: Record<string, number> = {};
            for (const o of data?.orders ?? []) {
              sellers[o.sellerName] = (sellers[o.sellerName] ?? 0) + o.subtotal;
            }
            const sorted = Object.entries(sellers).sort((a, b) => b[1] - a[1]);
            if (!sorted.length) return <p className="sup-empty-state">No hay ventas este mes.</p>;
            return (
              <div className="sup-table-wrap">
                <table className="sup-table">
                  <thead><tr><th>Vendedor</th><th style={{ textAlign: 'right' }}>Ventas</th><th style={{ textAlign: 'right' }}>% de meta</th></tr></thead>
                  <tbody>
                    {sorted.map(([name, rev]) => (
                      <tr key={name}>
                        <td style={{ fontWeight: 600, color: 'var(--makay-dark-navy)' }}>{name}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--makay-peachy-rose)' }}>{fmt(rev)}</td>
                        <td style={{ textAlign: 'right', color: 'var(--makay-mauve)' }}>{data ? ((rev / data.monthlyTarget) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── INVENTARIO ── */}
      {!loading && tab === 'inventario' && (
        <div>
          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', marginBottom: '1.25rem' }}>
            Productos más vendidos en el período seleccionado.
          </p>
          {!products.length ? (
            <p className="sup-empty-state">No hay ventas en este período.</p>
          ) : (
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead><tr><th>Producto</th><th style={{ textAlign: 'right' }}>Unidades vendidas</th><th style={{ textAlign: 'right' }}>Ingresos</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.title}>
                      <td style={{ fontWeight: 600, color: 'var(--makay-dark-navy)' }}>{p.title}</td>
                      <td style={{ textAlign: 'right', color: 'var(--makay-mauve)' }}>{p.units}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--makay-peachy-rose)' }}>{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
