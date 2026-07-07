import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReportTab = 'sales' | 'cost' | 'goals' | 'stock' | 'rotation';

interface ReportsState {
  activeTab: ReportTab;
  setActiveTab: (tab: ReportTab) => void;
}

export const useReportsStore = create<ReportsState>()(
  persist(
    (set) => ({
      activeTab: 'sales',
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'makay-reports-state',
    }
  )
);
