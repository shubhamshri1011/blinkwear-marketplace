import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Seller — Monetize Your Designer Wardrobe',
  description:
    'List your bridal lehengas, sherwanis, and luxury outfits on BlinkWear.in. Earn passive rental income while we handle insured shipping, dry cleaning, and customer coordination in Bhopal & Pune.',
  alternates: {
    canonical: 'https://blinkwear.in/become-a-seller',
  },
  openGraph: {
    title: 'Become a Seller | BlinkWear.in',
    description: 'Turn your designer closet into monthly income with BlinkWear.',
    url: 'https://blinkwear.in/become-a-seller',
  },
};

export default function BecomeASellerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
