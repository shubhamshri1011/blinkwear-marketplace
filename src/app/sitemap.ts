import type { MetadataRoute } from 'next';
import { createCatalogClient } from '@/lib/supabase/catalog';

const BASE_URL = 'https://blinkwear.in';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Core static public indexable routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/become-a-seller`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/rental-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/cancellation-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/refund-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/shipping-delivery`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/seller-terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms-and-conditions`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    const supabase = await createCatalogClient();

    // 1. Fetch active categories from Supabase
    const { data: categories } = await supabase
      .from('categories')
      .select('slug, created_at')
      .eq('is_active', true);

    const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: cat.created_at ? new Date(cat.created_at) : currentDate,
      changeFrequency: 'daily',
      priority: 0.85,
    }));

    // 2. Fetch active products from Supabase
    const { data: products } = await supabase
      .from('products')
      .select('id, updated_at, created_at')
      .eq('status', 'active');

    const productRoutes: MetadataRoute.Sitemap = (products || []).map((prod) => ({
      url: `${BASE_URL}/products/${prod.id}`,
      lastModified: prod.updated_at ? new Date(prod.updated_at) : currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.error('Error generating dynamic sitemap from Supabase:', error);
    // Return static routes as resilient fallback
    return staticRoutes;
  }
}
