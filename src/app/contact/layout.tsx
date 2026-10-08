import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us — Customer Care & Concierge',
  description:
    'Need help with your designer fashion rental? Contact BlinkWear.in support for inquiries about sizing, delivery schedules, deposit refunds, or seller onboarding in Bhopal & Pune.',
  alternates: {
    canonical: 'https://blinkwear.in/contact',
  },
  openGraph: {
    title: 'Contact Us | BlinkWear.in',
    description: 'Get in touch with the BlinkWear concierge for fashion rental and seller support.',
    url: 'https://blinkwear.in/contact',
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
