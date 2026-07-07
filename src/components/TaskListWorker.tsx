'use client';

import { useTranslations } from 'next-intl';
import { Task } from '@/hooks/useWorkerActivity';

export default function TaskListWorker({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('worker');

  return (
    <div className="task-list">
      <h3 className="task-list-title">{t('tasksToday')}</h3>
      {tasks.length === 0 ? (
        <p className="no-tasks">{t('noTasks')}</p>
      ) : (
        <div className="task-items">
          {tasks.map((task) => (
            <div key={task.id} className="task-item">
              <span className="task-title">{task.title}</span>
              <span className={`task-priority ${task.priority}`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
