import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4FB6A1",
};

export const metadata: Metadata = {
  title: "Rivryn - Mobile-first IDE for cleaner code",
  description: "Build applications with an AI-powered agent, diff-based edits, and automated quality gates.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Rivryn",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-bg text-textPrimary">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
