import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import ClientProfile from '@/components/profile/ClientProfile';
import SellerProfile from '@/components/profile/SellerProfile';
import SupervisorProfile from '@/components/profile/SupervisorProfile';
import AdminProfile from '@/components/profile/AdminProfile';

export const metadata = { title: 'My Profile — Makay' };

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string) ?? 'customer';

  if (role === 'seller' || role === 'worker') return <SellerProfile />;
  if (role === 'supervisor') return <SupervisorProfile />;
  if (role === 'admin') return <AdminProfile />;

  return <ClientProfile />;
}
