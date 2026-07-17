import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import MarketingEditor from '@/components/MarketingEditor';

export const metadata = { title: 'Marketing Editor — Admin' };
export const dynamic = 'force-dynamic';

export default async function MarketingEditorPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return <MarketingEditor />;
}
