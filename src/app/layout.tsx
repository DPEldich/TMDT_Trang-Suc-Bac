import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import clsx from 'clsx';
import { CartProvider } from '../context/CartContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import '../styles/tokens.css';
import './globals.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-display',
});

const sans = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
});

const mono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-mono',
  preload: false,
});

export const metadata: Metadata = {
  title: 'NFA — Trang sức bạc',
  description:
    'Cửa hàng trang sức bạc NFA với các mẫu nhẫn, dây chuyền trơn, mặt dây chuyền, lắc tay và bông tai.',
  keywords: ['trang sức bạc', 'nhẫn bạc', 'dây chuyền bạc', 'lắc tay bạc', 'bông tai bạc', 'NFA'],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={clsx(display.variable, sans.variable, mono.variable)}>
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
