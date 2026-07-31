import type { Metadata, Viewport } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegistration from "../components/PWARegistration";
import { AuthProvider } from "../context/AuthContext";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aumoha - Rescue, Protect & Care",
  description: "Aumoha Animal Welfare & Community Rescue Network.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/logo.png", type: "image/png" },
    { rel: "shortcut icon", url: "/logo.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/logo.png", type: "image/png" },
  ],
  appleWebApp: {
    capable: true,
    title: "Aumoha",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#C85341",
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
    <html lang="en" className={`${outfit.variable} ${geistMono.variable}`}>
      <body>
        <PWARegistration />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
