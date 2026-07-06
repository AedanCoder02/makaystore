'use client';

import { Task } from '@/hooks/useWorkerActivity';

export default function TaskListWorker({ tasks }: { tasks: Task[] }) {
  return (
    <div className="task-list">
      <h3 className="task-list-title">Your Tasks Today</h3>
      {tasks.length === 0 ? (
        <p className="no-tasks">No tasks assigned.</p>
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
