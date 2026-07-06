import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import LenisProvider from "@/components/providers/LenisProvider";
import NavBar from "@/components/NavBar";
import StripeProvider from "@/components/StripeProvider";
import "./globals.css";
import "@/styles/cart.css";
import "@/styles/order-confirmation.css";
import "@/styles/tutorial.css";
import "@/styles/worker-activity.css";
import "@/styles/supervisor-dashboard.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="es"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <StripeProvider>
            <NavBar />
            <LenisProvider>{children}</LenisProvider>
          </StripeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
