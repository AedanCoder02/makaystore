import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GenerationJob {
  requestId: string;
  productId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  glbUrl?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface GenerationState {
  jobs: { [requestId: string]: GenerationJob };
  addJob: (job: GenerationJob) => void;
  updateJob: (requestId: string, updates: Partial<GenerationJob>) => void;
  getJob: (requestId: string) => GenerationJob | undefined;
  removeJob: (requestId: string) => void;
}

export const useGenerationStore = create<GenerationState>()(
  persist(
    (set, get) => ({
      jobs: {},

      addJob: (job: GenerationJob) =>
        set((state) => ({
          jobs: { ...state.jobs, [job.requestId]: job },
        })),

      updateJob: (requestId: string, updates: Partial<GenerationJob>) =>
        set((state) => ({
          jobs: {
            ...state.jobs,
            [requestId]: {
              ...state.jobs[requestId],
              ...updates,
              updatedAt: new Date().toISOString(),
            },
          },
        })),

      getJob: (requestId: string) => get().jobs[requestId],

      removeJob: (requestId: string) =>
        set((state) => {
          const { [requestId]: _, ...rest } = state.jobs;
          return { jobs: rest };
        }),
    }),
    {
      name: 'makay-generation-jobs',
    }
  )
);
