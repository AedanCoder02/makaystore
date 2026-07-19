import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminEvents from '@/components/events/AdminEvents';
export const metadata = { title: 'Events — Admin' };
export default async function AdminEventsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <AdminEvents />;
}
