import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CityProvider } from '@/context/CityContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'BlinkWear.in — Luxury Fashion Rental & Resale Marketplace',
  description:
    'Rent designer lehengas, sherwanis, tuxedos, and luxury gowns for weddings and celebrations in Bhopal, Pune, and across India. 100% sanitized, doorstep delivery & reverse pickup.',
  keywords: [
    'fashion rental India',
    'rent lehenga Bhopal',
    'rent sherwani Pune',
    'designer wedding wear rental',
    'luxury dress rental',
    'BlinkWear',
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://blinkwear.in'),
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'BlinkWear.in — Luxury Fashion Rental & Resale',
    description:
      'Rent iconic designer bridal wear, sherwanis, and luxury outfits. Delivered sanitized to your doorstep.',
    url: 'https://blinkwear.in',
    siteName: 'BlinkWear.in',
    locale: 'en_IN',
    type: 'website',
    images: [{ url: '/icon.png', width: 512, height: 512, alt: 'BlinkWear Logo' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-neutral-900 selection:bg-emerald-100 selection:text-emerald-900">
        <AuthProvider>
          <CityProvider>
            <CartProvider>
              <WishlistProvider>
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
              </WishlistProvider>
            </CartProvider>
          </CityProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
