import { notFound } from 'next/navigation';
import { getOrderById } from '@/lib/mockOrders';
import OrderConfirmationPage from '@/components/OrderConfirmationPage';

export default async function OrderConfirmationRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderConfirmationPage order={order} />;
}
