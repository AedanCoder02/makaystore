import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

  // Only allow proxying from our known TripoSR Railway domain
  if (!url.startsWith('https://makay-tripo-server-production.up.railway.app/')) {
    return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: upstream.status });
    }

    const buffer = await upstream.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('3d-proxy error:', err);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
  }
}
