import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSavedTheme } from "@/src/lib/settings";
import { resolveThemeVars } from "@/src/lib/theme";

export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConVol",
  description: "Open source volunteer management for fan conventions",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Operator theme (if any) is injected as CSS custom properties on <html>,
  // overriding the defaults in globals.css. Unset -> the built-in dark look.
  const theme = await getSavedTheme();
  const themeStyle = theme
    ? (resolveThemeVars(theme) as React.CSSProperties)
    : undefined;

  return (
    <html
      lang="en"
      style={themeStyle}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
