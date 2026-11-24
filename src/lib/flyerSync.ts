import sql from '@/lib/db';
import { ensureEventsSchema, normalizeImageUrl } from '@/lib/events';

/**
 * Imports event flyers from the Guacuco Google Drive folder into `events`.
 * Ported from the La Marina app (src/lib/flyerSync.ts there), but writes to
 * the regular events table so imported flyers get the listing, detail page,
 * admin editor and ticketing. Each Drive file is imported once
 * (`events.drive_file_id` is unique); later edits in the admin are kept.
 *
 * The folder must be shared "Anyone with the link": the Drive API is called
 * with an API key, and the flyer is shown through its public lh3 URL.
 */
export const GUACUCO_DRIVE_FOLDER_ID = '1blp5XREGYl5H0PyGA7fpziGEdyUSh2ni';
export const DEFAULT_CAPACITY = 150;
export const FLYER_LOCATION = 'Makay Beach Club, Playa Guacuco';
// Margarita is UTC-4 all year (no daylight saving).
const VENEZUELA_OFFSET = '-04:00';
const DEFAULT_START = '12:00';

export interface ExtractedFlyer {
  title: string;
  description: string;
  event_date: string | null; // YYYY-MM-DD
  start_time: string | null; // HH:MM, 24 h
  event_time: string | null; // as printed, e.g. "12:00 PM - 8:00 PM"
  price: number | null;
  capacity: number | null;
  prizes: string | null;
}

const EXTRACTION_PROMPT = `You are writing event copy for Makay Beach Club, a beach club at Playa Guacuco on Isla de Margarita, Venezuela. Read the attached flyer image and respond with ONLY a JSON object (no markdown fences, no commentary) with these exact fields:

{
  "title": "short event name, 2-6 words, from the flyer",
  "description": "2-3 short sentences in Spanish, written with real marketing psychology (urgency, social proof, or exclusivity, whichever fits the flyer's actual content; don't fabricate promotions or guest lists that aren't on the flyer), punchy and quick to read since the real call-to-action is a button below it",
  "event_date": "YYYY-MM-DD if a specific date is shown on the flyer, otherwise null",
  "start_time": "the start time in 24-hour HH:MM if shown on the flyer, otherwise null",
  "event_time": "the time or time range shown on the flyer as plain text (e.g. '12:00 PM - 8:00 PM'), otherwise null",
  "price": "a number if a price/cover charge is shown, otherwise null",
  "capacity": "a number if a seat/guest limit is shown, otherwise null",
  "prizes": "a short line describing any prizes/contest rewards shown on the flyer, otherwise null"
}

Only extract what's actually visible on the flyer. Never invent a date, time, price, capacity, or prize that isn't shown; use null instead.`;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v
    : typeof v === 'string' && /\d/.test(v) ? Number(v.replace(/[^\d.]/g, '')) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== 'null' ? v.trim() : null;
}

/** Validates the model's JSON; anything malformed becomes null rather than a guess. */
export function parseExtraction(raw: unknown): ExtractedFlyer {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const title = str(o.title);
  if (!title) throw new Error('No title found on flyer');
  const date = str(o.event_date);
  const start = str(o.start_time);
  return {
    title: title.slice(0, 200),
    description: str(o.description) ?? '',
    event_date: date && DATE.test(date) ? date : null,
    start_time: start && TIME.test(start) ? start.padStart(5, '0') : null,
    event_time: str(o.event_time),
    price: num(o.price),
    capacity: num(o.capacity),
    prizes: str(o.prizes),
  };
}

/** Flyer date and start time as a Venezuela-time timestamp, or null when the flyer shows no date. */
export function flyerTimestamp(date: string | null, startTime: string | null): string | null {
  if (!date) return null;
  return `${date}T${startTime ?? DEFAULT_START}:00${VENEZUELA_OFFSET}`;
}

/** Extra details for the event page: printed time range and prizes. */
export function flyerContent(f: Pick<ExtractedFlyer, 'event_time' | 'prizes'>): string {
  return [f.event_time && `Horario: ${f.event_time}`, f.prizes && `Premios: ${f.prizes}`]
    .filter(Boolean)
    .join('\n\n');
}

interface DriveFile { id: string; name: string; mimeType: string }

function driveKey(): string {
  const k = process.env.GOOGLE_DRIVE_API_KEY;
  if (!k) throw new Error('GOOGLE_DRIVE_API_KEY is not set');
  return k;
}

async function listDriveImages(): Promise<DriveFile[]> {
  const q = encodeURIComponent(`'${GUACUCO_DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=200&key=${driveKey()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Drive list failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.files ?? [];
}

async function downloadDriveImage(fileId: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${driveKey()}`);
  if (!res.ok) throw new Error(`Drive download failed for ${fileId}: ${res.status}`);
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
  return { base64: Buffer.from(await res.arrayBuffer()).toString('base64'), mimeType };
}

async function extractFlyerData(base64: string, mimeType: string): Promise<ExtractedFlyer> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: EXTRACTION_PROMPT }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini extraction failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no content');
  return parseExtraction(JSON.parse(text));
}

let columnReady: Promise<void> | null = null;
function ensureDriveColumn(): Promise<void> {
  if (!columnReady) {
    columnReady = (async () => {
      await ensureEventsSchema();
      await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS drive_file_id TEXT`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS events_drive_file_id_key ON events (drive_file_id)`;
    })().catch(e => { columnReady = null; throw e; });
  }
  return columnReady;
}

/** Imports every image in the folder that has not been imported yet. */
export async function syncFlyers(): Promise<{ synced: number; skipped: number; errors: string[] }> {
  await ensureDriveColumn();

  const files = await listDriveImages();
  const existing = await sql<{ drive_file_id: string }[]>`SELECT drive_file_id FROM events WHERE drive_file_id IS NOT NULL`;
  const known = new Set(existing.map(r => r.drive_file_id));

  let synced = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const file of files) {
    if (known.has(file.id)) { skipped++; continue; }
    try {
      const { base64, mimeType } = await downloadDriveImage(file.id);
      const f = await extractFlyerData(base64, mimeType);
      const image = normalizeImageUrl(`https://drive.google.com/file/d/${file.id}/view`);
      const rows = await sql`
        INSERT INTO events (title, description, content, event_date, location, image_url, price, capacity, status, drive_file_id)
        VALUES (
          ${f.title}, ${f.description}, ${flyerContent(f)}, ${flyerTimestamp(f.event_date, f.start_time)},
          ${FLYER_LOCATION}, ${image}, ${f.price ?? 0}, ${f.capacity ?? DEFAULT_CAPACITY}, 'active', ${file.id}
        )
        ON CONFLICT (drive_file_id) DO NOTHING
        RETURNING id
      `;
      if (rows.length) synced++; else skipped++;
    } catch (err) {
      errors.push(`${file.name} (${file.id}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { synced, skipped, errors };
}
