/**
 * Component tests for AdminDashboard
 */
import React from 'react';

// ─── Mocks (must be before component imports) ────────────────────────────────
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      dashboard: 'Admin Dashboard',
      products: 'Products',
      productsDesc: 'Manage your product catalog',
      orders: 'Orders',
      ordersDesc: 'View and manage orders',
      workers: 'Workers',
      workersDesc: 'Worker management',
      reports: 'Reports',
      reportsDesc: 'Analytics and reporting',
      settings: 'Settings',
      settingsDesc: 'Store configuration',
      welcome: 'Welcome to admin',
      showTutorial: 'Show tutorial',
      help: 'Help',
    };
    return map[key] || key;
  },
  useLocale: () => 'en',
}));

// Mock AdminSidebar to avoid deep dependency chain
jest.mock('@/components/AdminSidebar', () => {
  return function MockAdminSidebar() {
    return <nav data-testid="admin-sidebar" />;
  };
});

// Mock useTutorialOverlay hook — returns null (tutorial not active)
jest.mock('@/hooks/useTutorialOverlay', () => ({
  useTutorialOverlay: () => null,
}));

// Mock useTutorialStore
const mockShowTutorial = jest.fn();
const mockCompleted = new Set<string>();

jest.mock('@/stores/tutorialStore', () => ({
  useTutorialStore: () => ({
    completed: mockCompleted,
    showTutorial: mockShowTutorial,
    currentTutorial: null,
    currentStep: 0,
    nextStep: jest.fn(),
    skip: jest.fn(),
  }),
}));

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>;
  };
});

import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from '@/components/AdminDashboard';

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCompleted.clear();
  });

  it('renders the dashboard heading', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('renders all 5 navigation cards', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Workers')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the welcome message', () => {
    render(<AdminDashboard />);
    expect(screen.getByText('Welcome to admin')).toBeInTheDocument();
  });

  it('renders the help button with accessible label', () => {
    render(<AdminDashboard />);
    const helpBtn = screen.getByRole('button', { name: /show tutorial/i });
    expect(helpBtn).toBeInTheDocument();
  });

  it('calls showTutorial when help button is clicked', () => {
    render(<AdminDashboard />);
    const helpBtn = screen.getByRole('button', { name: /show tutorial/i });
    fireEvent.click(helpBtn);
    expect(mockShowTutorial).toHaveBeenCalledWith('admin-tour');
  });

  it('calls showTutorial on mount when admin-tour not yet completed', () => {
    // completed set is empty → tour not done
    render(<AdminDashboard />);
    expect(mockShowTutorial).toHaveBeenCalledWith('admin-tour');
  });
});
