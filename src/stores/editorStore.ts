import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ComponentType = 'hero' | 'features' | 'testimonials' | 'cta' | 'faq' | 'gallery';
export type PageStatus = 'draft' | 'published';

export interface ComponentData {
  id: string;
  type: ComponentType;
  order: number;
  content: Record<string, unknown>;
}

export interface PageVersion {
  id: string;
  createdAt: string;
  components: ComponentData[];
}

export interface MarketingPage {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  components: ComponentData[];
  versions: PageVersion[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

interface EditorState {
  pages: MarketingPage[];
  currentPageId: string | null;
  selectedComponentId: string | null;

  // Page operations
  createPage: (slug: string, title: string) => void;
  deletePage: (pageId: string) => void;
  loadPage: (pageId: string) => void;
  updatePageTitle: (pageId: string, title: string) => void;
  publishPage: (pageId: string) => void;

  // Component operations
  addComponent: (type: ComponentType, content?: Record<string, unknown>) => void;
  deleteComponent: (componentId: string) => void;
  updateComponent: (componentId: string, content: Record<string, unknown>) => void;
  reorderComponent: (componentId: string, newOrder: number) => void;
  selectComponent: (componentId: string | null) => void;

  // Version management
  saveVersion: (pageId: string) => void;
  restoreVersion: (pageId: string, versionId: string) => void;
}

const createDefaultPage = (slug: string, title: string): MarketingPage => ({
  id: `page-${Date.now()}`,
  slug,
  title,
  status: 'draft',
  components: [],
  versions: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      pages: [],
      currentPageId: null,
      selectedComponentId: null,

      createPage: (slug, title) =>
        set((state) => {
          const newPage = createDefaultPage(slug, title);
          return {
            pages: [...state.pages, newPage],
            currentPageId: newPage.id,
          };
        }),

      deletePage: (pageId) =>
        set((state) => ({
          pages: state.pages.filter((p) => p.id !== pageId),
          currentPageId: state.currentPageId === pageId ? null : state.currentPageId,
        })),

      loadPage: (pageId) => set({ currentPageId: pageId, selectedComponentId: null }),

      updatePageTitle: (pageId, title) =>
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === pageId
              ? { ...p, title, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      publishPage: (pageId) =>
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === pageId
              ? {
                  ...p,
                  status: 'published',
                  publishedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      addComponent: (type, content = {}) =>
        set((state) => {
          const currentPage = state.pages.find((p) => p.id === state.currentPageId);
          if (!currentPage) return state;

          const newComponent: ComponentData = {
            id: `comp-${Date.now()}`,
            type,
            order: currentPage.components.length,
            content,
          };

          return {
            pages: state.pages.map((p) =>
              p.id === state.currentPageId
                ? {
                    ...p,
                    components: [...p.components, newComponent],
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
            selectedComponentId: newComponent.id,
          };
        }),

      deleteComponent: (componentId) =>
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === state.currentPageId
              ? {
                  ...p,
                  components: p.components
                    .filter((c) => c.id !== componentId)
                    .map((c, i) => ({ ...c, order: i })),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
          selectedComponentId:
            state.selectedComponentId === componentId ? null : state.selectedComponentId,
        })),

      updateComponent: (componentId, content) =>
        set((state) => ({
          pages: state.pages.map((p) =>
            p.id === state.currentPageId
              ? {
                  ...p,
                  components: p.components.map((c) =>
                    c.id === componentId ? { ...c, content } : c
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      reorderComponent: (componentId, newOrder) =>
        set((state) => {
          const currentPage = state.pages.find((p) => p.id === state.currentPageId);
          if (!currentPage) return state;

          const component = currentPage.components.find((c) => c.id === componentId);
          if (!component) return state;

          const reordered = currentPage.components
            .filter((c) => c.id !== componentId)
            .map((c, i) => {
              const idx = i >= newOrder ? i + 1 : i;
              return { ...c, order: idx };
            });

          reordered.splice(newOrder, 0, { ...component, order: newOrder });

          return {
            pages: state.pages.map((p) =>
              p.id === state.currentPageId
                ? { ...p, components: reordered, updatedAt: new Date().toISOString() }
                : p
            ),
          };
        }),

      selectComponent: (componentId) => set({ selectedComponentId: componentId }),

      saveVersion: (pageId) =>
        set((state) => {
          const page = state.pages.find((p) => p.id === pageId);
          if (!page) return state;

          const version: PageVersion = {
            id: `version-${Date.now()}`,
            createdAt: new Date().toISOString(),
            components: JSON.parse(JSON.stringify(page.components)),
          };

          return {
            pages: state.pages.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    versions: [...p.versions.slice(-9), version],
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          };
        }),

      restoreVersion: (pageId, versionId) =>
        set((state) => {
          const page = state.pages.find((p) => p.id === pageId);
          const version = page?.versions.find((v) => v.id === versionId);

          if (!page || !version) return state;

          return {
            pages: state.pages.map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    components: JSON.parse(JSON.stringify(version.components)),
                    updatedAt: new Date().toISOString(),
                  }
                : p
            ),
          };
        }),
    }),
    { name: 'makay-editor-state' }
  )
);
