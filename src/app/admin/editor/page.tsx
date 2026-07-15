import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import sql from '@/lib/db';
import ThemeEditor from '@/components/ThemeEditor';
import '@/styles/theme-editor.css';

export const metadata = { title: 'Theme Editor — Admin' };
export const dynamic = 'force-dynamic';

export default async function ThemeEditorPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  let themeSettings: Record<string, string> = {};
  try {
    const rows = await sql`SELECT settings FROM theme_settings WHERE id = 1`;
    themeSettings = (rows[0]?.settings as Record<string, string>) ?? {};
  } catch {}

  let productOverrides: Record<string, string> = {};
  try {
    const rows = await sql`SELECT product_id, image_url FROM product_overrides WHERE image_url IS NOT NULL AND image_url != ''`;
    productOverrides = Object.fromEntries(
      rows.map((r: any) => [r.product_id as string, r.image_url as string])
    );
  } catch {}

  return (
    <ThemeEditor
      initialSettings={themeSettings}
      productOverrides={productOverrides}
    />
  );
}
