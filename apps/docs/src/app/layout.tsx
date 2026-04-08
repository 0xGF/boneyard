import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";

import "./globals.css";
import BoneRegistryInit from "../bones/registry-client";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "boneyard - skeleton screens for your UI",
  description:
    "Pixel-perfect skeleton loading screens auto-extracted from your real DOM. Zero configuration, zero layout shift.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#fafaf9] text-[#1c1917] font-[family-name:var(--font-sans)] antialiased">
        <BoneRegistryInit />
        {/* Version banner */}
        <a href="/changelog" className="hidden md:flex items-center justify-center gap-1.5 w-full bg-stone-900 py-2 px-4 text-[12px] text-stone-300 hover:text-white transition-colors fixed top-0 left-0 right-0 z-50">
          <span className="font-medium text-emerald-400">v1.6.6</span>
          Angular adapter, watch mode, Nuxt &amp; Remix route scanning
          <span className="text-stone-500">&rarr;</span>
        </a>
        {/* Centered container for sidebar + content */}
        <div className="mx-auto max-w-[1320px] flex min-h-[100dvh] md:h-screen px-3">
          <Sidebar />
          <main className="flex-1 min-w-0 pt-16 md:pt-15 overflow-y-auto flex justify-center">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
