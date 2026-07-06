'use client';

import { WorkerStatus } from '@/stores/supervisorStore';

interface WorkerStatusOverviewProps {
  workersStatus: WorkerStatus[];
}

export default function WorkerStatusOverview({ workersStatus }: WorkerStatusOverviewProps) {
  const getElapsedTime = (startTime?: string) => {
    if (!startTime) return '';
    const elapsed = (Date.now() - new Date(startTime).getTime()) / 60000;
    const hours = Math.floor(elapsed / 60);
    const minutes = Math.floor(elapsed % 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="worker-status-overview">
      <h2>Worker Status</h2>
      <div className="worker-cards">
        {workersStatus.map((worker) => (
          <div key={worker.workerId} className={`worker-card ${worker.clockedIn ? 'clocked-in' : ''}`}>
            <h3>{worker.name}</h3>
            <p className={`status-badge ${worker.clockedIn ? 'in' : 'out'}`}>
              {worker.clockedIn ? 'Clocked IN' : 'Clocked OUT'}
            </p>
            {worker.clockedIn && <p className="elapsed">{getElapsedTime(worker.startTime)}</p>}
            <p className="task-count">Tasks: {worker.taskCount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
