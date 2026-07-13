import type { Metadata } from "next";
import { Playfair_Display, Montserrat } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { cookies } from "next/headers";
import LenisProvider from "@/components/providers/LenisProvider";
import NavBar from "@/components/NavBar";
import StripeProvider from "@/components/StripeProvider";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get('NEXT_LOCALE')?.value ?? 'en') as 'en' | 'es';
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      className={`${playfairDisplay.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <NavBar />
            <LenisProvider>{children}</LenisProvider>
          </NextIntlClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
