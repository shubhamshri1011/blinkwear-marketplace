import type { Metadata, Viewport } from 'next';
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#059669',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://blinkwear.in'),
  title: {
    default: 'BlinkWear — Rent Lehenga, Sherwani & Designer Wear | Bhopal',
    template: '%s | BlinkWear.in',
  },
  description:
    'BlinkWear.in — India\'s #1 fashion rental marketplace. Rent bridal lehengas, groom sherwanis, tuxedos, and gowns in Bhopal. 100% sanitized, doorstep delivery & free return pickup. From ₹499/day.',
  keywords: [
    'BlinkWear',
    'Blink Wear',
    'blinkwear.in',
    'rental lehenga',
    'lehenga on rent',
    'lehenga rent Bhopal',
    'rental lehenga Bhopal',
    'bridal lehenga rental',
    'lehenga rental near me',
    'sherwani on rent',
    'sherwani rental Bhopal',
    'designer dress rental India',
    'fashion rental India',
    'wedding outfit rental',
    'gown on rent',
    'tuxedo rental India',
    'occasion wear rental',
    'designer bridal wear rental',
    'luxury fashion rental',
    'pre-loved designer wear',
    'sustainable fashion India',
    'rent ethnic wear',
    'lehenga choli on rent',
  ],
  alternates: {
    canonical: 'https://blinkwear.in',
    languages: {
      'en-IN': 'https://blinkwear.in',
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: 'BlinkWear — Rent Lehenga, Sherwani & Designer Wear',
    description:
      'Rent bridal lehengas, groom sherwanis, tuxedos & luxury gowns in Bhopal. 100% sanitized, doorstep delivery, free return pickup. From ₹499/day.',
    url: 'https://blinkwear.in',
    siteName: 'BlinkWear.in',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'BlinkWear — Luxury Fashion Rental India',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlinkWear — Rent Lehenga, Sherwani & Designer Wear',
    description:
      'Rent iconic designer bridal lehengas, sherwanis & luxury outfits. Doorstep delivery in Bhopal. From ₹499/day.',
    images: ['/icon.png'],
    site: '@blinkwear_in',
    creator: '@blinkwear_in',
  },
  category: 'fashion',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    'geo.region': 'IN-MP',
    'geo.placename': 'Bhopal',
    'geo.position': '23.2599;77.4126',
    'ICBM': '23.2599, 77.4126',
    'og:locale:alternate': 'hi_IN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN" className={`${outfit.variable} h-full antialiased`}>
      <head>
        {/* Preconnect to critical third-party origins for LCP performance */}
        <link rel="preconnect" href="https://xdxvingqvhyjmupvvxjo.supabase.co" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
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
