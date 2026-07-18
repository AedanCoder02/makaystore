import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fal } from '@fal-ai/client';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const falKey = process.env.FAL_KEY;
  if (!falKey) return NextResponse.json({ error: 'FAL_KEY not configured' }, { status: 503 });

  fal.config({ credentials: falKey });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const url = await fal.storage.upload(file);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[upload-image]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
