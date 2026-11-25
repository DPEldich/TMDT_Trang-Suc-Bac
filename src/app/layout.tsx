import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { CartProvider } from '../context/CartContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import '../styles/tokens.css';
import './globals.css';

const sans = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
});

export const metadata: Metadata = {
  title: 'NFA — Trang sức',
  description:
    'Cửa hàng trang sức NFA với các mẫu nhẫn, dây chuyền, mặt dây chuyền, lắc tay, bông tai và lắc chân.',
  keywords: [
    'trang sức NFA',
    'trang sức',
    'nhẫn',
    'dây chuyền',
    'lắc tay',
    'bông tai',
    'lắc chân',
    'NFA',
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={clsx(sans.variable, mono.variable)}>
      <body>
        <CartProvider>
          <Header />
          <div className="pageWrapper">{children}</div>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
