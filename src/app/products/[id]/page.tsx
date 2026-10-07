import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductDetailView } from '@/components/product/ProductDetailView';
import type { PlatformSettings, ProductWithImages, SellerStorefront } from '@/types/database';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('title, description, brand, rent_price_per_day, sale_price, product_images (*)')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: 'Product Not Found — BlinkWear',
    };
  }

  const primaryImage = product.product_images?.[0]?.image_url;

  return {
    title: `${product.title} | BlinkWear Luxury Rental`,
    description:
      product.description ||
      `Rent ${product.title} by ${product.brand || 'designer'} on BlinkWear.in. 100% sanitized, free reverse pickup.`,
    openGraph: {
      title: product.title,
      description: product.description || undefined,
      images: primaryImage ? [{ url: primaryImage }] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch product with images and categories
  const { data: productData, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      category:categories!products_category_id_fkey (id, name, slug)
    `)
    .eq('id', id)
    .single();

  if (error || !productData) {
    notFound();
  }

  const product = productData as unknown as ProductWithImages;

  // Fetch platform settings for fees & charges
  const { data: settingsData } = await supabase
    .from('platform_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const platformSettings = settingsData as PlatformSettings | null;

  // Fetch public seller storefront if seller exists
  let sellerStorefront: SellerStorefront | null = null;
  if (product.seller_id) {
    try {
      const { data: sfData } = await supabase.rpc('get_seller_storefront', {
        p_seller_id: product.seller_id,
      });

      if (sfData && sfData.length > 0) {
        sellerStorefront = sfData[0];
      }
    } catch (err) {
      console.error('Error loading seller storefront:', err);
    }
  }

  return (
    <ProductDetailView
      product={product}
      sellerStorefront={sellerStorefront}
      platformSettings={platformSettings}
    />
  );
}
