import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';
import StudioEditor from '@/components/StudioEditor';
import '@/styles/studio.css';
import '@/styles/theme-editor.css';
import '@/styles/marketing-editor.css';

export const metadata = { title: 'Storefront Studio — Admin' };
export const dynamic = 'force-dynamic';

export default async function StudioPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main" style={{ padding: 0, maxWidth: '100%', overflow: 'hidden' }}>
        <StudioEditor />
      </main>
    </div>
  );
}
