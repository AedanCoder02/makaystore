import sql from '@/lib/db';

export type SiteSettings = Record<string, string>;

/**
 * Reads the Studio settings blob (theme_settings.settings, id = 1).
 * Handles two legacy corruptions: the blob stored as a JSON string, and a
 * string spread into a char-index object.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const rows = await sql`SELECT settings FROM theme_settings WHERE id = 1`;
    let settings: unknown = rows[0]?.settings ?? {};
    if (typeof settings === 'string') {
      try { settings = JSON.parse(settings); } catch { settings = {}; }
    }
    if (!settings || typeof settings !== 'object' || '0' in (settings as object)) return {};
    return settings as SiteSettings;
  } catch {
    return {};
  }
}
