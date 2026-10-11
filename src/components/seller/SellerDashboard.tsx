'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Package, Boxes, TrendingUp, HelpCircle, Clock, BadgeDollarSign, ClipboardList, CheckCircle2, Circle, Target, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';

interface SellerTask {
  id: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  created_at: string;
}

interface Order { id: number; client_name: string; subtotal: string; created_at: string; status: string; items: any[] }
interface LowStockItem { id: number; title: string; quantity: number }

export default function SellerDashboard({ recentOrders, commissionPct, lowStock }: {
  recentOrders: Order[];
  commissionPct: number;
  lowStock: LowStockItem[];
}) {
  const t = useTranslations('seller');
  const totalRevenue = recentOrders.reduce((s, o) => s + Number(o.subtotal), 0);
  const commissionEarned = totalRevenue * (commissionPct / 100);
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('seller-dashboard-tour');

  const [tasks, setTasks]           = useState<SellerTask[]>([]);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [monthlyGoal, setMonthlyGoal] = useState<{ target: number; actual: number; progress: number } | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/seller/tasks')
      .then(r => r.ok ? r.json() : [])
      .then((data: SellerTask[]) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch('/api/admin/reports/goals')
      .then(r => r.ok ? r.json() : null)
      .then((data) => { if (data?.target != null) setMonthlyGoal({ target: data.target, actual: data.actual, progress: data.progress }); })
      .catch(() => {});
  }, []);

  const toggleTask = async (task: SellerTask) => {
    const next = task.status === 'done' ? 'pending' : 'done';
    setTogglingId(task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: next } : t));
    await fetch('/api/seller/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: next }),
    }).catch(() => {});
    setTogglingId(null);
  };

  const PRIORITY_COLOR: Record<string, string> = {
    high: '#ef4444', medium: '#f59e0b', low: '#10b981',
  };

  useEffect(() => {
    if (!tutorialStore.isCompleted('seller-dashboard-tour') && !tutorialStore.currentTutorial) {
      tutorialStore.showTutorial('seller-dashboard-tour');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="seller-page wide">
      {tutorialUI}
      <div className="seller-page-header">
        <div>
          <h1 className="seller-page-title">{t('dashboard')}</h1>
          <p className="seller-page-sub">{t('welcome')}</p>
        </div>
        <button className="help-button seller-btn-ghost" onClick={() => tutorialStore.showTutorial('seller-dashboard-tour')} aria-label={t('showTutorial')}>
          <HelpCircle size={16} />
        </button>
      </div>

      <div className="seller-stats-grid">
        <div className="seller-stat-card">
          <TrendingUp size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">${totalRevenue.toFixed(2)}</span>
          <span className="seller-stat-label">{t('revenue')}</span>
        </div>
        <div className="seller-stat-card">
          <BadgeDollarSign size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">${commissionEarned.toFixed(2)}</span>
          <span className="seller-stat-label">Comisión de Venta</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--makay-mauve)', marginTop: '2px', opacity: 0.75 }}>
            {commissionPct > 0 ? `${commissionPct}% de comisión` : 'Sin comisión configurada'}
          </span>
        </div>
        <div className="seller-stat-card">
          <ShoppingBag size={22} className="seller-stat-icon" />
          <span className="seller-stat-value">{recentOrders.length}</span>
          <span className="seller-stat-label">{t('recentOrders')}</span>
        </div>
        <div className="seller-stat-card">
          <Boxes size={22} className="seller-stat-icon" style={{ color: lowStock.length > 0 ? '#c0392b' : 'var(--makay-peachy-rose)' }} />
          <span className="seller-stat-value">{lowStock.length}</span>
          <span className="seller-stat-label">Productos con stock bajo</span>
        </div>
      </div>

      <div className="seller-dash-stack">
          {monthlyGoal && (
            <div className="seller-widget">
              <h2 className="seller-widget-title">
                <Target size={18} style={{ color: 'var(--makay-peachy-rose)' }} />
                Meta mensual de ventas
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--makay-mauve)' }}>Ventas del mes: <strong style={{ color: 'var(--makay-dark-navy)' }}>${monthlyGoal.actual.toLocaleString('es', { maximumFractionDigits: 0 })}</strong></span>
                <span style={{ color: 'var(--makay-mauve)' }}>Meta: <strong style={{ color: 'var(--makay-dark-navy)' }}>${monthlyGoal.target.toLocaleString('es', { maximumFractionDigits: 0 })}</strong></span>
              </div>
              <div style={{ height: 10, background: '#f0ebe4', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, monthlyGoal.progress)}%`, background: monthlyGoal.progress >= 100 ? '#10b981' : monthlyGoal.progress >= 60 ? 'var(--makay-peachy-rose)' : 'var(--makay-ocean-teal)', borderRadius: 100, transition: 'width 0.4s ease' }} />
              </div>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', marginTop: '0.35rem', textAlign: 'right' }}>
                {monthlyGoal.progress.toFixed(1)}% alcanzado
              </p>
            </div>
          )}

          {recentOrders.length > 0 ? (
            <div className="seller-widget">
              <h2 className="seller-widget-title">{t('recentSales')}</h2>
              <div className="seller-orders-list">
                {recentOrders.map(o => {
                  const parsedItems: { title?: string; price?: number; qty?: number; quantity?: number }[] = (() => {
                    try { return Array.isArray(o.items) ? o.items : JSON.parse(o.items as any); }
                    catch { return []; }
                  })();
                  const isExpanded = expandedOrderId === o.id;
                  return (
                    <div key={o.id} style={{ borderBottom: '1px solid var(--makay-sand-cream)' }}>
                      <div
                        className="seller-order-row"
                        style={{ cursor: parsedItems.length > 0 ? 'pointer' : 'default', userSelect: 'none' }}
                        onClick={() => parsedItems.length > 0 && setExpandedOrderId(isExpanded ? null : o.id)}
                      >
                        <div className="seller-order-client">
                          <span className="seller-order-name">{o.client_name || 'Client'}</span>
                          <span className="seller-order-items">{parsedItems.length} {t('items')}</span>
                        </div>
                        <div className="seller-order-meta" style={{ alignItems: 'center' }}>
                          <span className="seller-order-amount">${Number(o.subtotal).toFixed(2)}</span>
                          <span className="seller-order-date">{new Date(o.created_at).toLocaleDateString()}</span>
                          {parsedItems.length > 0 && (
                            isExpanded ? <ChevronUp size={14} color="var(--makay-mauve)" /> : <ChevronDown size={14} color="var(--makay-mauve)" />
                          )}
                        </div>
                      </div>
                      {isExpanded && parsedItems.length > 0 && (
                        <div style={{ padding: '0.4rem 0.75rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {parsedItems.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)' }}>
                              <span>{item.title ?? 'Artículo'} ×{item.quantity ?? item.qty ?? 1}</span>
                              {item.price != null && (
                                <span style={{ fontWeight: 600, color: 'var(--makay-dark-navy)' }}>${(Number(item.price) * (item.quantity ?? item.qty ?? 1)).toFixed(2)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="seller-empty">{t('noSales')}</p>
          )}

        {/* ── Below Recent Sales: three widgets side by side ── */}
        <div className="seller-dash-row">
          <div className="seller-widget">
            <h2 className="seller-widget-title">{t('quickActions')}</h2>
            <div className="seller-action-list">
              <Link href="/seller/sell" className="seller-action-row primary">
                <span className="seller-action-row-icon"><ShoppingBag size={16} /></span>
                <span className="seller-action-row-label">{t('sellToClient')}</span>
              </Link>
              <Link href="/seller/products" className="seller-action-row">
                <span className="seller-action-row-icon"><Package size={16} /></span>
                <span className="seller-action-row-label">{t('manageProducts')}</span>
              </Link>
              <Link href="/seller/stock" className="seller-action-row">
                <span className="seller-action-row-icon"><Boxes size={16} /></span>
                <span className="seller-action-row-label">{t('updateStock')}</span>
              </Link>
              <Link href="/seller/activity" className="seller-action-row">
                <span className="seller-action-row-icon"><Clock size={16} /></span>
                <span className="seller-action-row-label">{t('myActivity')}</span>
              </Link>
            </div>
          </div>

          <div className="seller-widget">
            <h2 className="seller-widget-title">
              <ClipboardList size={18} style={{ color: 'var(--makay-peachy-rose)' }} />
              Tareas asignadas
              {tasks.length > 0 && (
                <span className="seller-widget-count">
                  {tasks.filter(t => t.status !== 'done').length} pendiente{tasks.filter(t => t.status !== 'done').length !== 1 ? 's' : ''}
                </span>
              )}
            </h2>
            {tasks.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: 0 }}>Sin tareas asignadas por ahora.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tasks.map(task => (
                  <div
                    key={task.id}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.8rem', background: task.status === 'done' ? '#f9f9f9' : '#fff', border: '1px solid #f0ebe4', borderRadius: 10, opacity: task.status === 'done' ? 0.6 : 1, transition: 'opacity 0.2s' }}
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      disabled={togglingId === task.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, color: task.status === 'done' ? '#10b981' : '#d1c4b8', display: 'flex' }}
                      aria-label={task.status === 'done' ? 'Marcar pendiente' : 'Marcar hecho'}
                    >
                      {task.status === 'done'
                        ? <CheckCircle2 size={18} color="#10b981" />
                        : <Circle size={18} />}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 600, fontSize: '0.78rem', color: 'var(--makay-dark-navy)', margin: 0, textDecoration: task.status === 'done' ? 'line-through' : 'none' }}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', color: 'var(--makay-mauve)', margin: '0.15rem 0 0' }}>
                          {task.description}
                        </p>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.15rem 0.4rem', borderRadius: 100, background: `${PRIORITY_COLOR[task.priority] ?? '#9ca3af'}18`, color: PRIORITY_COLOR[task.priority] ?? '#9ca3af', flexShrink: 0 }}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="seller-widget">
            <h2 className="seller-widget-title">
              <AlertTriangle size={18} style={{ color: '#c0392b' }} />
              Stock bajo
              {lowStock.length > 0 && <span className="seller-widget-count">{lowStock.length}</span>}
            </h2>
            {lowStock.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-mauve)', margin: 0 }}>Todo el inventario está en buen nivel.</p>
            ) : (
              <>
                <div>
                  {lowStock.slice(0, 6).map(item => (
                    <div key={item.id} className="seller-lowstock-row">
                      <span className="seller-lowstock-name">{item.title}</span>
                      <span className={`seller-lowstock-qty ${item.quantity < 5 ? 'critical' : 'low'}`}>{item.quantity} uds.</span>
                    </div>
                  ))}
                </div>
                <Link href="/seller/stock" style={{ display: 'block', marginTop: '0.75rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--makay-peachy-rose)', textDecoration: 'none' }}>
                  Ver todo el inventario →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
