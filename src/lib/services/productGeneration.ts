/**
 * Product Generation Service
 * Provider-agnostic abstraction for 3D model generation
 * Supports: TripoSR (free, local/Railway GPU) and MuAPI (production, paid)
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

/**
 * TripoSR Provider
 * Free, runs locally or on Railway GPU
 */
class TripoSRProvider implements GenerationProvider {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.TRIPO_LOCAL_URL || 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async generateFromImage(imageUrl: string, productId: string) {
    try {
      // Download image from imageUrl
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Prepare FormData
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }));
      formData.append('product_id', productId);

      // POST to TripoSR
      const response = await fetch(`${this.baseUrl}/api/predictions`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`TripoSR API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return {
        requestId: (data.id || data.request_id) as string,
        status: 'pending' as const,
      };
    } catch (error) {
      throw new Error(`TripoSR generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPredictionResult(requestId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/api/predictions/${requestId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            status: 'failed' as const,
            errorMessage: 'Generation job not found',
          };
        }
        throw new Error(`TripoSR API error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      // Map TripoSR status to our status
      const statusMap: { [key: string]: 'pending' | 'processing' | 'completed' | 'failed' } = {
        pending: 'pending',
        processing: 'processing',
        completed: 'completed',
        failed: 'failed',
      };

      return {
        status: statusMap[data.status] || 'processing',
        progress: data.progress || 0,
        outputUrl: data.output?.glb_url || data.output_url,
        errorMessage: data.error_message,
      };
    } catch (error) {
      throw new Error(`TripoSR status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * MuAPI Provider
 * Production-grade, paid service
 */
class MuAPIProvider implements GenerationProvider {
  private apiKey: string;
  private baseUrl = 'https://api.muapi.com/v1';

  constructor(apiKey: string = process.env.MUAPI_API_KEY || '') {
    if (!apiKey) {
      throw new Error('MUAPI_API_KEY not set in environment');
    }
    this.apiKey = apiKey;
  }

  async generateFromImage(imageUrl: string, productId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/predictions`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tripo-3d',
          input: {
            image: imageUrl,
          },
          metadata: {
            product_id: productId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`MuAPI error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;
      return {
        requestId: data.id as string,
        status: (data.status || 'pending') as 'pending' | 'processing' | 'failed',
      };
    } catch (error) {
      throw new Error(`MuAPI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPredictionResult(requestId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/predictions/${requestId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            status: 'failed' as const,
            errorMessage: 'Prediction not found',
          };
        }
        throw new Error(`MuAPI error: ${response.statusText}`);
      }

      const data = (await response.json()) as any;

      return {
        status: data.status,
        progress: data.progress || 0,
        outputUrl: data.output?.glb_url || data.output_url,
        errorMessage: data.error_message,
      };
    } catch (error) {
      throw new Error(`MuAPI status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Factory function to get the appropriate provider based on environment
 */
export const getGenerationProvider = (): GenerationProvider => {
  const provider = process.env.GENERATION_PROVIDER || 'tripo-local';

  if (provider === 'muapi') {
    return new MuAPIProvider();
  }
  return new TripoSRProvider();
};

/**
 * Main API: Start 3D model generation from image
 */
export const generateProductModel = async (imageUrl: string, productId: string) => {
  const provider = getGenerationProvider();
  return provider.generateFromImage(imageUrl, productId);
};

/**
 * Main API: Poll generation status
 */
export const getPredictionStatus = async (requestId: string) => {
  const provider = getGenerationProvider();
  return provider.getPredictionResult(requestId);
};
