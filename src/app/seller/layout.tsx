import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import SellerSidebar from '@/components/seller/SellerSidebar';

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  const roles = (user?.publicMetadata?.roles as string[] | undefined) ?? [];
  const hasSeller = role === 'seller' || role === 'admin' || roles.includes('seller') || roles.includes('admin');
  if (!hasSeller) redirect('/');

  return (
    <div className="seller-layout">
      <SellerSidebar />
      <main className="seller-main">{children}</main>
    </div>
  );
}
