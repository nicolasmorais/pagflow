import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import PushInitializer from "@/app/components/PushInitializer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PagFlow Admin",
  description: "Dashboard Administrativo PagFlow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PagFlow",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${spaceGrotesk.variable} antialiased font-[family-name:var(--font-space-grotesk)]`}
      >
        <PushInitializer />
        {children}
      </body>
    </html>
  );
}
