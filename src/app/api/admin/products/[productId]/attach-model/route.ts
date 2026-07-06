import { NextRequest, NextResponse } from 'next/server';

/**
 * Attach 3D Model to Product
 * POST /api/admin/products/[productId]/attach-model
 *
 * Updates the product's model3d field via Payload CMS
 * Note: Payload CMS integration will be implemented when build-time
 * drizzle-kit issues are resolved. Currently returns mock response.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { glbUrl } = await req.json();
    const { productId } = await params;

    if (!glbUrl) {
      return NextResponse.json({ error: 'glbUrl required' }, { status: 400 });
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 });
    }

    // TODO: When Payload CMS can be imported without drizzle-kit build errors,
    // implement actual product update:
    // const payload = await getPayloadClient();
    // const updatedProduct = await (payload.update as any)({
    //   collection: 'products',
    //   id: productId,
    //   data: { model3d: glbUrl },
    // });

    // Return mock success response for now
    // In production, this will update the actual product record
    return NextResponse.json(
      {
        success: true,
        productId,
        glbUrl,
        message: 'Model attachment queued. Payload CMS integration pending.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Attach model error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
