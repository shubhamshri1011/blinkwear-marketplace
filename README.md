# BlinkWear.in — Production Fashion Rental & Resale Marketplace

Luxury fashion rental and pre-loved designer marketplace built with Next.js 16 (App Router), Tailwind CSS v4, Supabase, and Cashfree Payments.

---

## 💎 Features

- **Luxury Design & Aesthetics**: Built with Outfit typography, curated neutral and gold/emerald palette, responsive mobile navigation, and micro-animations.
- **Dynamic Homepage**: Admin-driven hero banners, 3-step rental onboarding, occasion collections, and dynamic sections with auto-fill query fallback.
- **Rental Lifecycle & Availability**:
  - Live availability check using Supabase RPC (`check_rental_availability` & `get_product_booked_dates`).
  - Rental date selection with duration limits.
  - Multi-line server-authoritative pricing breakdown (Rental Fee + Refundable Security Deposit + Sanitized Delivery + Prepaid Reverse Pickup + Buyer Platform Fee).
  - Same-city matching checks (Bhopal, Pune).
- **Payment Processing**:
  - 100% Prepaid via Cashfree Payments. COD, manual, and offline payment options are strictly prohibited.
- **Buyer Portal**:
  - Cart with segregated rental items (dates, deposit, pricing) and pre-loved buy items.
  - Saved delivery addresses management (`addresses` table).
  - Rental booking timeline tracker with doorstep return initiation.
  - Buy orders history with fulfillment stages.
  - Wishlist management.
- **Seller Partner Portal**:
  - Seller onboarding application (`seller_profiles` table).
  - Seller dashboard with KPIs (listings, active rentals, total orders, gross volume).
  - Outfit listing creator with Supabase Storage image upload (`product-images` bucket).
  - Fulfillment status management (`advance_rental_fulfillment_status`, `advance_order_item_status`).
- **Complete Legal & Policy Suite**:
  - Rental Agreement, Deposit & Refund Policy, Cancellation Policy, Shipping & Reverse Pickup, Seller Terms, Terms & Conditions, Privacy Policy, FAQ, About, Contact.

---

## 🚀 Environment Configuration

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xdxvingqvhyjmupvvxjo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=https://blinkwear.in
```

---

## 🛠️ Development & Production

```bash
# Run local development server
npm run dev

# Run TypeScript type check
npx tsc --noEmit

# Create optimized production build
npm run build

# Start production server
npm start
```
