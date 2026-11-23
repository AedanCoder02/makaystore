import sql from '@/lib/db';

/**
 * Sales targets and cost % shared by admin reports, supervisor reports, the
 * seller dashboard and the emailed reports.
 *
 * Stored in report_settings. Older code wrote them as key/value rows in
 * theme_settings, which is also the Studio JSONB table (id, settings); those
 * legacy rows are still read as a fallback so existing targets carry over.
 */
export const REPORT_DEFAULTS = {
  daily_target: 357.14,
  weekly_target: 2500,
  monthly_target: 10000,
  cost_percentage: 40,
} as const;
export type ReportSettingKey = keyof typeof REPORT_DEFAULTS;
export type ReportSettings = Record<ReportSettingKey, number>;

const KEYS = Object.keys(REPORT_DEFAULTS) as ReportSettingKey[];

let ready: Promise<void> | null = null;
function ensureSchema(): Promise<void> {
  if (!ready) {
    ready = sql`
      CREATE TABLE IF NOT EXISTS report_settings (
        key        TEXT PRIMARY KEY,
        value      NUMERIC NOT NULL,
        updated_by TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `.then(() => undefined).catch(e => { ready = null; throw e; });
  }
  return ready;
}

export async function getReportSettings(): Promise<ReportSettings> {
  await ensureSchema();
  const out: ReportSettings = { ...REPORT_DEFAULTS };
  const legacy = await sql`SELECT key, value FROM theme_settings WHERE key IN ${sql(KEYS)}`.catch(() => []);
  const current = await sql`SELECT key, value FROM report_settings WHERE key IN ${sql(KEYS)}`;
  for (const r of [...legacy, ...current] as unknown as { key: ReportSettingKey; value: unknown }[]) {
    const n = Number(r.value);
    if (Number.isFinite(n)) out[r.key] = n;
  }
  return out;
}

export async function setReportSetting(key: ReportSettingKey, value: number, userId?: string): Promise<void> {
  await ensureSchema();
  await sql`
    INSERT INTO report_settings (key, value, updated_by, updated_at)
    VALUES (${key}, ${value}, ${userId ?? null}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()
  `;
}
