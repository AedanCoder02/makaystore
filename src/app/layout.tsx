import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html
        lang={locale}
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <StripeProvider>
              <NavBar />
              <LenisProvider>{children}</LenisProvider>
            </StripeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
