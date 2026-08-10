import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWARegistration from "../components/PWARegistration";
import { AuthProvider } from "../context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
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
    { rel: "icon", url: "/icon.png", type: "image/png" },
    { rel: "shortcut icon", url: "/icon.png", type: "image/png" },
    { rel: "apple-touch-icon", url: "/icon.png", type: "image/png" },
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
    <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans">
        <PWARegistration />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
