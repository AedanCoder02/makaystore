/**
 * Unit tests for useEditorStore (Zustand)
 */
import { act } from '@testing-library/react';

const getStore = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useEditorStore } = require('@/stores/editorStore');
  return useEditorStore;
};

beforeEach(() => {
  jest.resetModules();
});

describe('useEditorStore', () => {
  describe('createPage', () => {
    it('creates a new page and sets it as current', () => {
      const store = getStore();
      act(() => { store.getState().createPage('home', 'Home Page'); });

      const { pages, currentPageId } = store.getState();
      expect(pages).toHaveLength(1);
      expect(pages[0].slug).toBe('home');
      expect(pages[0].title).toBe('Home Page');
      expect(pages[0].status).toBe('draft');
      expect(currentPageId).toBe(pages[0].id);
    });
  });

  describe('deletePage', () => {
    it('removes a page and clears currentPageId if it was current', () => {
      const store = getStore();
      act(() => { store.getState().createPage('about', 'About'); });
      const pageId = store.getState().currentPageId;

      act(() => { store.getState().deletePage(pageId); });

      expect(store.getState().pages).toHaveLength(0);
      expect(store.getState().currentPageId).toBeNull();
    });
  });

  describe('addComponent', () => {
    it('adds a component to the current page', () => {
      const store = getStore();
      act(() => { store.getState().createPage('landing', 'Landing'); });

      act(() => { store.getState().addComponent('hero', { title: 'Hello' }); });

      const page = store.getState().pages[0];
      expect(page.components).toHaveLength(1);
      expect(page.components[0].type).toBe('hero');
      expect(page.components[0].content).toEqual({ title: 'Hello' });
    });

    it('selects the newly added component', () => {
      const store = getStore();
      act(() => { store.getState().createPage('landing', 'Landing'); });
      act(() => { store.getState().addComponent('cta'); });

      const { selectedComponentId, pages } = store.getState();
      expect(selectedComponentId).toBe(pages[0].components[0].id);
    });
  });

  describe('deleteComponent', () => {
    it('removes a component and reorders remaining components', () => {
      const store = getStore();
      act(() => { store.getState().createPage('landing', 'Landing'); });
      act(() => { store.getState().addComponent('hero'); });
      act(() => { store.getState().addComponent('features'); });

      const compId = store.getState().pages[0].components[0].id;
      act(() => { store.getState().deleteComponent(compId); });

      const { pages } = store.getState();
      expect(pages[0].components).toHaveLength(1);
      expect(pages[0].components[0].order).toBe(0);
    });
  });

  describe('publishPage', () => {
    it('changes page status to published and sets publishedAt', () => {
      const store = getStore();
      act(() => { store.getState().createPage('promo', 'Promo'); });
      const pageId = store.getState().pages[0].id;

      act(() => { store.getState().publishPage(pageId); });

      const page = store.getState().pages[0];
      expect(page.status).toBe('published');
      expect(page.publishedAt).toBeDefined();
    });
  });

  describe('saveVersion / restoreVersion', () => {
    it('saves current components as a version and restores them', () => {
      const store = getStore();
      act(() => { store.getState().createPage('test', 'Test'); });
      const pageId = store.getState().pages[0].id;

      act(() => { store.getState().addComponent('hero', { text: 'Version 1' }); });
      act(() => { store.getState().saveVersion(pageId); });

      const versionId = store.getState().pages[0].versions[0].id;

      // Modify after save
      const compId = store.getState().pages[0].components[0].id;
      act(() => { store.getState().updateComponent(compId, { text: 'Version 2' }); });

      // Restore
      act(() => { store.getState().restoreVersion(pageId, versionId); });

      const page = store.getState().pages[0];
      expect(page.components[0].content).toEqual({ text: 'Version 1' });
    });
  });
});
