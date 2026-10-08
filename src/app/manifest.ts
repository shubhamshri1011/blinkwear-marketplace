import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BlinkWear — Luxury Fashion Rental & Resale',
    short_name: 'BlinkWear',
    description:
      'Rent authentic designer bridal lehengas, sherwanis, tuxedos, and luxury gowns in Bhopal, Pune, and across India. 100% sanitized, doorstep delivery & reverse pickup.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#059669',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
