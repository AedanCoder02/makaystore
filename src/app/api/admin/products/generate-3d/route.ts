import { NextRequest, NextResponse } from 'next/server';
import { generateProductModel } from '@/lib/services/productGeneration';
import { useGenerationStore } from '@/stores/generationStore';

export async function POST(req: NextRequest) {
  try {
    const { productId, imageUrl } = await req.json();

    if (!productId || !imageUrl) {
      return NextResponse.json(
        { error: 'productId and imageUrl required' },
        { status: 400 }
      );
    }

    // Start generation
    const result = await generateProductModel(imageUrl, productId);

    // Store job in Zustand (for frontend polling)
    const store = useGenerationStore.getState();
    store.addJob({
      requestId: result.requestId,
      productId,
      status: result.status,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        requestId: result.requestId,
        status: result.status,
        estimatedTime: 60, // seconds
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
