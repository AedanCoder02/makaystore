'use client';

import { useEffect } from 'react';
import { useTutorialStore } from '@/stores/tutorialStore';
import { useTutorialOverlay } from '@/hooks/useTutorialOverlay';
import AdminNavCard from './AdminNavCard';
import AdminSidebar from './AdminSidebar';

const NAV_ITEMS = [
  {
    icon: '📦',
    title: 'Productos',
    description: 'Gestionar catálogo, inventario y modelos 3D',
    href: '/admin/products',
  },
  {
    icon: '🛒',
    title: 'Pedidos',
    description: 'Ver y gestionar pedidos de clientes',
    href: '/admin/orders',
  },
  {
    icon: '👥',
    title: 'Trabajadores',
    description: 'Gestionar equipo de trabajo y actividad',
    href: '/admin/workers',
  },
  {
    icon: '📈',
    title: 'Reportes',
    description: 'Ventas, análisis y métricas de rendimiento',
    href: '/admin/reports',
  },
  {
    icon: '⚙️',
    title: 'Configuración',
    description: 'Configuración de la tienda y preferencias',
    href: '/admin/settings',
  },
];

export default function AdminDashboard() {
  const tutorialStore = useTutorialStore();
  const tutorialUI = useTutorialOverlay('admin-tour');
  const completed = tutorialStore.completed;

  useEffect(() => {
    if (!completed.has('admin-tour')) {
      tutorialStore.showTutorial('admin-tour');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="admin-layout">
      <AdminSidebar />

      <main className="admin-main">
        <div className="dashboard-header">
          <h1>Panel de Administración</h1>
          <button
            className="help-button"
            onClick={() => tutorialStore.showTutorial('admin-tour')}
            aria-label="Mostrar tutorial"
            title="Ayuda"
          >
            ?
          </button>
        </div>

        <p className="dashboard-welcome">
          Selecciona una sección para comenzar.
        </p>

        <div className="dashboard-grid">
          {NAV_ITEMS.map((item) => (
            <AdminNavCard
              key={item.href}
              icon={item.icon}
              title={item.title}
              description={item.description}
              href={item.href}
            />
          ))}
        </div>

        {tutorialUI}
      </main>
    </div>
  );
}
