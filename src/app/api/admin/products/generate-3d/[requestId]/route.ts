import { NextRequest, NextResponse } from 'next/server';
import { getPredictionStatus } from '@/lib/services/productGeneration';
import { useGenerationStore } from '@/stores/generationStore';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;

    // Poll status from provider
    const result = await getPredictionStatus(requestId);

    // Update job in store
    const store = useGenerationStore.getState();
    store.updateJob(requestId, {
      status: result.status,
      progress: result.progress || 0,
      glbUrl: result.outputUrl,
      errorMessage: result.errorMessage,
    });

    return NextResponse.json(
      {
        requestId,
        status: result.status,
        progress: result.progress,
        glbUrl: result.outputUrl,
        errorMessage: result.errorMessage,
        estimatedTime: result.status === 'completed' ? 0 : 30,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
