'use client';

import { useEffect, useState, useCallback } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Plus, Edit2, Trash2, Check, X, ToggleLeft, ToggleRight,
  Users, DollarSign, Play, Lock, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Employee {
  id: number;
  full_name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  start_date: string | null;
  weekly_wage: number;
  commission_pct: number;
  commission_fixed: number;
  linked_seller_id: string;
  status: string;
  notes: string;
}

interface RunItem {
  id: number;
  employee_name: string;
  department: string;
  base_pay: number;
  commission_pay: number;
  deductions: number;
  total_pay: number;
}

interface Run {
  id: number;
  period_start: string;
  period_end: string;
  status: string;
  total_amount: number;
  created_at: string;
  finalized_at: string | null;
  items: RunItem[];
}

interface SellerOption { workerId: string; name: string; email: string }

const DEPARTMENTS = [
  'Reservas', 'A&B (Alimentos y Bebidas)', 'Spa', 'Surf', 'Eventos', 'Cocina',
  'Bar', 'Membresía', 'Travel', 'Marketing', 'Puertas', 'Administración', 'Otro',
];

const EMPTY: Omit<Employee, 'id'> = {
  full_name: '', department: DEPARTMENTS[0], position: '', email: '', phone: '',
  start_date: null, weekly_wage: 0, commission_pct: 0, commission_fixed: 0,
  linked_seller_id: '', status: 'active', notes: '',
};

const fmt = (n: number) => `$${Number(n).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthly = (weekly: number) => weekly * 4;

const fieldStyle = {
  fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem',
  padding: '0.4rem 0.6rem', borderRadius: 6,
  border: '1px solid var(--makay-sand-cream)', width: '100%', boxSizing: 'border-box' as const,
};
const labelStyle = { fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', display: 'block', marginBottom: 4 };

function todayISO() { return new Date().toISOString().slice(0, 10); }
function startOfWeekISO() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export default function AdminPayrollPage() {
  const [tab, setTab] = useState<'employees' | 'runs'>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Omit<Employee, 'id'>>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const [runs, setRuns] = useState<Run[]>([]);
  const [runsLoading, setRunsLoading] = useState(true);
  const [expandedRun, setExpandedRun] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState(startOfWeekISO());
  const [periodEnd, setPeriodEnd] = useState(todayISO());
  const [generating, setGenerating] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const loadEmployees = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/payroll/employees')
      .then(r => r.ok ? r.json() : [])
      .then((d: Employee[]) => { setEmployees(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadRuns = useCallback(() => {
    setRunsLoading(true);
    fetch('/api/admin/payroll/runs')
      .then(r => r.ok ? r.json() : [])
      .then((d: Run[]) => { setRuns(Array.isArray(d) ? d : []); setRunsLoading(false); })
      .catch(() => setRunsLoading(false));
  }, []);

  useEffect(() => { loadEmployees(); loadRuns(); }, [loadEmployees, loadRuns]);
  useEffect(() => {
    fetch('/api/supervisor/sellers')
      .then(r => r.ok ? r.json() : [])
      .then((d: any[]) => setSellers(Array.isArray(d) ? d.map(s => ({ workerId: s.workerId, name: s.name, email: s.email })) : []))
      .catch(() => {});
  }, []);

  const create = async () => {
    if (!draft.full_name.trim() || !draft.department.trim()) return;
    setSaving(true);
    const res = await fetch('/api/admin/payroll/employees', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft),
    });
    if (res.ok) {
      const created: Employee = await res.json();
      setEmployees(prev => [...prev, created]);
      setDraft(EMPTY);
      setCreating(false);
      showToast('Empleado creado.');
    }
    setSaving(false);
  };

  const saveEdit = async (id: number) => {
    setSaving(true);
    const res = await fetch(`/api/admin/payroll/employees/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      const updated: Employee = await res.json();
      setEmployees(prev => prev.map(e => e.id === id ? updated : e));
      setEditId(null); setEditDraft({});
      showToast('Empleado actualizado.');
    }
    setSaving(false);
  };

  const toggleStatus = async (emp: Employee) => {
    const next = emp.status === 'active' ? 'inactive' : 'active';
    const res = await fetch(`/api/admin/payroll/employees/${emp.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      const updated: Employee = await res.json();
      setEmployees(prev => prev.map(e => e.id === emp.id ? updated : e));
    }
  };

  const remove = async (id: number) => {
    if (!confirm('¿Eliminar este empleado? Esto no borra nóminas ya generadas.')) return;
    await fetch(`/api/admin/payroll/employees/${id}`, { method: 'DELETE' });
    setEmployees(prev => prev.filter(e => e.id !== id));
    showToast('Empleado eliminado.');
  };

  const generateRun = async () => {
    setGenerating(true);
    const res = await fetch('/api/admin/payroll/runs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period_start: periodStart, period_end: periodEnd }),
    });
    if (res.ok) {
      await loadRuns();
      showToast('Nómina generada.');
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error ?? 'Error al generar nómina.');
    }
    setGenerating(false);
  };

  const finalizeRun = async (id: number) => {
    if (!confirm('¿Finalizar esta nómina? No podrá eliminarse después.')) return;
    const res = await fetch(`/api/admin/payroll/runs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'finalized' }),
    });
    if (res.ok) { await loadRuns(); showToast('Nómina finalizada.'); }
  };

  const deleteRun = async (id: number) => {
    if (!confirm('¿Eliminar esta nómina en borrador?')) return;
    const res = await fetch(`/api/admin/payroll/runs/${id}`, { method: 'DELETE' });
    if (res.ok) { setRuns(prev => prev.filter(r => r.id !== id)); showToast('Nómina eliminada.'); }
    else { const d = await res.json().catch(() => ({})); showToast(d.error ?? 'No se pudo eliminar.'); }
  };

  const activeCount = employees.filter(e => e.status === 'active').length;
  const totalWeekly = employees.filter(e => e.status === 'active').reduce((s, e) => s + Number(e.weekly_wage), 0);
  const totalMonthly = monthly(totalWeekly);

  const TABS: { id: 'employees' | 'runs'; label: string }[] = [
    { id: 'employees', label: 'Empleados' },
    { id: 'runs', label: 'Nómina' },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700 }}>Nómina</h1>
          {tab === 'employees' && (
            <button onClick={() => setCreating(true)} style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700,
              padding: '0.55rem 1.1rem', borderRadius: 9, border: 'none',
              background: 'var(--makay-dark-navy)', color: '#fff', cursor: 'pointer',
            }}>
              <Plus size={15} /> Nuevo Empleado
            </button>
          )}
        </div>

        {toast && <div className="admin-toast">{toast}</div>}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '0.45rem 1rem', borderRadius: 100, fontSize: '0.82rem',
              fontFamily: 'var(--font-montserrat)', fontWeight: 600, cursor: 'pointer',
              border: '1px solid', transition: 'all .15s',
              borderColor: tab === t.id ? 'var(--makay-dark-navy)' : '#e5e7eb',
              background: tab === t.id ? 'var(--makay-dark-navy)' : '#fff',
              color: tab === t.id ? '#fff' : 'var(--makay-mauve)',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── EMPLOYEES TAB ── */}
        {tab === 'employees' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <StatCard icon={<Users size={20} />} label="Empleados activos" value={String(activeCount)} />
              <StatCard icon={<DollarSign size={20} />} label="Total semanal" value={fmt(totalWeekly)} />
              <StatCard icon={<DollarSign size={20} />} label="Total mensual (est.)" value={fmt(totalMonthly)} />
            </div>

            {creating && (
              <EmployeeForm
                draft={draft} setDraft={setDraft} sellers={sellers}
                onSave={create} onCancel={() => { setCreating(false); setDraft(EMPTY); }}
                saving={saving} title="Nuevo Empleado"
              />
            )}

            {loading ? <p className="admin-loading">Cargando…</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {employees.length === 0 && (
                  <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-mauve)', padding: '2rem', textAlign: 'center' }}>
                    Sin empleados todavía. Haz clic en &ldquo;Nuevo Empleado&rdquo; para agregar uno.
                  </p>
                )}
                {employees.map(emp => {
                  const isEditing = editId === emp.id;
                  return isEditing ? (
                    <EmployeeForm
                      key={emp.id}
                      draft={{ ...emp, ...editDraft }}
                      setDraft={d => setEditDraft(d as Partial<Employee>)}
                      sellers={sellers}
                      onSave={() => saveEdit(emp.id)}
                      onCancel={() => { setEditId(null); setEditDraft({}); }}
                      saving={saving}
                      title={`Editando: ${emp.full_name}`}
                    />
                  ) : (
                    <div key={emp.id} style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 12, padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--makay-dark-navy)', margin: '0 0 0.15rem' }}>{emp.full_name}</p>
                          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>
                            {emp.department}{emp.position ? ` · ${emp.position}` : ''}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: 'var(--font-montserrat)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--makay-dark-navy)', margin: 0 }}>{fmt(emp.weekly_wage)}/sem</p>
                          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', margin: 0 }}>{fmt(monthly(emp.weekly_wage))}/mes</p>
                        </div>
                        {(Number(emp.commission_pct) > 0 || Number(emp.commission_fixed) > 0) && (
                          <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', fontWeight: 700, color: '#10b981', background: '#f0fdf4', padding: '0.2rem 0.55rem', borderRadius: 100, whiteSpace: 'nowrap' }}>
                            {Number(emp.commission_pct) > 0 ? `${emp.commission_pct}% comisión` : ''}
                            {Number(emp.commission_pct) > 0 && Number(emp.commission_fixed) > 0 ? ' + ' : ''}
                            {Number(emp.commission_fixed) > 0 ? fmt(emp.commission_fixed) : ''}
                          </span>
                        )}
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: emp.status === 'active' ? '#10b981' : '#9ca3af', fontWeight: 700 }}>
                          {emp.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          <button onClick={() => toggleStatus(emp)} title={emp.status === 'active' ? 'Desactivar' : 'Activar'} style={{ padding: '0.3rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex' }}>
                            {emp.status === 'active' ? <ToggleRight size={16} color="#10b981" /> : <ToggleLeft size={16} color="#b0a090" />}
                          </button>
                          <button onClick={() => { setEditId(emp.id); setEditDraft({}); }} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)' }}>
                            <Edit2 size={11} /> Editar
                          </button>
                          <button onClick={() => remove(emp.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid #fecaca', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: '#ef4444' }}>
                            <Trash2 size={11} /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── RUNS TAB ── */}
        {tab === 'runs' && (
          <>
            <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1rem' }}>Generar Nueva Nómina</p>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label style={labelStyle}>Desde</label>
                  <input style={fieldStyle} type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Hasta</label>
                  <input style={fieldStyle} type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} />
                </div>
                <button onClick={generateRun} disabled={generating} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.5rem 1.1rem', borderRadius: 8, border: 'none',
                  background: 'var(--makay-dark-navy)', color: '#fff', cursor: 'pointer',
                  fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', fontWeight: 700,
                }}>
                  <Play size={14} /> {generating ? 'Generando…' : 'Generar Nómina'}
                </button>
              </div>
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.72rem', color: 'var(--makay-mauve)', marginTop: '0.75rem', marginBottom: 0 }}>
                Calcula el pago base (prorrateado según el período) y comisiones de ventas reales para empleados vinculados a una cuenta de vendedor, para todos los empleados activos.
              </p>
            </div>

            {runsLoading ? <p className="admin-loading">Cargando…</p> : runs.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', color: 'var(--makay-mauve)', padding: '2rem', textAlign: 'center' }}>Sin nóminas generadas todavía.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {runs.map(run => {
                  const expanded = expandedRun === run.id;
                  return (
                    <div key={run.id} style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 12, overflow: 'hidden' }}>
                      <div
                        onClick={() => setExpandedRun(expanded ? null : run.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer', flexWrap: 'wrap' }}
                      >
                        <div style={{ flex: 1, minWidth: 160 }}>
                          <p style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--makay-dark-navy)', margin: '0 0 0.15rem' }}>
                            {new Date(run.period_start + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                            {' – '}
                            {new Date(run.period_end + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', color: 'var(--makay-mauve)', margin: 0 }}>{run.items.length} empleado(s)</p>
                        </div>
                        <span style={{ fontFamily: 'var(--font-playfair-display)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--makay-peachy-rose)' }}>{fmt(run.total_amount)}</span>
                        <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 100, background: run.status === 'finalized' ? '#f0fdf4' : '#fffbeb', color: run.status === 'finalized' ? '#10b981' : '#d97706' }}>
                          {run.status === 'finalized' ? 'Finalizada' : 'Borrador'}
                        </span>
                        {expanded ? <ChevronUp size={16} color="var(--makay-mauve)" /> : <ChevronDown size={16} color="var(--makay-mauve)" />}
                      </div>
                      {expanded && (
                        <div style={{ borderTop: '1px solid var(--makay-sand-cream)', padding: '0 1.25rem 1.25rem' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                            <thead>
                              <tr>
                                {['Empleado', 'Departamento', 'Base', 'Comisión', 'Deducciones', 'Total'].map((h, i) => (
                                  <th key={h} style={{ textAlign: i > 1 ? 'right' : 'left', fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--makay-mauve)', padding: '0.4rem 0.5rem' }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {run.items.map(item => (
                                <tr key={item.id} style={{ borderTop: '1px solid var(--makay-sand-cream)' }}>
                                  <td style={{ padding: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: 'var(--makay-dark-navy)', fontWeight: 600 }}>{item.employee_name}</td>
                                  <td style={{ padding: '0.5rem', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', color: 'var(--makay-mauve)' }}>{item.department}</td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem' }}>{fmt(item.base_pay)}</td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: '#10b981' }}>{fmt(item.commission_pay)}</td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'var(--font-montserrat)', fontSize: '0.82rem', color: '#ef4444' }}>{item.deductions > 0 ? `-${fmt(item.deductions)}` : '—'}</td>
                                  <td style={{ padding: '0.5rem', textAlign: 'right', fontFamily: 'var(--font-montserrat)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--makay-dark-navy)' }}>{fmt(item.total_pay)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {run.status !== 'finalized' && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                              <button onClick={() => finalizeRun(run.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.9rem', borderRadius: 7, border: 'none', background: 'var(--makay-dark-navy)', color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                                <Lock size={12} /> Finalizar
                              </button>
                              <button onClick={() => deleteRun(run.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.4rem 0.9rem', borderRadius: 7, border: '1px solid #fecaca', background: 'transparent', color: '#ef4444', fontFamily: 'var(--font-montserrat)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                                <Trash2 size={12} /> Eliminar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--makay-sand-cream)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <span style={{ color: 'var(--makay-peachy-rose)' }}>{icon}</span>
      <span style={{ fontFamily: 'var(--font-playfair-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--makay-dark-navy)' }}>{value}</span>
      <span style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)' }}>{label}</span>
    </div>
  );
}

function EmployeeForm({ draft, setDraft, sellers, onSave, onCancel, saving, title }: {
  draft: Omit<Employee, 'id'> | (Partial<Employee> & { full_name: string });
  setDraft: (updater: any) => void;
  sellers: SellerOption[];
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  title: string;
}) {
  const set = (patch: Partial<Employee>) => setDraft((p: any) => ({ ...p, ...patch }));
  return (
    <div style={{ background: '#fff', border: '1px solid var(--makay-peachy-rose)', borderRadius: 14, padding: '1.5rem', marginBottom: '1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-montserrat)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--makay-mauve)', marginBottom: '1rem' }}>{title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Nombre completo *</label>
          <input style={fieldStyle} value={draft.full_name ?? ''} onChange={e => set({ full_name: e.target.value })} placeholder="Nombre del empleado" />
        </div>
        <div>
          <label style={labelStyle}>Departamento *</label>
          <select style={fieldStyle} value={draft.department ?? DEPARTMENTS[0]} onChange={e => set({ department: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Puesto</label>
          <input style={fieldStyle} value={draft.position ?? ''} onChange={e => set({ position: e.target.value })} placeholder="ej. Mesero, Cocinero" />
        </div>
        <div>
          <label style={labelStyle}>Fecha de inicio</label>
          <input style={fieldStyle} type="date" value={draft.start_date ?? ''} onChange={e => set({ start_date: e.target.value })} />
        </div>
        <div>
          <label style={labelStyle}>Correo</label>
          <input style={fieldStyle} type="email" value={draft.email ?? ''} onChange={e => set({ email: e.target.value })} placeholder="correo@ejemplo.com" />
        </div>
        <div>
          <label style={labelStyle}>Teléfono</label>
          <input style={fieldStyle} value={draft.phone ?? ''} onChange={e => set({ phone: e.target.value })} placeholder="+57 300 000 0000" />
        </div>
        <div>
          <label style={labelStyle}>Sueldo semanal ($) *</label>
          <input style={fieldStyle} type="number" min={0} step={0.01} value={draft.weekly_wage ?? 0} onChange={e => set({ weekly_wage: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label style={labelStyle}>≈ Mensual (calculado)</label>
          <input style={{ ...fieldStyle, background: '#f7f4f0', color: 'var(--makay-mauve)' }} value={fmt(monthly(Number(draft.weekly_wage ?? 0)))} readOnly />
        </div>
        <div>
          <label style={labelStyle}>Comisión (%)</label>
          <input style={fieldStyle} type="number" min={0} max={100} step={0.1} value={draft.commission_pct ?? 0} onChange={e => set({ commission_pct: parseFloat(e.target.value) || 0 })} />
        </div>
        <div>
          <label style={labelStyle}>Comisión fija adicional ($)</label>
          <input style={fieldStyle} type="number" min={0} step={0.01} value={draft.commission_fixed ?? 0} onChange={e => set({ commission_fixed: parseFloat(e.target.value) || 0 })} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Vincular a cuenta de vendedor (opcional — habilita comisión automática por ventas reales)</label>
          <select style={fieldStyle} value={draft.linked_seller_id ?? ''} onChange={e => set({ linked_seller_id: e.target.value })}>
            <option value="">— Sin vincular —</option>
            {sellers.map(s => <option key={s.workerId} value={s.workerId}>{s.name} ({s.email})</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <select style={fieldStyle} value={draft.status ?? 'active'} onChange={e => set({ status: e.target.value })}>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={labelStyle}>Notas</label>
          <input style={fieldStyle} value={draft.notes ?? ''} onChange={e => set({ notes: e.target.value })} placeholder="Notas internas (opcional)" />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={onSave} disabled={saving} style={{ padding: '0.45rem 1.1rem', borderRadius: 8, border: 'none', background: 'var(--makay-dark-navy)', color: '#fff', fontFamily: 'var(--font-montserrat)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={13} /> {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={onCancel} style={{ padding: '0.45rem 0.9rem', borderRadius: 8, border: '1px solid var(--makay-sand-cream)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
