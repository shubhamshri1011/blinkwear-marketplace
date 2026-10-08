import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductDetailView } from '@/components/product/ProductDetailView';
import { JsonLd } from '@/components/seo/JsonLd';
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
  const title = `${product.title}${product.brand ? ` by ${product.brand}` : ''} | BlinkWear Luxury Rental`;
  const description =
    product.description ||
    `Rent ${product.title} by ${product.brand || 'designer'} on BlinkWear.in. 100% sanitized, doorstep delivery & reverse pickup.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://blinkwear.in/products/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://blinkwear.in/products/${id}`,
      type: 'website',
      images: primaryImage
        ? [{ url: primaryImage, width: 800, height: 1067, alt: product.title }]
        : [{ url: '/icon.png', width: 512, height: 512, alt: 'BlinkWear' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryImage ? [primaryImage] : ['/icon.png'],
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
      id, seller_id, category_id, subcategory_id, title, description, brand,
      size, color, condition, listing_type, sale_price, discount_price,
      rent_price_per_day, security_deposit, delivery_charge, city, status,
      view_count, stock_quantity, min_rental_days, max_rental_days,
      search_tags, video_url, featured, created_at, updated_at,
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

  // Schema.org Product Schema
  const images = (product.product_images || []).map((img) => img.image_url);
  const primaryImg = images[0] || 'https://blinkwear.in/icon.png';
  const offerPrice = product.rent_price_per_day || product.sale_price || 0;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `Rent ${product.title} on BlinkWear.in`,
    image: images.length > 0 ? images : [primaryImg],
    brand: {
      '@type': 'Brand',
      name: product.brand || 'Designer',
    },
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: `https://blinkwear.in/products/${product.id}`,
      priceCurrency: 'INR',
      price: offerPrice,
      availability:
        product.status === 'active'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition:
        product.condition === 'new'
          ? 'https://schema.org/NewCondition'
          : 'https://schema.org/UsedCondition',
    },
  };

  // Schema.org BreadcrumbList Schema
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://blinkwear.in',
    },
  ];

  if (product.category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: product.category.name,
      item: `https://blinkwear.in/category/${product.category.slug}`,
    });
  }

  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: product.title,
    item: `https://blinkwear.in/products/${product.id}`,
  });

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <JsonLd data={[productSchema, breadcrumbSchema]} />
      <ProductDetailView
        product={product}
        sellerStorefront={sellerStorefront}
        platformSettings={platformSettings}
      />
    </>
  );
}
