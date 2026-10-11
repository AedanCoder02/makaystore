'use client';

import { useEffect, useState, useCallback } from 'react';
import { ClipboardList, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface BoardTask {
  id: string;
  name: string;
  assignedTo: string;
  dueTime: string;
  priority: TaskPriority;
  status: TaskStatus;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  High: 'task-priority-high',
  Medium: 'task-priority-medium',
  Low: 'task-priority-low',
};

// Self-fetching so seller task completions are always live
export default function TaskBoard({ tasks: _ignored }: { tasks?: BoardTask[] }) {
  const t = useTranslations('supervisor');
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetch('/api/supervisor/tasks')
      .then(r => r.ok ? r.json() : [])
      .catch(() => []);
    setTasks(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Poll every 30s so seller completions appear without manual refresh
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const COLUMNS: { key: TaskStatus; label: string }[] = [
    { key: 'todo',        label: t('toDo') },
    { key: 'in-progress', label: t('inProgress') },
    { key: 'done',        label: t('done') },
  ];

  const workers = Array.from(new Set(tasks.map((t) => t.assignedTo)));
  const workerCompletion = workers.map((w) => {
    const wt = tasks.filter((t) => t.assignedTo === w);
    const done = wt.filter((t) => t.status === 'done').length;
    return { name: w, pct: wt.length > 0 ? Math.round((done / wt.length) * 100) : 0 };
  });

  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <ClipboardList size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">{t('taskBoard')}</h2>
        <button
          onClick={load}
          disabled={loading}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: loading ? 'wait' : 'pointer', color: 'var(--makay-mauve)', display: 'flex', padding: '0.2rem' }}
          title="Actualizar"
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        </button>
      </div>

      <div className="taskboard-worker-completion">
        {workerCompletion.map((w) => (
          <span key={w.name} className="worker-completion-badge">
            {w.name}: {w.pct}%
          </span>
        ))}
      </div>

      <div className="taskboard-columns">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((task) => task.status === col.key);
          return (
            <div key={col.key} className={`taskboard-column taskboard-column-${col.key}`}>
              <div className="taskboard-col-header">
                <span className="taskboard-col-label">{col.label}</span>
                <span className="taskboard-col-count">{colTasks.length}</span>
              </div>
              <div className="taskboard-col-items">
                {loading && colTasks.length === 0 ? (
                  <p className="sup-empty-col">Cargando…</p>
                ) : colTasks.map((task) => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-name">{task.name}</div>
                    <div className="task-card-meta">
                      <span className="task-card-assignee">{task.assignedTo}</span>
                      <span className="task-card-due">{task.dueTime}</span>
                    </div>
                    <span className={`task-priority-badge ${PRIORITY_COLORS[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
                {!loading && colTasks.length === 0 && <p className="sup-empty-col">{t('noTasks')}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
