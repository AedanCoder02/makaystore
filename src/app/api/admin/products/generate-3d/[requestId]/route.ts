import { NextRequest, NextResponse } from 'next/server';
import { getPredictionStatus } from '@/lib/services/productGeneration';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const result = await getPredictionStatus(requestId);

    return NextResponse.json({
      requestId,
      status: result.status,
      progress: result.progress ?? 0,
      glbUrl: result.outputUrl ?? null,
      errorMessage: result.errorMessage ?? null,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
