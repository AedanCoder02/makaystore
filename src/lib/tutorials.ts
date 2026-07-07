export interface TutorialStep {
  id: string;
  target: string; // CSS selector of element to highlight
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right'; // overlay position
  actionText?: string; // custom CTA text (default: "Next")
  skipAllowed?: boolean; // allow skip button (default: true)
}

export interface Tutorial {
  id: string;
  name: string;
  role: 'worker' | 'supervisor' | 'admin' | 'all';
  steps: TutorialStep[];
}

export const TUTORIAL_DEFINITIONS: Record<string, Tutorial> = {
  'worker-clock-in': {
    id: 'worker-clock-in',
    name: 'How to Clock In',
    role: 'worker',
    steps: [
      {
        id: 'step-1',
        target: '.clock-in-button',
        title: 'Clock In Button',
        description: 'Click this button to start your shift.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.task-list',
        title: 'Your Tasks',
        description: 'Here you can see your assigned tasks for today.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.clock-out-button',
        title: 'Clock Out',
        description: 'Click this when you finish your shift.',
        placement: 'bottom',
        actionText: 'Finish',
        skipAllowed: true,
      },
    ],
  },

  'supervisor-approve': {
    id: 'supervisor-approve',
    name: 'How to Approve Activity',
    role: 'supervisor',
    steps: [
      {
        id: 'step-1',
        target: '.worker-status-overview',
        title: 'Worker Status',
        description: 'Check who is clocked in and their work progress.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.pending-approvals',
        title: 'Pending Approvals',
        description: 'Activities waiting for your approval are listed here.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.approve-button',
        title: 'Approve Button',
        description: 'Click the checkmark to approve this clock in/out.',
        placement: 'left',
        actionText: 'Finish',
        skipAllowed: true,
      },
    ],
  },

  'admin-products': {
    id: 'admin-products',
    name: 'Managing Products',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.product-list',
        title: 'Product List',
        description: 'Browse all products here.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.edit-product-button',
        title: 'Edit Product',
        description: 'Click to edit product details.',
        placement: 'left',
        actionText: 'Finish',
        skipAllowed: true,
      },
    ],
  },

  'admin-tour': {
    id: 'admin-tour',
    name: 'Tour del Panel Admin',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.dashboard-header h1',
        title: 'Bienvenido al Panel',
        description: 'Este es su panel para gestionar Makay Store. Seleccione cualquier sección para comenzar.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.admin-nav-card:first-child',
        title: 'Gestión de Productos',
        description: 'Suba productos, genere modelos 3D y gestione el inventario.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.admin-nav-card:nth-child(2)',
        title: 'Ver Pedidos',
        description: 'Vea todos los pedidos de clientes y sus detalles.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.admin-nav-card:nth-child(3)',
        title: 'Gestión de Trabajadores',
        description: 'Monitoree a los miembros del equipo y su actividad.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-5',
        target: '.help-button',
        title: 'Botón de Ayuda',
        description: 'Pulse aquí en cualquier momento para volver a ver este tutorial.',
        placement: 'bottom',
        actionText: 'Finalizar',
        skipAllowed: true,
      },
    ],
  },
};
