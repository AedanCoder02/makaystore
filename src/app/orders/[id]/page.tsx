import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OrderDetail from '@/components/orders/OrderDetail';

export const metadata = { title: 'Order Detail — Makay' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
