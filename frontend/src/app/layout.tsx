import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegistration from "../components/PWARegistration";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mohalla of Humans & Animals",
  description: "Mohalla of Humans & Animals (MOHA) PWA Grid Node.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "MOHA",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#D95D39",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
