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
};
