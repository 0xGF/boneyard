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
          <span className="font-medium text-emerald-400">v1.7.3</span>
          Fix --cookie CLI flag with config file, consistent docs layout
          <span className="text-stone-500">&rarr;</span>
        </a>
        {/* Centered container for sidebar + content */}
        <div className="mx-auto max-w-[1320px] flex h-screen px-3">
          <Sidebar />
          <main className="flex-1 min-w-0 pt-4 md:pt-15 overflow-y-auto overflow-x-hidden flex flex-col">
            <div className="flex flex-1">{children}</div>
            <footer className="w-full max-w-[720px] px-6 pb-8 pt-12">
              <div className="border-t border-stone-200 pt-6 flex items-center justify-between text-[12px] text-[#a8a29e]">
                <span>boneyard</span>
                <div className="flex items-center gap-4">
                  <a href="https://github.com/0xGF/boneyard" target="_blank" rel="noopener noreferrer" className="hover:text-[#78716c] transition-colors">GitHub</a>
                  <a href="https://www.npmjs.com/package/boneyard-js" target="_blank" rel="noopener noreferrer" className="hover:text-[#78716c] transition-colors">npm</a>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
