import { currentUser } from '@clerk/nextjs/server';
import AdminEvents from '@/components/events/AdminEvents';
import SellerEventsList from '@/components/events/SellerEventsList';

export const metadata = { title: 'Events — Makay' };
export const dynamic = 'force-dynamic';

// Staff with the "events" permission (or admins) get the full editor;
// everyone else in the seller panel sees the shareable list.
export default async function SellerEventsPage() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const permissions = (user?.publicMetadata?.permissions as string[] | undefined) ?? [];
  const canEdit = role === 'admin' || permissions.includes('events');
  return canEdit ? <AdminEvents embedded /> : <SellerEventsList />;
}
