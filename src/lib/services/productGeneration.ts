/**
 * Product Generation Service
 * Provider-agnostic abstraction for 3D model generation.
 *
 * Priority order (first configured wins):
 *   1. fal       — FAL.ai TRELLIS. Best quality. $0.02/model. Free credits on signup.
 *                  Sign up: fal.ai → Dashboard → API Keys
 *                  Set FAL_KEY in Vercel env.
 *   2. tripo3d   — Tripo3D API (tripo3d.ai). ~$0.04/model.
 *                  Set TRIPO3D_API_KEY in Vercel env.
 *   3. meshy     — Meshy API (meshy.ai). Free tier available.
 *                  Set MESHY_API_KEY in Vercel env.
 *   4. tripo-local — Open-source TripoSR on Railway. Free, lower quality.
 *                  Set TRIPO_LOCAL_URL in Vercel env.
 */

// ─────────────────────────────────────────────────────────────
// FAL.ai TRELLIS Provider  (https://fal.ai/models/fal-ai/trellis)
// State-of-the-art image-to-3D. $0.02/generation. Free credits on signup.
// Get API key: https://fal.ai → Dashboard → API Keys → Create Key
// Add to Vercel: FAL_KEY=your_key
// ─────────────────────────────────────────────────────────────
class FalTrellisProvider implements GenerationProvider {
  private apiKey: string;
  private base = 'https://queue.fal.run/fal-ai/trellis';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      'Authorization': `Key ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async generateFromImage(imageUrl: string, _productId: string) {
    const res = await fetch(this.base, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        image_url: imageUrl,
        texture_size: 1024,
        mesh_simplify: 0.95,
        ss_sampling_steps: 12,
        slat_sampling_steps: 12,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`FAL TRELLIS submit error ${res.status}: ${err}`);
    }

    const data = await res.json();
    return { requestId: data.request_id as string, status: 'pending' as const };
  }

  async getPredictionResult(requestId: string) {
    // Check status
    const statusRes = await fetch(`${this.base}/requests/${requestId}/status`, {
      headers: this.headers,
    });

    if (!statusRes.ok) {
      if (statusRes.status === 404) return { status: 'failed' as const, errorMessage: 'Request not found' };
      throw new Error(`FAL status error ${statusRes.status}`);
    }

    const statusData = await statusRes.json();
    const falStatus: string = statusData.status;

    if (falStatus === 'COMPLETED') {
      // Fetch result
      const resultRes = await fetch(`${this.base}/requests/${requestId}`, {
        headers: this.headers,
      });
      if (!resultRes.ok) throw new Error(`FAL result fetch error ${resultRes.status}`);
      const result = await resultRes.json();
      const glbUrl = result.data?.model_mesh?.url ?? result.model_mesh?.url;
      if (!glbUrl) throw new Error('FAL returned no GLB URL in result');
      return { status: 'completed' as const, progress: 100, outputUrl: glbUrl };
    }

    if (falStatus === 'FAILED') {
      return { status: 'failed' as const, errorMessage: statusData.error ?? 'Generation failed' };
    }

    const progress = falStatus === 'IN_PROGRESS' ? 50 : 10;
    return { status: 'processing' as const, progress };
  }
}

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
  const falKey      = process.env.FAL_KEY;
  const tripo3dKey  = process.env.TRIPO3D_API_KEY;
  const meshyKey    = process.env.MESHY_API_KEY;
  const tripoUrl    = process.env.TRIPO_LOCAL_URL;
  const explicit    = process.env.GENERATION_PROVIDER;

  // Explicit override
  if (explicit === 'fal'         && falKey)     return new FalTrellisProvider(falKey);
  if (explicit === 'tripo3d'     && tripo3dKey) return new Tripo3DProvider(tripo3dKey);
  if (explicit === 'meshy'       && meshyKey)   return new MeshyProvider(meshyKey);
  if (explicit === 'tripo-local' && tripoUrl)   return new TripoSRProvider(tripoUrl);

  // Auto-select: best quality first
  if (falKey)    return new FalTrellisProvider(falKey);
  if (tripo3dKey) return new Tripo3DProvider(tripo3dKey);
  if (meshyKey)   return new MeshyProvider(meshyKey);
  if (tripoUrl)   return new TripoSRProvider(tripoUrl);

  throw new Error(
    '3D generation not configured. ' +
    'Add FAL_KEY (fal.ai → best quality, $0.02/model, free credits on signup) ' +
    'or TRIPO_LOCAL_URL (Railway TripoSR fallback) to Vercel environment variables.'
  );
};

export const generateProductModel  = (imageUrl: string, productId: string) =>
  getGenerationProvider().generateFromImage(imageUrl, productId);

export const getPredictionStatus   = (requestId: string) =>
  getGenerationProvider().getPredictionResult(requestId);
