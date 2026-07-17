import { NextRequest, NextResponse } from 'next/server';
import { generateProductModel } from '@/lib/services/productGeneration';

const PROVIDER = process.env.GENERATION_PROVIDER || 'tripo-local';
const TRIPO_URL = process.env.TRIPO_LOCAL_URL || '';
const MUAPI_KEY = process.env.MUAPI_API_KEY || '';

function isProviderConfigured(): { ok: boolean; reason?: string } {
  if (PROVIDER === 'tripo-local') {
    if (!TRIPO_URL) return { ok: false, reason: 'TRIPO_LOCAL_URL environment variable is not set. Deploy the TripoSR server and add its URL to Vercel env vars.' };
  }
  if (PROVIDER === 'muapi') {
    if (!MUAPI_KEY) return { ok: false, reason: 'MUAPI_API_KEY environment variable is not set.' };
  }
  return { ok: true };
}

export async function POST(req: NextRequest) {
  const { ok, reason } = isProviderConfigured();
  if (!ok) {
    return NextResponse.json({ error: `3D generation not configured: ${reason}` }, { status: 503 });
  }

  try {
    const { productId, imageUrl } = await req.json();

    if (!productId || !imageUrl) {
      return NextResponse.json({ error: 'productId and imageUrl required' }, { status: 400 });
    }

    const result = await generateProductModel(imageUrl, productId);

    return NextResponse.json({
      requestId: result.requestId,
      status: result.status,
      estimatedTime: 180,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-3d]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
