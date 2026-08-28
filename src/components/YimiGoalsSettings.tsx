'use client';

import { useEffect, useState } from 'react';

interface GoalsSettings {
  vendedorGoalDaily: number;
  vendedorGoalMonthly: number;
  categoryGoals: Record<string, number>;
  monthlyPrize: string;
}

export default function YimiGoalsSettings() {
  const [settings, setSettings] = useState<GoalsSettings | null>(null);
  const [categoryRows, setCategoryRows] = useState<[string, number][]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/yimi-goals')
      .then(r => r.json())
      .then((data: GoalsSettings) => {
        setSettings(data);
        setCategoryRows(Object.entries(data.categoryGoals));
      });
  }, []);

  if (!settings) return <p className="report-loading">Loading...</p>;

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const categoryGoals = Object.fromEntries(categoryRows.filter(([k]) => k.trim() !== ''));
    await fetch('/api/admin/yimi-goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, categoryGoals }),
    });
    setSaving(false);
    setSaved(true);
  };

  return (
    <div className="report-container">
      <div className="cost-settings-row">
        <label className="cost-settings-label">Meta diaria por vendedor ($):</label>
        <input
          type="number"
          className="cost-percent-input"
          value={settings.vendedorGoalDaily}
          min={0}
          onChange={e => setSettings({ ...settings, vendedorGoalDaily: Number(e.target.value) })}
        />
      </div>

      <div className="cost-settings-row">
        <label className="cost-settings-label">Meta mensual por vendedor ($):</label>
        <input
          type="number"
          className="cost-percent-input"
          value={settings.vendedorGoalMonthly}
          min={0}
          onChange={e => setSettings({ ...settings, vendedorGoalMonthly: Number(e.target.value) })}
        />
      </div>

      <div className="table-container">
        <h3>Metas mensuales por categoría / departamento</h3>
        <p style={{ fontSize: '0.85em', opacity: 0.75 }}>
          Incluye una fila &quot;Makay Store&quot; para que la tienda tenga su propia meta,
          igual que cada categoría de Yimi.
        </p>
        {categoryRows.map(([name, goal], i) => (
          <div className="cost-settings-row" key={i}>
            <input
              className="cost-percent-input"
              placeholder="Categoría (ej. Cocina, Makay Store)"
              value={name}
              onChange={e => {
                const next = [...categoryRows];
                next[i] = [e.target.value, goal];
                setCategoryRows(next);
              }}
            />
            <input
              type="number"
              className="cost-percent-input"
              placeholder="Meta ($)"
              value={goal}
              onChange={e => {
                const next = [...categoryRows];
                next[i] = [name, Number(e.target.value)];
                setCategoryRows(next);
              }}
            />
            <button
              className="cost-save-btn"
              onClick={() => setCategoryRows(categoryRows.filter((_, idx) => idx !== i))}
            >
              Eliminar
            </button>
          </div>
        ))}
        <button className="cost-save-btn" onClick={() => setCategoryRows([...categoryRows, ['', 0]])}>
          + Agregar categoría
        </button>
      </div>

      <div className="table-container">
        <h3>Premio mensual</h3>
        <input
          className="cost-percent-input"
          value={settings.monthlyPrize}
          onChange={e => setSettings({ ...settings, monthlyPrize: e.target.value })}
        />
      </div>

      <div className="cost-settings-row">
        <button className="cost-save-btn" onClick={save} disabled={saving}>
          {saving ? '...' : 'Guardar'}
        </button>
        {saved && <span>Guardado.</span>}
      </div>
    </div>
  );
}
