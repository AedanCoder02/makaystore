export interface TutorialStep {
  id: string;
  target: string;
  title: string;
  description: string;
  placement: 'top' | 'bottom' | 'left' | 'right';
  actionText?: string;
  skipAllowed?: boolean;
}

export interface Tutorial {
  id: string;
  name: string;
  role: 'worker' | 'supervisor' | 'admin' | 'seller' | 'customer' | 'all';
  steps: TutorialStep[];
}

export const TUTORIAL_DEFINITIONS: Record<string, Tutorial> = {

  // ── Worker ───────────────────────────────────────────────────────
  'worker-clock-in': {
    id: 'worker-clock-in',
    name: 'How to Use Your Dashboard',
    role: 'worker',
    steps: [
      {
        id: 'step-1',
        target: '.activity-header',
        title: 'Your Shift Controls',
        description: 'Use the buttons here to clock in when your shift starts and clock out when it ends.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.activity-content',
        title: 'Activity Log',
        description: 'Every clock in, clock out, and completed task is recorded here in real time.',
        placement: 'top',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.help-button',
        title: 'Need Help?',
        description: 'Click this button anytime to replay this tutorial.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  // ── Supervisor ───────────────────────────────────────────────────
  'supervisor-approve': {
    id: 'supervisor-approve',
    name: 'Supervisor Dashboard Tour',
    role: 'supervisor',
    steps: [
      {
        id: 'step-1',
        target: '.dashboard-header',
        title: 'Supervisor Dashboard',
        description: 'This is your control centre. Monitor team activity, review performance, and manage shifts.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.worker-profile-list',
        title: 'Your Team',
        description: 'All active workers appear here. Click any worker chip to see their detailed activity.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.sup-section',
        title: 'Dashboard Sections',
        description: 'Each section gives you a different view — sales, tasks, rankings, alerts, and shift overview.',
        placement: 'top',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.help-button',
        title: 'Need Help?',
        description: 'Click this button anytime to replay this tutorial.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  // ── Admin ────────────────────────────────────────────────────────
  'admin-tour': {
    id: 'admin-tour',
    name: 'Admin Panel Tour',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.dashboard-header',
        title: 'Welcome to Admin',
        description: 'This is your central hub for managing Makay Store. Select any section to get started.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.admin-nav-card:first-child',
        title: 'Products & 3D',
        description: 'Upload products, generate 3D models, and manage your inventory.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.admin-nav-card:nth-child(2)',
        title: 'Orders',
        description: 'View all customer orders and their fulfilment status.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.admin-nav-card:nth-child(3)',
        title: 'Team Management',
        description: 'Monitor workers, view activity, and manage your team.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-5',
        target: '.help-button',
        title: 'Need Help?',
        description: 'Click this button anytime to replay this tour.',
        placement: 'bottom',
        actionText: "Let's go",
        skipAllowed: false,
      },
    ],
  },

  'reports-tour': {
    id: 'reports-tour',
    name: 'Reports & Analytics Tour',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.dashboard-header',
        title: 'Reports & Analytics',
        description: 'Track sales, costs, goals, inventory, and rotation metrics all in one place.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.tab-button:first-child',
        title: 'Report Tabs',
        description: 'Switch between Sales, Costs, Goals, Inventory, and Rotation using these tabs.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.metric-card',
        title: 'Key Metrics',
        description: 'Each card shows a critical number with trend direction indicators.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.help-button',
        title: 'Need Help?',
        description: 'Replay this tour anytime by clicking the help button.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  'rotation-tour': {
    id: 'rotation-tour',
    name: 'Product Rotation Tour',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.rotation-header',
        title: 'Product Rotation',
        description: 'Schedule when products change between Active, Paused, and Archived states.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.admin-rotation-layout',
        title: 'Product Table',
        description: 'All products are listed here with their current status. Click column headers to sort.',
        placement: 'top',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.help-button',
        title: 'Need Help?',
        description: 'Replay this tour anytime.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  'admin-products': {
    id: 'admin-products',
    name: '3D Product Generator Tour',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.generation-wizard',
        title: '3D Product Generator',
        description: 'Upload a product photo and an AI model will generate a 3D version automatically.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.wizard-step',
        title: 'Step by Step',
        description: 'Follow the flow: select product → upload photo → generate → preview → confirm.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  'theme-editor-tour': {
    id: 'theme-editor-tour',
    name: 'Theme Editor Tour',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.theme-editor-topbar',
        title: 'Theme Editor',
        description: 'Edit the look and feel of the entire storefront from here. Changes preview instantly — only Publish makes them live.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.te-tabs',
        title: 'Four Control Areas',
        description: 'Colors controls the palette, Scroll sets per-section backgrounds, Images lets you change product photos, Card customises the member card.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.te-preset-grid',
        title: 'Preset Themes',
        description: 'Pick a preset to instantly apply a full palette — Makay Default, Dark Luxury, Ocean Breeze, Sunset Coral, or Minimal White.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.te-preview-body',
        title: 'Live Preview',
        description: 'Every change is reflected here in real time before you publish.',
        placement: 'left',
        skipAllowed: true,
      },
      {
        id: 'step-5',
        target: '.te-btn-primary',
        title: 'Publish',
        description: "When you're happy, click Publish. Your theme goes live on the store immediately.",
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  // ── Seller ───────────────────────────────────────────────────────
  'seller-dashboard-tour': {
    id: 'seller-dashboard-tour',
    name: 'Seller Dashboard Tour',
    role: 'seller',
    steps: [
      {
        id: 'step-1',
        target: '.seller-stats-grid',
        title: 'Your Numbers',
        description: 'Revenue, orders, tracked products, and stock units — all at a glance.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.seller-action-grid',
        title: 'Quick Actions',
        description: 'Jump straight to selling, managing products, or updating stock.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.seller-sidebar-nav',
        title: 'Navigation',
        description: 'Use the sidebar to switch between Sell, Products, and Stock.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.seller-page-header',
        title: "You're all set",
        description: 'Start by clicking "Sell to Client" to process your first sale.',
        placement: 'bottom',
        actionText: "Let's sell",
        skipAllowed: false,
      },
    ],
  },

  'seller-products-tour': {
    id: 'seller-products-tour',
    name: 'Products Management Tour',
    role: 'seller',
    steps: [
      {
        id: 'step-1',
        target: '.seller-page-header',
        title: 'Product Management',
        description: 'Edit any product\'s price, description, image, or type. Changes here override store defaults.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.seller-search',
        title: 'Search Products',
        description: 'Filter by name or SKU to find products quickly.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.seller-product-row',
        title: 'Edit a Product',
        description: 'Click the pencil icon to edit price, image, description, or switch between Storefront and Dropshipping.',
        placement: 'left',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.seller-btn-primary',
        title: 'Add New Products',
        description: 'Use Add Product to create a brand-new item specific to your store.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  'seller-stock-tour': {
    id: 'seller-stock-tour',
    name: 'Stock Management Tour',
    role: 'seller',
    steps: [
      {
        id: 'step-1',
        target: '.seller-page-header',
        title: 'Stock Management',
        description: 'Control how many units of each product are available.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.seller-stock-row',
        title: 'Adjust Quantities',
        description: 'Use the +1, -1, +5, -5 buttons or type directly. Low stock (under 10) is highlighted in red.',
        placement: 'left',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.seller-stock-save',
        title: 'Save Each Row',
        description: 'Hit Save on each row to persist that product\'s stock level to the database.',
        placement: 'left',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  'seller-sell-tour': {
    id: 'seller-sell-tour',
    name: 'Sell to Client Tour',
    role: 'seller',
    steps: [
      {
        id: 'step-1',
        target: '.seller-steps',
        title: '3-Step Sale Process',
        description: 'Selling on behalf of a client takes 3 steps: select client, add products, then checkout.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.seller-step-content',
        title: 'Step 1 — Select Client',
        description: 'Search for the client by name or email and click their card to select them.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.seller-page-header',
        title: 'Storefront & Dropshipping',
        description: 'Mix Storefront products (shipped from stock) and Dropshipping products (shipped from supplier) in the same sale.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.seller-page-header',
        title: 'Complete the Sale',
        description: 'After adding products, proceed to checkout, choose a payment method, and complete the sale. The order is saved to the client\'s record.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  // ── Marketing Editor ─────────────────────────────────────────────
  'editor-tour': {
    id: 'editor-tour',
    name: 'Marketing Editor Tour',
    role: 'admin',
    steps: [
      {
        id: 'step-1',
        target: '.mkt-page-list',
        title: 'Select a Page',
        description: 'Choose which store page to customize — Home, All Products, Product Detail, or Checkout.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.mkt-tabs',
        title: 'Three Control Areas',
        description: 'Colors lets you override the palette for that page. Typography sets fonts and heading scale. Content edits the text fields.',
        placement: 'right',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.mkt-preview-pane',
        title: 'Live Preview',
        description: 'Every change you make is reflected here instantly — see exactly how the page will look before publishing.',
        placement: 'left',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.mkt-publish-btn',
        title: 'Publish Changes',
        description: 'When you are happy with the result, click Publish. Your changes go live on the store immediately.',
        placement: 'bottom',
        actionText: 'Got it',
        skipAllowed: false,
      },
    ],
  },

  // ── Customer / Profile ───────────────────────────────────────────
  'profile-tour': {
    id: 'profile-tour',
    name: 'Your Makay Profile',
    role: 'customer',
    steps: [
      {
        id: 'step-1',
        target: '.profile-header',
        title: 'Your Profile',
        description: 'This is your Makay Beach Club profile. Your avatar is managed through your Clerk account settings.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-2',
        target: '.profile-bio-text',
        title: 'Your Bio',
        description: 'Click Edit to add a short bio that appears on your member card.',
        placement: 'bottom',
        skipAllowed: true,
      },
      {
        id: 'step-3',
        target: '.profile-wallet-card',
        title: 'Makay Wallet',
        description: 'Your wallet balance can be used for discounts and exclusive member benefits.',
        placement: 'top',
        skipAllowed: true,
      },
      {
        id: 'step-4',
        target: '.makay-client-card',
        title: 'Your Member Card',
        description: 'This is your digital Makay Beach Club card. Share it or save it — the QR code lets staff verify your membership.',
        placement: 'top',
        actionText: 'Enjoy Makay',
        skipAllowed: false,
      },
    ],
  },
};
