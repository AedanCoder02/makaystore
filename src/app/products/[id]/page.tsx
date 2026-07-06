import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/mockData';
import ProductDetail from '@/components/ProductDetail';

type Params = Promise<{ id: string }>;

export default async function ProductPage(props: { params: Params }) {
  const { id } = await props.params;
  const product = getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} />;
}
