import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Rivryn - Mobile-first IDE for cleaner code",
  description: "Build applications with an AI-powered agent, diff-based edits, and automated quality gates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-bg text-textPrimary`}>
        {children}
      </body>
    </html>
  );
}
