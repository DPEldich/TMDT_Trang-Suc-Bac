import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import clsx from "clsx";
import "../styles/tokens.css";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-mono",
  preload: false,
});

export const metadata: Metadata = {
  title: "NFA | Trang sức bạc",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={clsx(display.variable, sans.variable, mono.variable)}>
      <body>{children}</body>
    </html>
  );
}
