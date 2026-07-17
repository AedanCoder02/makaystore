import { notFound } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';

type Params = Promise<{ id: string }>;

export default async function ProductPage(props: { params: Params }) {
  const { id } = await props.params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/api/products/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) notFound();

  const product = await res.json();

  return <ProductDetail product={product} />;
}
