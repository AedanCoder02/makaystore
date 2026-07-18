import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Upload an image to FAL storage and return a public URL.
// FAL accepts the URL directly in generation requests.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const falKey = process.env.FAL_KEY;
  if (!falKey) return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 503 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Forward to FAL storage
    const falForm = new FormData();
    falForm.append('file', file);

    const uploadRes = await fetch('https://fal.ai/api/upload', {
      method: 'POST',
      headers: { Authorization: `Key ${falKey}` },
      body: falForm,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`FAL upload failed ${uploadRes.status}: ${err}`);
    }

    const data = await uploadRes.json();
    // FAL returns { url: "https://v3.fal.media/..." }
    const url = data.url ?? data.file_url;
    if (!url) throw new Error('FAL upload returned no URL');

    return NextResponse.json({ url });
  } catch (error) {
    console.error('[upload-image]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
