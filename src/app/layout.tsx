import type { Metadata, Viewport } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import LenisProvider from "@/components/providers/LenisProvider";
import MarketingApplier from "@/components/providers/MarketingApplier";
import NavBar from "@/components/NavBar";
import StripeProvider from "@/components/StripeProvider";
import { getSiteSettings, type SiteSettings } from "@/lib/siteSettings";
import SiteContentProvider from "@/components/providers/SiteContentProvider";
import "./globals.css";
import "@/styles/cart.css";
import "@/styles/order-confirmation.css";
import "@/styles/tutorial.css";
import "@/styles/worker-activity.css";
import "@/styles/supervisor-dashboard.css";
import "@/styles/product-generation.css";
import "@/styles/admin-dashboard.css";
import "@/styles/admin-reports.css";
import "@/styles/admin-rotation.css";
import "@/styles/marketing-editor.css";
import "@/styles/featured-collection.css";
import "@/styles/why-makay.css";
import "@/styles/testimonials.css";
import "@/styles/how-it-works.css";
import "@/styles/categories.css";
import "@/styles/newsletter.css";
import "@/styles/footer.css";
import "@/styles/profile.css";
import "@/styles/member.css";
import "@/styles/seller.css";
import "@/styles/location-switcher.css";
import "@/styles/theme-editor.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Makay Store",
  description: "Makay - Tu refugio de conexión",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Only allow CSS custom property names (--makay-*) and safe value chars
const SAFE_VAR_NAME = /^--makay-[a-z-]+$/;
const SAFE_VAR_VALUE = /^[a-zA-Z0-9#(),%. /-]+$/;

function themeVarsCss(s: SiteSettings): string {
  const vars = Object.entries(s)
    .filter(([k, v]) => SAFE_VAR_NAME.test(k) && SAFE_VAR_VALUE.test(String(v)))
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return vars ? `:root{${vars}}` : '';
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale: 'en' | 'es' = cookieStore.get('NEXT_LOCALE')?.value === 'es' ? 'es' : 'en';
  const messages = await getMessages({ locale });
  const siteSettings = await getSiteSettings();
  const themeVars = themeVarsCss(siteSettings);

  return (
    <html
      lang={locale}
      className={`${playfairDisplay.variable} ${montserrat.variable} antialiased`}
    >
      {themeVars && <style dangerouslySetInnerHTML={{ __html: themeVars }} />}
      <body className="min-h-screen">
        <ClerkProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SiteContentProvider initial={siteSettings} locale={locale}>
              <MarketingApplier />
              <NavBar />
              <LenisProvider>{children}</LenisProvider>
            </SiteContentProvider>
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
