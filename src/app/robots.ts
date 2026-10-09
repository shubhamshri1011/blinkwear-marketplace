import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const BASE_URL = 'https://blinkwear.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/products',
          '/products/*',
          '/category/*',
          '/about',
          '/contact',
          '/faq',
          '/become-a-seller',
          '/rental-policy',
          '/cancellation-policy',
          '/refund-policy',
          '/shipping-delivery',
          '/seller-terms',
          '/terms-and-conditions',
          '/privacy-policy',
        ],
        disallow: [
          '/cart',
          '/checkout',
          '/checkout/*',
          '/login',
          '/register',
          '/profile',
          '/profile/*',
          '/addresses',
          '/addresses/*',
          '/orders',
          '/orders/*',
          '/rentals',
          '/rentals/*',
          '/seller/dashboard',
          '/seller/dashboard/*',
          '/seller/products',
          '/seller/products/*',
          '/seller/orders',
          '/seller/rentals',
          '/wishlist',
          '/api/*',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/icon.png', '/*'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
