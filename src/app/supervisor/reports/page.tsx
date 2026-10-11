'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { FileBarChart2, CreditCard, Smartphone, PocketKnife, Banknote, AlertTriangle, CheckCircle, XCircle, Search } from 'lucide-react';

type DateRange = '7d' | '30d' | '3m' | 'all';

interface OrderItem { title: string; quantity?: number; qty?: number; price: number; }
interface PaymentEntry { method: string; amount: number; }
interface SaleRow {
  id: string; sellerName: string; clientName: string;
  items: OrderItem[]; subtotal: number; paymentMethods: PaymentEntry[]; createdAt: string;
}
interface CatalogProduct { id: string; title: string; sku: string; price: number; }
interface ReportData {
  orders: SaleRow[];
  products: CatalogProduct[];
  monthlyTarget: number;
  monthlyActual: number;
  costPercent: number;
}
interface StockProduct {
  id: string; title: string; sku: string; qty: number; unitsSold: number; status: 'out' | 'low' | 'ok';
}
interface StockData {
  products: StockProduct[];
  summary: { total: number; out: number; low: number; ok: number };
}
type GoalPeriod = 'daily' | 'weekly' | 'monthly';
interface GoalBucket { target: number; actual: number; progress: number; }
interface GoalsData { daily: GoalBucket; weekly: GoalBucket; monthly: GoalBucket; }
const GOAL_LABELS: Record<GoalPeriod, string> = { daily: 'Meta diaria', weekly: 'Meta semanal', monthly: 'Meta mensual' };

const DATE_LABELS: Record<DateRange, string> = { '7d': '7 días', '30d': '30 días', '3m': '3 meses', 'all': 'Todo' };
const METHOD_ICON: Record<string, React.ComponentType<{ size?: number }>> = {
  stripe: CreditCard, pago_movil: Smartphone, punto_venta: PocketKnife, cash: Banknote,
};
const METHOD_LABEL: Record<string, string> = {
  stripe: 'Tarjeta', pago_movil: 'Pago Móvil', punto_venta: 'P.d.V.', cash: 'Efectivo', card: 'Tarjeta', cash_usd: 'Efectivo USD', transfer: 'Transferencia',
};
const fmt = (n: number) => `$${Number(n).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
type ReportTab = 'ventas' | 'costo' | 'metas' | 'inventario';

export default function SupervisorReportsPage() {
  const [tab, setTab]             = useState<ReportTab>('ventas');
  const [range, setRange]         = useState<DateRange>('30d');
  const [data, setData]           = useState<ReportData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Cost/Margin state
  const [globalCostPct, setGlobalCostPct]       = useState<number | null>(null);
  const [productCostPcts, setProductCostPcts]   = useState<Record<string, number>>({});
  const [costSearch, setCostSearch]             = useState('');

  // Goal editing state — generalized across daily/weekly/monthly
  const [goals, setGoals]                 = useState<GoalsData | null>(null);
  const [goalsLoading, setGoalsLoading]   = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<GoalPeriod | null>(null);
  const [targetInput, setTargetInput]     = useState('');
  const [savingTarget, setSavingTarget]   = useState(false);

  // Inventory state
  const [stockData, setStockData]       = useState<StockData | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockFilter, setStockFilter]   = useState<'all' | 'out' | 'low' | 'ok'>('all');
  const [stockSearch, setStockSearch]   = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setFetchError('');
    fetch(`/api/supervisor/report?range=${range}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { setFetchError(d?.error ?? 'Error cargando datos'); setData(null); }
        else { setData(d as ReportData); setGlobalCostPct(null); }
        setLoading(false);
      })
      .catch(e => { setFetchError(e?.message ?? 'Error de conexión'); setLoading(false); });
  }, [range]);

  const loadGoals = useCallback(() => {
    setGoalsLoading(true);
    fetch('/api/admin/reports/goals')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setGoals({ daily: d.daily, weekly: d.weekly, monthly: d.monthly }); setGoalsLoading(false); })
      .catch(() => setGoalsLoading(false));
  }, []);

  const loadStock = useCallback(() => {
    setStockLoading(true);
    fetch(`/api/supervisor/stock?range=${range}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStockData(d); setStockLoading(false); })
      .catch(() => setStockLoading(false));
  }, [range]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (tab === 'metas') loadGoals(); }, [tab, loadGoals]);
  useEffect(() => { if (tab === 'inventario') loadStock(); }, [tab, loadStock]);

  const defaultCostPct = globalCostPct ?? data?.costPercent ?? 40;

  // Sales aggregations
  const soldMap = useMemo(() => {
    const m: Record<string, { units: number; revenue: number }> = {};
    for (const o of data?.orders ?? []) {
      for (const it of o.items) {
        const q = it.quantity ?? it.qty ?? 1;
        if (!m[it.title]) m[it.title] = { units: 0, revenue: 0 };
        m[it.title].units   += q;
        m[it.title].revenue += Number(it.price) * q;
      }
    }
    return m;
  }, [data?.orders]);

  // All products merged with sales — sorted by revenue desc then name
  const allProductRows = useMemo(() => {
    const catalog = data?.products ?? [];
    return catalog.map(p => {
      const sales = soldMap[p.title] ?? { units: 0, revenue: 0 };
      const costPct = productCostPcts[p.id] ?? defaultCostPct;
      const cost    = sales.revenue * (costPct / 100);
      return { ...p, units: sales.units, revenue: sales.revenue, costPct, cost, profit: sales.revenue - cost };
    }).sort((a, b) => b.revenue - a.revenue || a.title.localeCompare(b.title));
  }, [data?.products, soldMap, productCostPcts, defaultCostPct]);

  const filteredCostRows = useMemo(() =>
    allProductRows.filter(p => p.title.toLowerCase().includes(costSearch.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(costSearch.toLowerCase())),
    [allProductRows, costSearch]
  );

  const totalRevenue  = data?.orders.reduce((s, o) => s + o.subtotal, 0) ?? 0;
  const totalCost     = allProductRows.reduce((s, p) => s + p.cost, 0);
  const grossProfit   = totalRevenue - totalCost;
  const avgOrder      = data?.orders.length ? totalRevenue / data.orders.length : 0;
  const overallMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : (100 - defaultCostPct);

  const now         = new Date();
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

  const card = (label: string, value: string, accent?: string) => (
    <div key={label} style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 12, padding: '1rem 1.25rem', ...(accent ? { borderLeft: `4px solid ${accent}` } : {}) }}>
      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: '0 0 0.25rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--makay-dark-navy)', margin: 0 }}>{value}</p>
    </div>
  );

  const searchBox = (value: string, onChange: (v: string) => void, placeholder: string) => (
    <div style={{ position: 'relative', marginBottom: '1rem' }}>
      <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--makay-mauve)' }} />
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2.25rem', paddingRight: '0.875rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 10, fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', outline: 'none', background: '#fff' }}
      />
    </div>
  );

  return (
    <div className="sup-page">
      {/* Header */}
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

      {/* Tabs */}
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
      {!loading && fetchError && <p className="sup-empty-state" style={{ color: '#ef4444' }}>{fetchError}</p>}

      {/* ── VENTAS ── */}
      {!loading && !fetchError && tab === 'ventas' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {card('Ingresos', fmt(totalRevenue))}
            {card('Pedidos', String(data?.orders.length ?? 0))}
            {card('Promedio / Pedido', fmt(avgOrder))}
          </div>
          {!data?.orders.length ? (
            <p className="sup-empty-state">No hay ventas en este período.</p>
          ) : (
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead>
                  <tr><th>Fecha</th><th>Vendedor</th><th>Cliente</th><th>Productos</th><th>Método</th><th style={{ textAlign: 'right' }}>Total</th></tr>
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
                            {it.title} × {it.quantity ?? it.qty ?? 1}
                            <span style={{ color: 'var(--makay-peachy-rose)', marginLeft: '0.3rem' }}>{fmt(Number(it.price) * (it.quantity ?? it.qty ?? 1))}</span>
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
      {!loading && !fetchError && tab === 'costo' && (
        <div>
          {/* Global cost % */}
          <div style={{ background: '#fffbf0', border: '1px solid #f59e0b30', borderRadius: 12, padding: '0.875rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--makay-dark-navy)', whiteSpace: 'nowrap' }}>% Costo global (default):</label>
            <input
              type="number" min={0} max={100}
              value={globalCostPct ?? data?.costPercent ?? 40}
              onChange={e => setGlobalCostPct(Number(e.target.value))}
              style={{ width: 64, padding: '0.3rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', textAlign: 'center' }}
            />
            <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)' }}>
              Margen global: <strong>{overallMargin.toFixed(1)}%</strong>
            </span>
            <button
              onClick={() => setProductCostPcts({})}
              style={{ marginLeft: 'auto', fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--makay-mauve)', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.25rem 0.6rem', cursor: 'pointer' }}
            >
              Restablecer individuales
            </button>
          </div>

          {/* Summary KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {card('Ingresos', fmt(totalRevenue), '#10b981')}
            {card('Costo total', fmt(totalCost), '#f59e0b')}
            {card('Ganancia bruta', fmt(grossProfit), 'var(--makay-peachy-rose)')}
            {card('Margen efectivo', `${overallMargin.toFixed(1)}%`, '#8b5cf6')}
          </div>

          {/* Search */}
          {searchBox(costSearch, setCostSearch, 'Buscar producto o SKU…')}

          {/* Product table */}
          {!filteredCostRows.length ? (
            <p className="sup-empty-state">Sin resultados.</p>
          ) : (
            <div className="sup-table-wrap">
              <table className="sup-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th style={{ textAlign: 'right' }}>Precio venta</th>
                    <th style={{ textAlign: 'right' }}>Uds. vendidas</th>
                    <th style={{ textAlign: 'right' }}>Ingresos</th>
                    <th style={{ textAlign: 'center', width: 90 }}>Costo %</th>
                    <th style={{ textAlign: 'right' }}>Costo $</th>
                    <th style={{ textAlign: 'right' }}>Ganancia</th>
                    <th style={{ textAlign: 'right' }}>Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCostRows.map(p => {
                    const overridden = productCostPcts[p.id] !== undefined;
                    const unitCost = p.price * (p.costPct / 100);
                    return (
                      <tr key={p.id} style={{ opacity: p.revenue === 0 ? 0.65 : 1 }}>
                        <td style={{ fontWeight: 600, color: 'var(--makay-dark-navy)' }}>{p.title}</td>
                        <td style={{ color: 'var(--makay-mauve)', fontSize: '0.75rem', fontFamily: 'monospace' }}>{p.sku ?? '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, color: 'var(--makay-dark-navy)', fontSize: '0.82rem' }}>{fmt(p.price)}</div>
                          <div style={{ fontSize: '0.7rem', color: '#f59e0b' }}>costo: {fmt(unitCost)}</div>
                        </td>
                        <td style={{ textAlign: 'right', color: p.units > 0 ? 'var(--makay-dark-navy)' : '#d1d5db' }}>{p.units}</td>
                        <td style={{ textAlign: 'right', fontWeight: p.revenue > 0 ? 600 : 400, color: p.revenue > 0 ? 'var(--makay-dark-navy)' : '#d1d5db' }}>{fmt(p.revenue)}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min={0} max={100}
                            value={p.costPct}
                            onChange={e => setProductCostPcts(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                            style={{
                              width: 64, padding: '0.2rem 0.4rem', textAlign: 'center',
                              border: `1px solid ${overridden ? 'var(--makay-peachy-rose)' : '#e5e7eb'}`,
                              borderRadius: 6, fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem',
                              background: overridden ? '#fff8f6' : '#fff',
                            }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', color: '#f59e0b' }}>{p.revenue > 0 ? fmt(p.cost) : '—'}</td>
                        <td style={{ textAlign: 'right', color: p.profit > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                          {p.revenue > 0 ? fmt(p.profit) : '—'}
                        </td>
                        <td style={{ textAlign: 'right', color: '#8b5cf6' }}>
                          {p.revenue > 0 ? `${(100 - p.costPct).toFixed(1)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #f0ebe4', fontWeight: 700 }}>
                    <td colSpan={3}>Total</td>
                    <td style={{ textAlign: 'right' }}>{allProductRows.reduce((s, p) => s + p.units, 0)}</td>
                    <td style={{ textAlign: 'right' }}>{fmt(totalRevenue)}</td>
                    <td />
                    <td style={{ textAlign: 'right', color: '#f59e0b' }}>{fmt(totalCost)}</td>
                    <td style={{ textAlign: 'right', color: '#10b981' }}>{fmt(grossProfit)}</td>
                    <td style={{ textAlign: 'right', color: '#8b5cf6' }}>{overallMargin.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── METAS ── */}
      {!loading && !fetchError && tab === 'metas' && (
        <div>
          {goalsLoading && !goals && <p className="sup-loading">Cargando metas…</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '0.875rem', marginBottom: '1.25rem' }}>
            {(['daily', 'weekly', 'monthly'] as GoalPeriod[]).map(period => {
              const bucket = goals?.[period];
              const pct = bucket ? Math.min(100, bucket.progress) : 0;
              const isEditing = editingPeriod === period;
              return (
                <div key={period} style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 16, padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: 0 }}>{GOAL_LABELS[period]}</p>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <input
                          type="number" min={0} step={0.01} value={targetInput}
                          onChange={e => setTargetInput(e.target.value)}
                          style={{ width: 90, padding: '0.2rem 0.4rem', border: '1px solid var(--makay-peachy-rose)', borderRadius: 6, fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', textAlign: 'right' }}
                          autoFocus
                        />
                        <button
                          disabled={savingTarget}
                          onClick={async () => {
                            setSavingTarget(true);
                            const res = await fetch('/api/admin/reports/goals', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ target: Number(targetInput), period }),
                            });
                            if (res.ok) { loadGoals(); setEditingPeriod(null); }
                            setSavingTarget(false);
                          }}
                          style={{ padding: '0.2rem 0.55rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-montserrat)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                        >
                          {savingTarget ? '…' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingPeriod(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--makay-mauve)', fontSize: '0.7rem', fontFamily: 'var(--font-montserrat)' }}>✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setTargetInput(String(bucket?.target ?? 0)); setEditingPeriod(period); }}
                        style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 600, color: 'var(--makay-mauve)', background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.15rem 0.5rem', cursor: 'pointer' }}
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--makay-dark-navy)', margin: '0 0 0.5rem' }}>
                    {fmt(bucket?.actual ?? 0)} / {fmt(bucket?.target ?? 0)}
                  </p>
                  <div style={{ height: 12, background: '#f5f0ea', borderRadius: 100, overflow: 'hidden', marginBottom: '0.4rem' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? '#10b981' : 'var(--makay-peachy-rose)', borderRadius: 100, transition: 'width .4s' }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: 0 }}>{(bucket?.progress ?? 0).toFixed(1)}% completado</p>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {card('Días transcurridos', `${daysPassed}/${daysInMonth}`)}
            {card('Tasa diaria', fmt(dailyRate))}
            {card('Proyección mes', fmt(projected))}
            {card('Faltan', fmt(Math.max(0, (data?.monthlyTarget ?? 0) - (data?.monthlyActual ?? 0))))}
          </div>

          {(() => {
            const sellers: Record<string, number> = {};
            for (const o of data?.orders ?? []) sellers[o.sellerName] = (sellers[o.sellerName] ?? 0) + o.subtotal;
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
      {tab === 'inventario' && (
        <div>
          {stockLoading && <p className="sup-loading">Cargando inventario…</p>}
          {!stockLoading && stockData && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Total productos', value: String(stockData.summary.total), accent: 'var(--makay-dark-navy)', icon: null },
                  { label: 'Sin stock',       value: String(stockData.summary.out),   accent: '#ef4444', icon: <XCircle size={15} color="#ef4444" /> },
                  { label: 'Stock bajo',      value: String(stockData.summary.low),   accent: '#f59e0b', icon: <AlertTriangle size={15} color="#f59e0b" /> },
                  { label: 'Bien surtidos',   value: String(stockData.summary.ok),    accent: '#10b981', icon: <CheckCircle size={15} color="#10b981" /> },
                ].map(k => (
                  <div key={k.label} style={{ background: '#fff', border: '1px solid #f0ebe4', borderRadius: 12, padding: '0.875rem 1.1rem', borderLeft: `4px solid ${k.accent}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      {k.icon}
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--makay-mauve)', margin: 0 }}>{k.label}</p>
                    </div>
                    <p style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.35rem', fontWeight: 700, color: k.accent, margin: 0 }}>{k.value}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--makay-mauve)' }} />
                  <input
                    value={stockSearch} onChange={e => setStockSearch(e.target.value)}
                    placeholder="Buscar producto o SKU…"
                    style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '2.25rem', paddingRight: '0.875rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 10, fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', outline: 'none', background: '#fff' }}
                  />
                </div>
                {(['all', 'out', 'low', 'ok'] as const).map(val => {
                  const labels = { all: 'Todos', out: 'Sin stock', low: 'Stock bajo', ok: 'Bien surtidos' };
                  return (
                    <button key={val} onClick={() => setStockFilter(val)} style={{
                      padding: '0.3rem 0.75rem', borderRadius: 100, fontSize: '0.73rem',
                      fontFamily: 'var(--font-montserrat)', fontWeight: 600, cursor: 'pointer',
                      border: '1px solid', transition: 'all .15s',
                      borderColor: stockFilter === val ? 'var(--makay-dark-navy)' : '#e5e7eb',
                      background: stockFilter === val ? 'var(--makay-dark-navy)' : '#fff',
                      color: stockFilter === val ? '#fff' : 'var(--makay-mauve)',
                    }}>{labels[val]}</button>
                  );
                })}
              </div>

              {(() => {
                const filtered = stockData.products
                  .filter(p => stockFilter === 'all' || p.status === stockFilter)
                  .filter(p => p.title.toLowerCase().includes(stockSearch.toLowerCase()) || (p.sku ?? '').toLowerCase().includes(stockSearch.toLowerCase()));
                if (!filtered.length) return <p className="sup-empty-state">Sin resultados.</p>;
                return (
                  <div className="sup-table-wrap">
                    <table className="sup-table">
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>SKU</th>
                          <th style={{ textAlign: 'right' }}>Stock actual</th>
                          <th style={{ textAlign: 'right' }}>Vendidos ({range === 'all' ? 'siempre' : range === '3m' ? '3 meses' : range})</th>
                          <th style={{ textAlign: 'center' }}>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(p => (
                          <tr key={p.id}>
                            <td style={{ fontWeight: 600, color: 'var(--makay-dark-navy)' }}>{p.title}</td>
                            <td style={{ color: 'var(--makay-mauve)', fontSize: '0.78rem', fontFamily: 'monospace' }}>{p.sku}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem', color: p.qty === 0 ? '#ef4444' : p.qty < 10 ? '#f59e0b' : '#10b981' }}>{p.qty}</td>
                            <td style={{ textAlign: 'right', color: 'var(--makay-mauve)' }}>{p.unitsSold > 0 ? `−${p.unitsSold}` : '0'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {p.status === 'out' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fef2f2', color: '#ef4444', borderRadius: 100, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-montserrat)' }}><XCircle size={11} />Sin stock</span>}
                              {p.status === 'low' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#fffbeb', color: '#d97706', borderRadius: 100, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-montserrat)' }}><AlertTriangle size={11} />Stock bajo</span>}
                              {p.status === 'ok'  && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#f0fdf4', color: '#15803d', borderRadius: 100, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-montserrat)' }}><CheckCircle size={11} />OK</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </>
          )}
          {!stockLoading && !stockData && <p className="sup-empty-state">No se pudo cargar el inventario.</p>}
        </div>
      )}
    </div>
  );
}
