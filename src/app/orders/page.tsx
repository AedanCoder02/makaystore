import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CustomerOrders from '@/components/orders/CustomerOrders';

export const metadata = { title: 'My Orders — Makay' };

export default async function OrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  return <CustomerOrders />;
}
