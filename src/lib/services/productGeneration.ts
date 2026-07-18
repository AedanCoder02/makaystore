/**
 * Product Generation Service
 * Provider-agnostic abstraction for 3D model generation.
 *
 * Priority order (first configured wins):
 *   1. tripo3d   — Tripo3D API (tripo3d.ai). Best quality. ~$0.04/model.
 *                  Set TRIPO3D_API_KEY in Vercel env.
 *   2. meshy     — Meshy API (meshy.ai). Excellent quality. Free tier available.
 *                  Set MESHY_API_KEY in Vercel env.
 *   3. tripo-local — Open-source TripoSR on Railway. Free, lower quality.
 *                  Set GENERATION_PROVIDER=tripo-local + TRIPO_LOCAL_URL.
 */

export interface GenerationProvider {
  generateFromImage(imageUrl: string, productId: string): Promise<{
    requestId: string;
    status: 'pending' | 'processing' | 'failed';
  }>;
  getPredictionResult(requestId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    outputUrl?: string;
    errorMessage?: string;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Tripo3D Provider  (https://platform.tripo3d.ai)
// Best quality for product photos. ~$0.04/model.
// Get API key: https://platform.tripo3d.ai → Settings → API Keys
// ─────────────────────────────────────────────────────────────
class Tripo3DProvider implements GenerationProvider {
  private apiKey: string;
  private base = 'https://platform.tripo3d.ai/api/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateFromImage(imageUrl: string, _productId: string) {
    const res = await fetch(`${this.base}/task`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'image_to_model',
        file: { type: 'jpg', url: imageUrl },
        model_version: 'v2.0-20240919',
        face_limit: 10000,
        texture: true,
        pbr: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Tripo3D generate error ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (data.code !== 0) throw new Error(`Tripo3D: ${data.message}`);
    return { requestId: data.data.task_id as string, status: 'pending' as const };
  }

  async getPredictionResult(requestId: string) {
    const res = await fetch(`${this.base}/task/${requestId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      if (res.status === 404) return { status: 'failed' as const, errorMessage: 'Task not found' };
      throw new Error(`Tripo3D poll error ${res.status}`);
    }

    const data = await res.json();
    if (data.code !== 0) throw new Error(`Tripo3D: ${data.message}`);
    const task = data.data;

    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      queued:     'pending',
      running:    'processing',
      success:    'completed',
      failed:     'failed',
      cancelled:  'failed',
    };

    return {
      status:       statusMap[task.status] ?? 'processing',
      progress:     task.progress ?? 0,
      outputUrl:    task.output?.pbr_model ?? task.output?.model ?? undefined,
      errorMessage: task.status === 'failed' ? (task.message ?? 'Generation failed') : undefined,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Meshy Provider  (https://meshy.ai)
// Excellent quality. Free tier: 200 credits/month (~40 models).
// Get API key: https://app.meshy.ai → Settings → API Keys
// ─────────────────────────────────────────────────────────────
class MeshyProvider implements GenerationProvider {
  private apiKey: string;
  private base = 'https://api.meshy.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateFromImage(imageUrl: string, _productId: string) {
    const res = await fetch(`${this.base}/v1/image-to-3d`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: imageUrl,
        enable_pbr: true,
        ai_model: 'meshy-4',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Meshy generate error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return { requestId: data.result as string, status: 'pending' as const };
  }

  async getPredictionResult(requestId: string) {
    const res = await fetch(`${this.base}/v1/image-to-3d/${requestId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      if (res.status === 404) return { status: 'failed' as const, errorMessage: 'Task not found' };
      throw new Error(`Meshy poll error ${res.status}`);
    }

    const data = await res.json();
    const statusMap: Record<string, 'pending' | 'processing' | 'completed' | 'failed'> = {
      PENDING:   'pending',
      IN_PROGRESS: 'processing',
      SUCCEEDED: 'completed',
      FAILED:    'failed',
      EXPIRED:   'failed',
    };

    return {
      status:       statusMap[data.status] ?? 'processing',
      progress:     data.progress ?? 0,
      outputUrl:    data.model_urls?.glb ?? undefined,
      errorMessage: data.status === 'FAILED' ? (data.task_error?.message ?? 'Generation failed') : undefined,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// TripoSR Local Provider  (Railway, open-source, lower quality)
// ─────────────────────────────────────────────────────────────
class TripoSRProvider implements GenerationProvider {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async generateFromImage(imageUrl: string, productId: string) {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    const formData = new FormData();
    formData.append('file', new Blob([buffer], { type: 'image/jpeg' }));
    formData.append('product_id', productId);

    const res = await fetch(`${this.baseUrl}/api/predictions`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`TripoSR API error: ${res.statusText}`);
    const data = await res.json() as any;
    return { requestId: (data.id || data.request_id) as string, status: 'pending' as const };
  }

  async getPredictionResult(requestId: string) {
    const res = await fetch(`${this.baseUrl}/api/predictions/${requestId}`);
    if (!res.ok) {
      if (res.status === 404) return { status: 'failed' as const, errorMessage: 'Job not found' };
      throw new Error(`TripoSR poll error: ${res.statusText}`);
    }
    const data = await res.json() as any;
    const statusMap: Record<string, 'pending'|'processing'|'completed'|'failed'> = {
      pending: 'pending', processing: 'processing', completed: 'completed', failed: 'failed',
    };
    return {
      status:       statusMap[data.status] ?? 'processing',
      progress:     data.progress ?? 0,
      outputUrl:    data.output?.glb_url ?? data.output_url ?? undefined,
      errorMessage: data.error_message,
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Factory — auto-selects best available provider
// ─────────────────────────────────────────────────────────────
export const getGenerationProvider = (): GenerationProvider => {
  const tripo3dKey  = process.env.TRIPO3D_API_KEY;
  const meshyKey    = process.env.MESHY_API_KEY;
  const tripoUrl    = process.env.TRIPO_LOCAL_URL;
  const explicit    = process.env.GENERATION_PROVIDER;

  // Explicit override
  if (explicit === 'tripo3d' && tripo3dKey) return new Tripo3DProvider(tripo3dKey);
  if (explicit === 'meshy'   && meshyKey)   return new MeshyProvider(meshyKey);
  if (explicit === 'tripo-local' && tripoUrl) return new TripoSRProvider(tripoUrl);

  // Auto-select: best quality first
  if (tripo3dKey) return new Tripo3DProvider(tripo3dKey);
  if (meshyKey)   return new MeshyProvider(meshyKey);
  if (tripoUrl)   return new TripoSRProvider(tripoUrl);

  throw new Error(
    '3D generation not configured. Add TRIPO3D_API_KEY (tripo3d.ai, best quality) ' +
    'or MESHY_API_KEY (meshy.ai, free tier) to Vercel environment variables.'
  );
};

export const generateProductModel  = (imageUrl: string, productId: string) =>
  getGenerationProvider().generateFromImage(imageUrl, productId);

export const getPredictionStatus   = (requestId: string) =>
  getGenerationProvider().getPredictionResult(requestId);
