import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientProfile from '@/components/profile/ClientProfile';
import WorkerProfilePlaceholder from '@/components/profile/WorkerProfilePlaceholder';

export const metadata = { title: 'My Profile — Makay' };

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string) ?? 'customer';

  if (role === 'worker' || role === 'supervisor' || role === 'admin') {
    return <WorkerProfilePlaceholder role={role} />;
  }

  return <ClientProfile />;
}
