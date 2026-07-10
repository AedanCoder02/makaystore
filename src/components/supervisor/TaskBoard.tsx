'use client';

import { ClipboardList } from 'lucide-react';

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

interface TaskBoardProps {
  tasks: BoardTask[];
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  High: 'task-priority-high',
  Medium: 'task-priority-medium',
  Low: 'task-priority-low',
};

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function TaskBoard({ tasks }: TaskBoardProps) {
  const workers = Array.from(new Set(tasks.map((t) => t.assignedTo)));

  const workerCompletion = workers.map((w) => {
    const workerTasks = tasks.filter((t) => t.assignedTo === w);
    const done = workerTasks.filter((t) => t.status === 'done').length;
    return { name: w, pct: workerTasks.length > 0 ? Math.round((done / workerTasks.length) * 100) : 0 };
  });

  return (
    <div className="sup-section">
      <div className="sup-section-header">
        <ClipboardList size={20} className="sup-section-icon" />
        <h2 className="sup-section-title">Task Board</h2>
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
          const colTasks = tasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className={`taskboard-column taskboard-column-${col.key}`}>
              <div className="taskboard-col-header">
                <span className="taskboard-col-label">{col.label}</span>
                <span className="taskboard-col-count">{colTasks.length}</span>
              </div>
              <div className="taskboard-col-items">
                {colTasks.map((task) => (
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
                {colTasks.length === 0 && (
                  <p className="sup-empty-col">No tasks</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
