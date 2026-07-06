export interface Worker {
  id: string;
  name: string;
  email: string;
  role: 'worker' | 'supervisor' | 'admin';
  lastActivity: Date;
  isActive: boolean;
}

export const mockWorkers: Worker[] = [
  {
    id: 'worker-1',
    name: 'María García',
    email: 'maria@makaystore.com',
    role: 'worker',
    lastActivity: new Date(Date.now() - 5 * 60000),
    isActive: true,
  },
  {
    id: 'worker-2',
    name: 'Carlos López',
    email: 'carlos@makaystore.com',
    role: 'worker',
    lastActivity: new Date(Date.now() - 45 * 60000),
    isActive: false,
  },
  {
    id: 'supervisor-1',
    name: 'Ana Martínez',
    email: 'ana@makaystore.com',
    role: 'supervisor',
    lastActivity: new Date(),
    isActive: true,
  },
];
