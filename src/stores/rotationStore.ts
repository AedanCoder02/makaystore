import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RotationStatus = 'active' | 'paused' | 'archived';

export interface RotationJob {
  id: string;
  productId: string;
  currentStatus: RotationStatus;
  newStatus: RotationStatus;
  scheduledDate?: string;
  completedDate?: string;
  notes?: string;
}

interface RotationState {
  queue: RotationJob[];
  selectedProducts: string[];
  history: RotationJob[];

  addRotation: (productId: string, currentStatus: RotationStatus, newStatus: RotationStatus, date?: string, notes?: string) => void;
  rotateNow: (productId: string, currentStatus: RotationStatus, newStatus: RotationStatus) => void;
  bulkRotate: (productIds: string[], newStatus: RotationStatus) => void;
  selectProduct: (productId: string) => void;
  deselectProduct: (productId: string) => void;
  clearSelection: () => void;
  completeRotation: (rotationId: string) => void;
}

export const useRotationStore = create<RotationState>()(
  persist(
    (set) => ({
      queue: [],
      selectedProducts: [],
      history: [],

      addRotation: (productId, currentStatus, newStatus, date, notes) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              id: `rot-${Date.now()}`,
              productId,
              currentStatus,
              newStatus,
              scheduledDate: date,
              notes,
            },
          ],
        })),

      rotateNow: (productId, currentStatus, newStatus) =>
        set((state) => ({
          queue: [
            ...state.queue,
            {
              id: `rot-${Date.now()}`,
              productId,
              currentStatus,
              newStatus,
              completedDate: new Date().toISOString(),
            },
          ],
        })),

      bulkRotate: (productIds, newStatus) =>
        set((state) => ({
          queue: [
            ...state.queue,
            ...productIds.map((id) => ({
              id: `rot-${Date.now()}-${id}`,
              productId: id,
              currentStatus: 'active' as RotationStatus,
              newStatus,
              completedDate: new Date().toISOString(),
            })),
          ],
        })),

      selectProduct: (productId) =>
        set((state) => ({
          selectedProducts: state.selectedProducts.includes(productId)
            ? state.selectedProducts
            : [...state.selectedProducts, productId],
        })),

      deselectProduct: (productId) =>
        set((state) => ({
          selectedProducts: state.selectedProducts.filter((id) => id !== productId),
        })),

      clearSelection: () => set({ selectedProducts: [] }),

      completeRotation: (rotationId) =>
        set((state) => {
          const rotation = state.queue.find((r) => r.id === rotationId);
          return {
            queue: state.queue.filter((r) => r.id !== rotationId),
            history: rotation ? [...state.history, { ...rotation, completedDate: new Date().toISOString() }] : state.history,
          };
        }),
    }),
    { name: 'makay-rotation-state' }
  )
);
