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
    default: 'BlinkWear — Rent Lehenga, Sherwani & Designer Wear | Pune & Bhopal',
    template: '%s | BlinkWear.in',
  },
  description:
    'BlinkWear.in — Clean, fast-delivery fashion rental & resale platform in Pune and Bhopal. Rent bridal lehengas, groom sherwanis, tuxedos, and gowns. 100% sanitized, doorstep delivery & free return pickup.',
  keywords: [
    'BlinkWear',
    'Blink Wear',
    'blinkwear.in',
    'rental lehenga',
    'lehenga on rent',
    'lehenga rent Bhopal',
    'rental lehenga Bhopal',
    'rental lehenga Pune',
    'bridal lehenga rental',
    'lehenga rental near me',
    'sherwani on rent',
    'sherwani rental Bhopal',
    'sherwani rental Pune',
    'designer dress rental Pune',
    'designer dress rental Bhopal',
    'wedding outfit rental',
    'gown on rent',
    'occasion wear rental',
    'designer bridal wear rental',
    'luxury fashion rental Pune',
    'luxury fashion rental Bhopal',
    'pre-loved designer wear',
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
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'BlinkWear — Rent Lehenga, Sherwani & Designer Wear | Pune & Bhopal',
    description:
      'Rent bridal lehengas, groom sherwanis, tuxedos & luxury gowns in Pune and Bhopal. 100% sanitized, doorstep delivery, free return pickup.',
    url: 'https://blinkwear.in',
    siteName: 'BlinkWear.in',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'BlinkWear — Luxury Fashion Rental Pune & Bhopal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlinkWear — Rent Lehenga, Sherwani & Designer Wear | Pune & Bhopal',
    description:
      'Rent iconic designer bridal lehengas, sherwanis & luxury outfits. Doorstep delivery in Pune and Bhopal.',
    images: ['/icon.png'],
    site: '@blinkwear_in',
    creator: '@blinkwear_in',
  },
  category: 'fashion',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  other: {
    'geo.region': 'IN-MH, IN-MP',
    'geo.placename': 'Pune, Bhopal',
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-48.png" type="image/png" sizes="48x48" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
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
