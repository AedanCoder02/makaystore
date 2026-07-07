'use client';

import { useEditorStore } from '@/stores/editorStore';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import PagePreview from '@/components/PagePreview';
import NavBar from '@/components/NavBar';

export default function PublicPageRoute() {
  const params = useParams();
  const slug = params.slug as string;
  const { pages } = useEditorStore();

  const page = useMemo(
    () => pages.find((p) => p.slug === slug && p.status === 'published'),
    [pages, slug]
  );

  if (!page) {
    return (
      <div className="public-page-not-found">
        <NavBar />
        <main className="error-container">
          <h1>Página no encontrada</h1>
          <p>Lo sentimos, la página que buscas no existe o no está publicada.</p>
          <a href="/" className="btn btn-primary">
            Volver al inicio
          </a>
        </main>
      </div>
    );
  }

  return (
    <div className="public-page-layout">
      <NavBar />
      <PagePreview title={page.title} components={page.components} />
    </div>
  );
}
