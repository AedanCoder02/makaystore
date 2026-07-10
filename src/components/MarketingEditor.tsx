'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useEditorStore } from '@/stores/editorStore';

import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import { ComponentLibrary } from './ComponentLibrary';
import PageCanvas from './PageCanvas';
import { ComponentSettings } from './ComponentSettings';
import PagePreview from './PagePreview';
import AdminSidebar from './AdminSidebar';

export default function MarketingEditor() {
  const [newPageModalOpen, setNewPageModalOpen] = useState(false);
  const [newPageData, setNewPageData] = useState({ slug: '', title: '' });
  const [previewMode, setPreviewMode] = useState(false);
  const t = useTranslations('marketing');
  const tCommon = useTranslations('common');

  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('editor-tour');
  const completed = tutorialStore.completed;

  const {
    pages,
    currentPageId,
    selectedComponentId,
    createPage,
    loadPage,
    deletePage,
    updatePageTitle,
    publishPage,
    addComponent,
    deleteComponent,
    updateComponent,
    reorderComponent,
    selectComponent,
    saveVersion,
  } = useEditorStore();

  useEffect(() => {
    if (!completed.includes('editor-tour')) {
      tutorialStore.showTutorial('editor-tour');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPage = pages.find((p) => p.id === currentPageId);
  const selectedComponent = currentPage?.components.find(
    (c) => c.id === selectedComponentId
  );

  const handleCreatePage = () => {
    if (!newPageData.slug.trim() || !newPageData.title.trim()) {
      alert(t('allFieldsRequired'));
      return;
    }

    createPage(newPageData.slug, newPageData.title);
    setNewPageData({ slug: '', title: '' });
    setNewPageModalOpen(false);
  };

  const handlePublish = () => {
    if (!currentPageId) return;

    if (currentPage?.components.length === 0) {
      alert(t('atLeastOneComponent'));
      return;
    }

    saveVersion(currentPageId);
    publishPage(currentPageId);
    alert(t('pagePublished'));
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="editor-header">
          <div className="editor-title-section">
            <h1>{t('editor')}</h1>
            <p className="editor-subtitle">{t('editorSubtitle')}</p>
          </div>
          <div className="editor-actions">
            <button
              className="btn btn-primary"
              onClick={() => setPreviewMode(!previewMode)}
              aria-label={previewMode ? t('editorBtn') : t('previewBtn')}
            >
              {previewMode ? `📐 ${t('editorBtn')}` : `👁️ ${t('previewBtn')}`}
            </button>
            {currentPage && (
              <button
                className="btn btn-success"
                onClick={handlePublish}
                disabled={currentPage.status === 'published'}
                aria-label={t('publishPage')}
              >
                {currentPage.status === 'published'
                  ? t('publishedCheck')
                  : `🚀 ${t('publishBtn')}`}
              </button>
            )}
            <button
              className="help-button"
              onClick={() => tutorialStore.showTutorial('editor-tour')}
              aria-label={t('saveVersion')}
              title={t('settings')}
            >
              ?
            </button>
          </div>
        </div>

        {!currentPage ? (
          <div className="editor-empty">
            <div className="empty-state">
              <h2>{t('noPageSelected')}</h2>
              <p>{t('noPageSelectedDesc')}</p>

              <div className="pages-list">
                <h3>{t('existingPages')}</h3>
                {pages.length === 0 ? (
                  <p className="no-pages">{t('noPagesYet')}</p>
                ) : (
                  <div className="pages-grid">
                    {pages.map((page) => (
                      <div
                        key={page.id}
                        className="page-card"
                        onClick={() => loadPage(page.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            loadPage(page.id);
                          }
                        }}
                      >
                        <div className="page-card-header">
                          <h4>{page.title}</h4>
                          <span className="page-status">{page.status}</span>
                        </div>
                        <p className="page-slug">/{page.slug}</p>
                        <div className="page-card-footer">
                          <span>{page.components.length} {t('components')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setNewPageModalOpen(true)}
                aria-label={t('createPage')}
              >
                {t('newPage')}
              </button>
            </div>
          </div>
        ) : (
          <div className="editor-workspace">
            {previewMode ? (
              <div className="editor-preview-full">
                <PagePreview
                  title={currentPage.title}
                  components={currentPage.components}
                />
              </div>
            ) : (
              <>
                <div className="editor-sidebar">
                  <div className="editor-page-info">
                    <div className="page-info-group">
                      <label>{t('pageName')}</label>
                      <input
                        type="text"
                        value={currentPage.title}
                        onChange={(e) =>
                          currentPageId && updatePageTitle(currentPageId, e.target.value)
                        }
                        placeholder={t('pageTitlePlaceholder')}
                        className="page-title-input"
                      />
                    </div>
                    <div className="page-info-group">
                      <label>{t('slugLabel')}</label>
                      <input
                        type="text"
                        value={currentPage.slug}
                        disabled
                        className="page-slug-input"
                      />
                    </div>
                    <div className="page-info-group">
                      <label>{t('status')}</label>
                      <span className="page-status-badge">
                        {currentPage.status === 'published'
                          ? `🟢 ${t('statusPublished')}`
                          : `🟡 ${t('statusDraft')}`}
                      </span>
                    </div>
                  </div>

                  <ComponentLibrary />
                </div>

                <div className="editor-center">
                  <PageCanvas
                    components={currentPage.components}
                    selectedComponentId={selectedComponentId}
                    onSelectComponent={selectComponent}
                    onReorderComponent={reorderComponent}
                  />
                </div>

                <div className="editor-right-sidebar">
                  <ComponentSettings />
                </div>
              </>
            )}

            <div className="editor-footer">
              <span className="editor-status">
                {currentPage.components.length} {t('components')}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => loadPage('')}
                aria-label={t('backToList')}
              >
                ← {t('backToList')}
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (currentPageId && confirm(t('deletePageConfirm'))) {
                    deletePage(currentPageId);
                  }
                }}
                aria-label={t('deletePage')}
              >
                {t('deletePage')}
              </button>
            </div>
          </div>
        )}

        {/* New Page Modal */}
        {newPageModalOpen && (
          <div className="modal-overlay" onClick={() => setNewPageModalOpen(false)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title"
            >
              <h2 id="modal-title">{t('createNewPage')}</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label htmlFor="page-slug">{t('slugLabel')}</label>
                  <input
                    id="page-slug"
                    type="text"
                    placeholder={t('slugPlaceholder')}
                    value={newPageData.slug}
                    onChange={(e) =>
                      setNewPageData({ ...newPageData, slug: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="page-title">{t('pageTitle')}</label>
                  <input
                    id="page-title"
                    type="text"
                    placeholder={t('titlePlaceholder')}
                    value={newPageData.title}
                    onChange={(e) =>
                      setNewPageData({ ...newPageData, title: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setNewPageModalOpen(false)}
                  aria-label={tCommon('cancel')}
                >
                  {tCommon('cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreatePage}
                  aria-label={t('createPage')}
                >
                  {t('createPage')}
                </button>
              </div>
            </div>
          </div>
        )}

        {tutorialUI}
      </main>
    </div>
  );
}
