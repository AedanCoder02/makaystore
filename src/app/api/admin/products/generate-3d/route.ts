import { NextRequest, NextResponse } from 'next/server';
import { generateProductModel, getGenerationProvider } from '@/lib/services/productGeneration';

export async function GET() {
  try {
    getGenerationProvider(); // throws if nothing configured
    const provider =
      process.env.FAL_KEY         ? 'fal-trellis' :
      process.env.TRIPO3D_API_KEY ? 'tripo3d'     :
      process.env.MESHY_API_KEY   ? 'meshy'        :
      process.env.TRIPO_LOCAL_URL ? 'tripo-local'  : 'none';
    return NextResponse.json({ configured: true, provider });
  } catch (e) {
    return NextResponse.json({ configured: false, error: (e as Error).message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    getGenerationProvider(); // throws with clear message if nothing configured
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 503 });
  }

  try {
    const { productId, imageUrl } = await req.json();
    if (!productId || !imageUrl) {
      return NextResponse.json({ error: 'productId and imageUrl required' }, { status: 400 });
    }
    const result = await generateProductModel(imageUrl, productId);
    return NextResponse.json({ requestId: result.requestId, status: result.status, estimatedTime: 60 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-3d]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
