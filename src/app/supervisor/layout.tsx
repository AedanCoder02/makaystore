import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import SupervisorSidebar from '@/components/SupervisorSidebar';

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const user = await currentUser();
  const role = user?.publicMetadata?.role as string | undefined;
  if (role !== 'supervisor' && role !== 'admin') redirect('/');

  return (
    <div className="supervisor-layout">
      <SupervisorSidebar />
      <main className="supervisor-main">{children}</main>
    </div>
  );
}
