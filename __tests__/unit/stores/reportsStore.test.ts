/**
 * Unit tests for useReportsStore (Zustand)
 */
import { act } from '@testing-library/react';

const getStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useReportsStore } = require('@/stores/reportsStore');
  return useReportsStore;
};

beforeEach(() => {
  jest.resetModules();
});

describe('useReportsStore', () => {
  it('initializes with sales as the active tab', () => {
    const store = getStore();
    expect(store.getState().activeTab).toBe('sales');
  });

  it('setActiveTab updates the active tab', () => {
    const store = getStore();

    act(() => { store.getState().setActiveTab('cost'); });
    expect(store.getState().activeTab).toBe('cost');

    act(() => { store.getState().setActiveTab('goals'); });
    expect(store.getState().activeTab).toBe('goals');

    act(() => { store.getState().setActiveTab('stock'); });
    expect(store.getState().activeTab).toBe('stock');

    act(() => { store.getState().setActiveTab('rotation'); });
    expect(store.getState().activeTab).toBe('rotation');
  });
});
