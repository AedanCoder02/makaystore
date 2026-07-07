'use client';

import { useEffect, useState } from 'react';
import { useEditorStore, ComponentType } from '@/stores/editorStore';
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
    if (!completed.has('editor-tour')) {
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
      alert('Por favor completa todos los campos');
      return;
    }

    createPage(newPageData.slug, newPageData.title);
    setNewPageData({ slug: '', title: '' });
    setNewPageModalOpen(false);
  };

  const handlePublish = () => {
    if (!currentPageId) return;

    if (currentPage?.components.length === 0) {
      alert('La página debe tener al menos un componente');
      return;
    }

    saveVersion(currentPageId);
    publishPage(currentPageId);
    alert('¡Página publicada exitosamente!');
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="editor-header">
          <div className="editor-title-section">
            <h1>Editor de Marketing</h1>
            <p className="editor-subtitle">Crea páginas promocionales sin código</p>
          </div>
          <div className="editor-actions">
            <button
              className="btn btn-primary"
              onClick={() => setPreviewMode(!previewMode)}
              aria-label={previewMode ? 'Ver editor' : 'Ver vista previa'}
            >
              {previewMode ? '📐 Editor' : '👁️ Previsualizar'}
            </button>
            {currentPage && (
              <button
                className="btn btn-success"
                onClick={handlePublish}
                disabled={currentPage.status === 'published'}
                aria-label="Publicar página"
              >
                {currentPage.status === 'published'
                  ? '✓ Publicada'
                  : '🚀 Publicar'}
              </button>
            )}
            <button
              className="help-button"
              onClick={() => tutorialStore.showTutorial('editor-tour')}
              aria-label="Mostrar tutorial"
              title="Ayuda"
            >
              ?
            </button>
          </div>
        </div>

        {!currentPage ? (
          <div className="editor-empty">
            <div className="empty-state">
              <h2>No hay página seleccionada</h2>
              <p>Crea una nueva página o selecciona una existente</p>

              <div className="pages-list">
                <h3>Páginas Existentes</h3>
                {pages.length === 0 ? (
                  <p className="no-pages">No hay páginas aún</p>
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
                          <span>{page.components.length} componentes</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary"
                onClick={() => setNewPageModalOpen(true)}
                aria-label="Crear nueva página"
              >
                + Nueva Página
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
                      <label>Nombre de la Página</label>
                      <input
                        type="text"
                        value={currentPage.title}
                        onChange={(e) =>
                          currentPageId && updatePageTitle(currentPageId, e.target.value)
                        }
                        placeholder="Nombre de la página"
                        className="page-title-input"
                      />
                    </div>
                    <div className="page-info-group">
                      <label>URL Slug</label>
                      <input
                        type="text"
                        value={currentPage.slug}
                        disabled
                        className="page-slug-input"
                      />
                    </div>
                    <div className="page-info-group">
                      <label>Estado</label>
                      <span className="page-status-badge">
                        {currentPage.status === 'published'
                          ? '🟢 Publicada'
                          : '🟡 Borrador'}
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
                {currentPage.components.length} componentes
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => loadPage('')}
                aria-label="Volver a la lista de páginas"
              >
                ← Volver
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (currentPageId && confirm('¿Eliminar esta página?')) {
                    deletePage(currentPageId);
                  }
                }}
                aria-label="Eliminar página"
              >
                Eliminar Página
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
              <h2 id="modal-title">Crear Nueva Página</h2>
              <div className="modal-form">
                <div className="form-group">
                  <label htmlFor="page-slug">Slug (URL)</label>
                  <input
                    id="page-slug"
                    type="text"
                    placeholder="ej: promocion-verano"
                    value={newPageData.slug}
                    onChange={(e) =>
                      setNewPageData({ ...newPageData, slug: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="page-title">Título de la Página</label>
                  <input
                    id="page-title"
                    type="text"
                    placeholder="ej: Promoción de Verano"
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
                  aria-label="Cancelar"
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreatePage}
                  aria-label="Crear página"
                >
                  Crear Página
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
