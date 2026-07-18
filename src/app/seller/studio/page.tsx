import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import StudioEditor from '@/components/StudioEditor';
import '@/styles/studio.css';
import '@/styles/theme-editor.css';
import '@/styles/marketing-editor.css';

export const metadata = { title: 'Storefront Studio — Makay' };
export const dynamic = 'force-dynamic';

export default async function SellerStudioPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div style={{ height: '100vh', overflow: 'hidden' }}>
      <StudioEditor />
    </div>
  );
}
