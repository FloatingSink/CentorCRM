import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

import { getLocale } from "@/lib/i18n/server";

// --font-inter, not --font-sans: globals.css now appends a CJK fallback stack
// onto --font-sans, and a `--font-sans: var(--font-sans), …` self-reference
// resolves to guaranteed-invalid. Matches how --font-geist-mono already
// feeds --font-mono.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CENTOR CRM",
  description: "Internal CRM for CENTOR Global",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Drives the real `lang` attribute, not just cosmetics: it's what tells the
  // browser to pick Simplified Chinese glyph forms out of the CJK fallback
  // font declared in globals.css.
  const locale = await getLocale();

  return (
    <html
      lang={locale === "zh" ? "zh-Hans" : "en"}
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
