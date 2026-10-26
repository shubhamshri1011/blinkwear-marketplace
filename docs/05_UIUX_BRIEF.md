# BlinkWear UI/UX Redesign Brief: Flipkart-Style E-Commerce Pattern

## 1. Executive Summary & Design Principles

BlinkWear is redesigning its web storefront (`marketplace-web`) to adopt a dense, fast, scannable, mobile-first e-commerce pattern inspired by modern Indian marketplaces (such as Flipkart), tailored exclusively for luxury fashion rental and resale in Pune and Bhopal.

### Core Principles
1. **BlinkWear Identity**: Powered by BlinkWear's own logo and brand identity — Deep Luxury Noir (`#0F0F11`), Warm Amber/Orange (`#F97316` / `#EA580C` from the smiling bag logo), Pure Canvas (`#FFFFFF` / `#F8FAFC`), and Emerald Trust Accents (`#059669` for sanitization and verified rental badges). Never clone Flipkart's blue/yellow branding, copy, or assets.
2. **Dense, Scannable & Mobile-First**: Sticky search header with city switcher, high-density icon strip, responsive hero carousel, horizontal scroll product rails, category/occasion tile cards, and filter drawer.
3. **100% Admin Manageable**: Every visual block on the homepage (hero slides, top/mid banners, category icon strip, product sections, trust strips, and seller invitations) is driven by database models and editable in `admin-panel` without code redeployments.
4. **Geo-Fenced & Authentic**: Exclusively Pune and Bhopal operations. Zero nationwide or unverified copy claims.
5. **Rock-Solid Reliability**: Safe fallbacks when tables or sections are empty, additive migrations only (`phase42`), full RLS protection, zero layout shift (CLS < 0.1), and sub-second interaction speed.

---

## 2. Design Tokens (Brand System)

```
                       BLINKWEAR COLOR PALETTE
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   LUXURY NOIR    │  │   BRAND AMBER    │  │  EMERALD TRUST   │
│     #0F0F11      │  │     #F97316      │  │     #059669      │
│  (Text / Dark)   │  │ (Logo Primary)   │  │(Rental Badges)   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   CANVAS WHITE   │  │   SURFACE MIST   │  │   BORDER SLATE   │
│     #FFFFFF      │  │     #F8FAFC      │  │     #E2E8F0      │
│ (Page BG / Card) │  │  (App Shell BG)  │  │ (Dividers/Lines) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

### 2.1 Color Tokens
| Token | Value | Purpose / Usage |
| :--- | :--- | :--- |
| `--color-brand-primary` | `#F97316` (Amber-600) | Primary CTA buttons, active tab indicators, price highlights |
| `--color-brand-primary-hover` | `#EA580C` (Amber-700) | Hover and press states on primary actions |
| `--color-brand-primary-light` | `#FFF7ED` (Amber-50) | Selected pill background, accent badge tint |
| `--color-brand-dark` | `#0F0F11` (Noir-950) | Sticky header, headings, high-contrast badges |
| `--color-brand-emerald` | `#059669` (Emerald-600)| "For Rent" badge, sanitized guarantee, verified checkmarks |
| `--color-brand-emerald-light`| `#ECFDF5` (Emerald-50) | Rental badge background, sanitization card background |
| `--color-surface-bg` | `#F1F5F9` (Slate-100) | Outer app shell background (provides card contrast) |
| `--color-surface-card` | `#FFFFFF` | Product cards, tile grids, header, sheets |
| `--color-surface-subtle` | `#F8FAFC` (Slate-50) | Table striping, secondary buttons, input backgrounds |
| `--color-border-subtle` | `#E2E8F0` (Slate-200) | Card borders, horizontal separators |
| `--color-border-strong` | `#CBD5E1` (Slate-300) | Input field borders, active filters |
| `--color-text-main` | `#0F172A` (Slate-900) | Primary titles, prices, labels |
| `--color-text-muted` | `#64748B` (Slate-500) | Subtitles, deposit hints, delivery timeline |
| `--color-text-subtle` | `#94A3B8` (Slate-400) | Disabled states, breadcrumbs, placeholder text |
| `--color-status-danger` | `#E11D48` (Rose-600) | Wishlist active heart, sold-out badge, validation errors |

### 2.2 Typography
- **Primary Font**: `Outfit` (sans-serif, loaded via `next/font/google`).
  - Weights: `400` (Body), `500` (Labels/Nav), `600` (Prices/Buttons), `700` (Headings/Badges).
- **Display Font**: High-contrast modern sans (Outfit Display) for banners and section titles.
- **Scale**:
  - Micro / Badge: `10px` / `11px` (UPPERCASE tracking-wider, semibold).
  - Caption / Hint: `12px` (line-height: `16px`).
  - Body Small / Dense Product: `13px` / `14px` (line-height: `18px`).
  - Body Regular: `15px` / `16px` (line-height: `22px`).
  - Section Title: `18px` mobile, `22px` desktop (bold, tracking-tight).
  - Hero Header: `24px` mobile, `40px` desktop (extrabold).

### 2.3 Spacing & Density
- Base scale: 4px grid (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`).
- Card padding: `8px` to `12px` (dense, scannable product tiles).
- Section gutters: `8px` between product cards in mobile scroll rails; `12px` to `16px` in desktop grids.
- Outer container: max-w-7xl (`1280px`), horizontal padding `12px` on mobile, `24px` on desktop.

### 2.4 Radii & Shadows
- **Radius**:
  - Pills / Badges: `9999px` (rounded-full).
  - Product Cards / Banners: `8px` (Flipkart-style crisp compact cards) or `12px` for hero slides.
  - Buttons / Inputs: `8px` (rounded-lg).
  - Modals / Bottom Sheets: `16px` top-rounded on mobile.
- **Shadows**:
  - `shadow-xs`: `0 1px 2px rgba(0,0,0,0.05)` (Product cards default).
  - `shadow-md`: `0 4px 6px -1px rgba(0,0,0,0.08)` (Card hover / sticky elements).
  - `shadow-sheet`: `0 -4px 16px rgba(0,0,0,0.12)` (Mobile filter bottom sheet).

---

## 3. ASCII Wireframes

### 3.1 Homepage Wireframes

#### Mobile Viewport (360px)
```
┌─────────────────────────────────────────┐
│ [Logo] BlinkWear  [City: Pune ▾] [Cart] │ <- Sticky Header
│ 🔍 Search lehenga, sherwani, brand...   │ <- Sticky Search Bar
├─────────────────────────────────────────┤
│ (O)     (O)     (O)     (O)     (O)    │ <- Category Icon Strip
│ Bridal Grooms  Party Jewellery Pre-loved│    (Horizontal snap scroll)
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │  HERO BANNER CAROUSEL (3:1 / 16:9)  │ │ <- Admin Hero Slider
│ │  "Rent Luxury Bridal Wear in Pune"  │ │    (Swipeable, dots)
│ │  [Explore Rentals →]                │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ 🛡️ 100% Sanitized | ⚡ Doorstep Delivery │ <- Trust Ticker Strip
├─────────────────────────────────────────┤
│ Trending Rentals in Pune      [See All] │ <- Section Header
│ ┌────────┐ ┌────────┐ ┌────────┐        │
│ │[Img] ♥ │ │[Img] ♥ │ │[Img] ♥ │        │ <- Horizontal Scroll Rail
│ │Lehenga │ │Sherwani│ │Tuxedo  │        │    (Card: 3:4 image,
│ │₹1,800/d│ │₹1,200/d│ │₹999/d  │        │     Rent badge, price,
│ │Dep:₹2k │ │Dep:₹1k │ │Dep:₹1k │        │     deposit snippet)
│ └────────┘ └────────┘ └────────┘        │
├─────────────────────────────────────────┤
│ ┌──────────────────┐ ┌────────────────┐ │
│ │ MID TILE 1 (1:1) │ │ MID TILE 2(1:1)│ │ <- Admin Mid-Page 2-Tile
│ │ Wedding Guest    │ │ Sangeet Outfits│ │    Grid Banners
│ └──────────────────┘ └────────────────┘ │
├─────────────────────────────────────────┤
│ Popular Occasions             [See All] │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐     │ <- Category/Occasion Tiles
│ │Reception│ │Haldi    │ │Cocktail │     │
│ └─────────┘ └─────────┘ └─────────┘     │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ 💰 Monetize Your Closet in Pune/Bhop│ │ <- Seller Onboarding CTA
│ │ [Become a Verified Seller →]        │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ [Home]   [Categories]  [Wishlist]  [You]│ <- Mobile Bottom Nav
└─────────────────────────────────────────┘
```

#### Desktop Viewport (1440px)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [Logo] BlinkWear | [City: Bhopal ▾] | 🔍 Search designer wear... | [Wishlist] [Cart(2)]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Bridal Lehengas ▾ | Groom Sherwanis ▾ | Tuxedos ▾ | Party Gowns ▾ | Jewellery ▾      │ <- Mega-menu strip
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │                    HERO BANNER CAROUSEL (Full Width / 3.2:1)                       │ │
│ │                 "Curated Designer Bridal Couture & Royal Sherwanis"                │ │
│ │                         [Rent for 3, 5 or 7 Days →]                                │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [✓ 100% Sanitized Garments]  [⚡ Verified Doorstep Delivery in Pune & Bhopal]  [↺ Easy Doorstep Returns]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Trending Designer Rentals in Bhopal                                         [View All →]│
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────┐ │
│ │[Image (3:4)] ♥│ │[Image (3:4)] ♥│ │[Image (3:4)] ♥│ │[Image (3:4)] ♥│ │[Image (3:4)]│ │
│ │[Rent] Sabyas..│ │[Rent] Manyavar│ │[Rent] Manish M│ │[Rent] Anita D.│ │[Rent] Gaurav│ │
│ │₹2,499 / day   │ │₹1,299 / day   │ │₹3,999 / day   │ │₹1,899 / day   │ │₹2,199 / day │ │
│ │Security:₹3,000│ │Security:₹1,500│ │Security:₹4,500│ │Security:₹2,000│ │Security:₹3k │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────┐ ┌────────────────────────────┐ │
│ │ PROMO BANNER 1          │ │ PROMO BANNER 2          │ │ PROMO BANNER 3             │ │
│ │ Bridal Lehengas Under ₹3k│ │ Groom Luxury Sets       │ │ Cocktail & Evening Gowns   │ │
│ └─────────────────────────┘ └─────────────────────────┘ └────────────────────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Shop by Occasion                                                            [View All →]│
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────┐ │
│ │ Wedding Day   │ │ Sangeet Night │ │ Haldi & Mehendi │ │ Reception     │ │ Cocktail   │ │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘ └────────────┘ │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [Turn Your Wardrobe Into Income: Rent or Resell Luxury Outfits]      [Apply as Seller →]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Footer: Service Areas (Pune & Bhopal only) | Policies | Secure Escrow Payments         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.2 Product Listing Page Wireframes

#### Mobile Viewport (360px)
```
┌─────────────────────────────────────────┐
│ [←] Search: "Lehenga"            [Cart] │
├─────────────────────────────────────────┤
│ [Rent (Active)] [Buy Now]               │ <- Quick Mode Switcher
├─────────────────────────────────────────┤
│ ⚡ Filters: [City: Pune ▾] [Sort ▾] [All]│ <- Horizontal pill bar
├─────────────────────────────────────────┤
│ Showing 42 styles in Pune               │
│ ┌─────────────────┐ ┌─────────────────┐ │
│ │ [Image 3:4]   ♥ │ │ [Image 3:4]   ♥ │ │ <- Dense 2-Column Grid
│ │ Sabyasachi Red  │ │ Sequin Georgette│ │
│ │ [Rent] Pune     │ │ [Rent] Pune     │ │
│ │ ₹1,800 / day    │ │ ₹1,200 / day    │ │
│ │ Deposit: ₹2,000 │ │ Deposit: ₹1,500 │ │
│ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────┤
│ [ ⚙️ Filters (3) ]        [ ⇅ Sort By ]  │ <- Sticky Bottom Action Bar
└─────────────────────────────────────────┘
```

#### Desktop Viewport (1440px)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Header: [Logo] | [City: Pune] | 🔍 Search... | Wishlist | Cart                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Home > Designer Wear > Lehengas in Pune                                                │
│ ┌──────────────────────┐ ┌───────────────────────────────────────────────────────────┐│
│ │ FILTERS              │ │ Lehengas for Rent in Pune (42 styles)    Sort by: [Featured ▾]││
│ ├──────────────────────┤ ├───────────────────────────────────────────────────────────┤│
│ │ Listing Type         │ │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   ││
│ │ (•) Rent  ( ) Buy    │ │ │[Image]  ♥ │ │[Image]  ♥ │ │[Image]  ♥ │ │[Image]  ♥ │   ││
│ ├──────────────────────┤ │ │Velvet Red │ │Silk Pastel│ │Gold Zari  │ │Emerald Cut│   ││
│ │ City                 │ │ │₹2,200/day │ │₹1,800/day │ │₹2,900/day │ │₹1,500/day │   ││
│ │ [✓] Pune  [ ] Bhopal │ │ │Dep: ₹3,000│ │Dep: ₹2,500│ │Dep: ₹4,000│ │Dep: ₹2,000│   ││
│ ├──────────────────────┤ │ └───────────┘ └───────────┘ └───────────┘ └───────────┘   ││
│ │ Categories           │ │ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   ││
│ │ [✓] Bridal Lehengas  │ │ │[Image]  ♥ │ │[Image]  ♥ │ │[Image]  ♥ │ │[Image]  ♥ │   ││
│ │ [ ] Light Lehengas   │ │ │...        │ │...        │ │...        │ │...        │   ││
│ ├──────────────────────┤ │ └───────────┘ └───────────┘ └───────────┘ └───────────┘   ││
│ │ Rental Price / Day   │ │                                                           ││
│ │ [Min ₹500 - Max ₹5k] │ │ Pagination / Infinite Load [Page 1 of 4]                  ││
│ └──────────────────────┘ └───────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Product Detail Page Wireframes

#### Mobile Viewport (360px)
```
┌─────────────────────────────────────────┐
│ [←]                  [Share]  [♥ Wish]  │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │                                     │ │
│ │    PRODUCT IMAGE CAROUSEL (3:4)     │ │
│ │              (1 / 4)                │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Sabyasachi Heritage Crimson Bridal      │
│ Brand: Sabyasachi • Condition: Like New │
│ 📍 Located in Pune (Doorstep in Pune)   │
├─────────────────────────────────────────┤
│ [RENT FROM ₹2,200/DAY]  Deposit: ₹3,000 │
│ [✓] 100% Sanitized  [✓] Free Return Bag │
├─────────────────────────────────────────┤
│ Select Rental Duration:                 │
│ [ 3 Days ]   [ 5 Days ]   [ 7+ Days ]   │
│ Select Event Date: [📅 Choose Date]     │
│ Available Size: [ M (Bust 36") ]        │
├─────────────────────────────────────────┤
│ Garment Details & Measurements (Accordion│
│ Security Deposit & Escrow Refund Policy │
│ Seller: Royal Closet Pune (Verified ★)  │
├─────────────────────────────────────────┤
│ [ 🛍️ Add to Bag ]   [ ⚡ Rent Now ]     │ <- Sticky Bottom Purchase Bar
└─────────────────────────────────────────┘
```

#### Desktop Viewport (1440px)
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Breadcrumb: Home > Pune > Bridal Lehengas > Sabyasachi Crimson Velvet                  │
│ ┌────────────────────────────────────────┐ ┌─────────────────────────────────────────┐│
│ │ [Thumbs] ┌───────────────────────────┐ │ │ Sabyasachi Crimson Velvet Lehenga        ││
│ │ [img 1]  │                           │ │ │ By Sabyasachi Atelier • Like-New         ││
│ │ [img 2]  │                           │ │ │ 📍 Pune Service Area (Local Delivery Only) ││
│ │ [img 3]  │    PRIMARY IMAGE (3:4)    │ │ ├─────────────────────────────────────────┤│
│ │ [img 4]  │                           │ │ │ Rental Price: ₹2,200 / day               ││
│ │          │                           │ │ │ Security Deposit: ₹3,000 (100% Refundable││
│ │          └───────────────────────────┘ │ ├─────────────────────────────────────────┤│
│ │                                        │ │ Event Rental Duration: [ 3 | 5 | 7 Days ]││
│ │ [✓ Sanitized in UV-C Chamber]          │ │ Delivery Date: [📅 Select Date]          ││
│ │ [↺ Free Reverse Pickup at Doorstep]    │ │ Size: [ M - Bust 36" Waist 30" ]          ││
│ └────────────────────────────────────────┘ │ ├─────────────────────────────────────────┤│
│                                            │ │ [ 🛍️ Add to Bag ]  [ ⚡ Instant Reserve ]││
│                                            │ ├─────────────────────────────────────────┤│
│                                            │ │ Security Deposit & Escrow Information   ││
│                                            │ │ Product Specifications & Fabric Details ││
│                                            │ │ Seller: Royal Wardrobe Pune (Verified)  ││
│                                            │ └─────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.4 Shopping Bag / Cart Page Wireframes

#### Mobile Viewport (360px)
```
┌─────────────────────────────────────────┐
│ [←] Shopping Bag (2 items)              │
├─────────────────────────────────────────┤
│ 📍 Delivery To: Pune (411001) [Change]  │
├─────────────────────────────────────────┤
│ RENTAL ITEMS (1)                        │
│ ┌─────────────────────────────────────┐ │
│ │[Img] Sabyasachi Crimson Lehenga     │ │
│ │      3-Day Rental: 12 Nov - 15 Nov  │ │
│ │      Rent: ₹6,600 (Deposit: ₹3,000) │ │
│ │      Size: M  [Remove]              │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ ORDER SUMMARY                           │
│ Rental Subtotal:              ₹6,600   │
│ Refundable Security Deposit:  ₹3,000   │
│ Doorstep Delivery & Return:     ₹140   │
│ Platform Convenience Fee (5%):  ₹330   │
│ Total Payable Now:           ₹10,070   │
│ (Deposit Refunded on Return: -₹3,000)  │
├─────────────────────────────────────────┤
│ [🔒 Proceed to Cashfree Payment: ₹10,070]│ <- Sticky Bottom Action Bar
└─────────────────────────────────────────┘
```

---

## 4. Component Architecture Catalog

| Component Name | File Path | Responsibilities |
| :--- | :--- | :--- |
| `AppHeader` | `src/components/layout/AppHeader.tsx` | Sticky dense header, logo, search input, city selector trigger, cart & wishlist counter. |
| `CategoryIconStrip` | `src/components/home/CategoryIconStrip.tsx` | Dense horizontal circular/pill icon strip with snap scroll and desktop mega-menu dropdown. |
| `HeroCarousel` | `src/components/home/HeroCarousel.tsx` | Autoplay hero slider with pause on hover/touch, dots, arrows, desktop/mobile responsive image srcset. |
| `StaticBannerBlock` | `src/components/home/StaticBannerBlock.tsx` | Renders `top_strip`, `mid_page` 2-3 tile promo blocks, or category banners with URL security guards. |
| `ProductRowSection` | `src/components/home/ProductRowSection.tsx` | Horizontal scrollable rail of product cards with "View All" link, title, and badge. |
| `OccasionTileGrid` | `src/components/home/OccasionTileGrid.tsx` | 2x2 or 3-column curated occasion visual cards (Wedding, Sangeet, Cocktail, Reception). |
| `TrustTickerStrip` | `src/components/home/TrustTickerStrip.tsx` | Editable trust bar (Sanitized, Doorstep Delivery, Free Pickup, Escrow Deposit). |
| `SellerInviteCard` | `src/components/home/SellerInviteCard.tsx` | Admin-manageable monetization CTA for closet lenders in Pune and Bhopal. |
| `ProductCard` | `src/components/product/ProductCard.tsx` | Dense 3:4 aspect card, 2-line title, city tag, rent price/day, deposit snippet, wishlist heart, sold-out badge. |
| `ProductFilterSheet` | `src/components/product/ProductFilterSheet.tsx` | Mobile bottom sheet drawer for filters; desktop collapsible sidebar. |
| `DateRangePickerModal` | `src/components/product/DateRangePickerModal.tsx` | Calender picker for rental event reservations (3, 5, 7 days). |
| `CartItemRow` | `src/components/cart/CartItemRow.tsx` | Compact cart card with dates, city badge, size, deposit pill, and item removal. |
| `EmptyStatePlaceholder`| `src/components/ui/EmptyStatePlaceholder.tsx` | Graceful zero-state graphics and recovery action buttons. |

---

## 5. Database Model Additions: `phase42_home_merchandising.sql`

To achieve 100% admin manageability without modifying existing tables or breaking older mobile apps, the changes are **strictly additive**.

### 5.1 Tables & Schema Additions
1. **Extend `banners` table (additive columns)**:
   - `placement text NOT NULL DEFAULT 'hero_carousel'` (`CHECK (placement IN ('hero_carousel', 'top_strip', 'mid_page', 'category_banner'))`).
   - `mobile_image_url text DEFAULT NULL` (allows dedicated 1:1 or 4:3 mobile crop).
   - `alt_text text DEFAULT NULL`.
   - `city text DEFAULT NULL` (optional city targeting: `'Pune'`, `'Bhopal'`, or `NULL` for all).
2. **New Table: `homepage_blocks`**:
   - Organizes the homepage layout as ordered blocks.
   - Columns: `id (uuid)`, `block_type (text)` (`'product_row'`, `'category_strip'`, `'banner_group'`, `'occasion_tiles'`, `'trust_strip'`, `'seller_cta'`), `title (text)`, `subtitle (text)`, `view_all_url (text)`, `source_rule (text)`, `source_category_id (uuid FK)`, `banner_placement (text)`, `display_order (int)`, `item_limit (int)`, `is_active (bool)`, `start_date (timestamptz)`, `end_date (timestamptz)`, `created_at`, `updated_at`.
3. **New Table: `site_theme_settings`**:
   - Single-row table (`id = 1`) storing validated safe brand customizations:
   - Columns: `announcement_text`, `announcement_active`, `trust_strip_items (jsonb)`, `accent_color (text default 'amber')`, `updated_at`.

### 5.2 Row Level Security (RLS) & Anon Grants
- `banners`: Existing policy allows active select. Extended with placement query support.
- `homepage_blocks`: `ENABLE ROW LEVEL SECURITY`.
  - `FOR SELECT TO anon, authenticated USING (is_active = true)`.
  - `FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin())`.
- `site_theme_settings`: `ENABLE ROW LEVEL SECURITY`.
  - `FOR SELECT TO anon, authenticated USING (true)`.
  - `FOR ALL TO authenticated USING (public.is_current_user_admin()) WITH CHECK (public.is_current_user_admin())`.
- Grants: `GRANT SELECT ON public.homepage_blocks, public.site_theme_settings TO anon, authenticated;`

---

## 6. Admin Panel Homepage Management Architecture

### 6.1 Banners Manager by Placement
- Tabbed interface in Admin Panel:
  - **Hero Carousel**: Multi-slide manager with drag-to-reorder, autoplay interval control, slide preview.
  - **Top Announcement Strip**: Single text/image banner with schedule.
  - **Mid-Page Tile Banners**: 2-tile or 3-tile promo cards with desktop & mobile upload inputs.
  - **Category Banners**: Linked banners appearing when browsing specific collections.
- **Crop-Safe Specifications displayed directly on Admin Form**:
  - Hero Desktop: `1920x600px` (3.2:1 ratio).
  - Hero Mobile: `750x600px` (5:4 ratio).
  - Mid-Page Tiles: `800x800px` (1:1 ratio) or `800x600px` (4:3 ratio).
- **Target URL Validation Guard**:
  - The form checks if `target_value` starts with `http://`, `https://`, or `/`. If so, it blocks the admin from saving it under `target_type = 'product'` and prompts to select `'url'`.

### 6.2 Category Strip & Mega-Menu Manager
- Visibility switch for homepage icon strip.
- Custom icon upload (`SVG` or `PNG` with transparent background).
- Subcategory tree assignment for desktop hover drawer.

### 6.3 Homepage Sections Builder
- Drag-and-drop or up/down ordering of blocks.
- Block configuration modal:
  - Select block type (Product Rail, Banner Grid, Occasion Cards, Trust Bar).
  - Data source selector (e.g. Newest Arrivals, Featured Rentals, Popular Buys, or Hand-picked Curated Products).
  - City target (Pune, Bhopal, or Both).
  - Start & End datetime scheduler.

### 6.4 Sensible Zero-State Fallbacks
- If `banners` has no active slides: Render default high-converting luxury fashion hero card with direct link to `/products?type=rent`.
- If `homepage_blocks` is unseeded: Default to standard Flipkart layout (Category strip -> Hero -> Trending Rentals -> Top Occasions -> Featured Gowns -> Sanitization pledge).
- If product count for a city is low: Display verified listings from the nearest partner hub with clear delivery date badge.

---

## 7. Performance & Accessibility Guarantees

1. **Core Web Vitals (CWV)**:
   - LCP < 1.8s: Hero carousel slide 1 loaded with `priority={true}`, `sizes="100vw"`, preconnected Supabase CDN domain.
   - CLS = 0: All image wrappers have strict aspect-ratio containers (`aspect-3/4` for product cards, `aspect-[3.2/1]` for desktop hero, `aspect-[5/4]` for mobile hero).
   - INP < 150ms: Filter drawers and modals use CSS transitions and lightweight client state.
2. **Accessibility**:
   - Valid WCAG AA contrast (minimum 4.5:1 on all text over amber/noir/white).
   - Explicit `aria-label` on all icon-only buttons (Wishlist, Search, Cart, Close Drawer).
   - Visible keyboard `:focus-visible` rings with amber accent.
   - Screen-reader friendly price narration (e.g. `aria-label="Rental rate 1,800 rupees per day with 2,000 rupees refundable security deposit"`).

---

---

## 8. Approved Design Decisions & Phase B Status

| Decision Item | Resolution & Approved Specification |
| :--- | :--- |
| **1. Brand Accent & Contrast** | **Approved**: BlinkWear Warm Amber (`#F97316`) as primary accent. Any text on `#F97316` MUST pass WCAG AA contrast (dark text `#0F0F11`, or white text only on darker amber `#C2410C`). Emerald Green (`#059669`) strictly reserved for "Rent", "100% Sanitized", and verified badges. |
| **2. Category Strip Navigation**| **Approved**: Direct click to `/category/[slug]`. No desktop mega-menu dropdown for now. |
| **3. Mobile Bottom Navigation** | **Approved**: Fixed Flipkart-style bottom navigation bar on mobile (`Home`, `Categories`, `Wishlist`, `Bag`, `Account`) with safe-area padding; hidden on product detail, cart, and checkout pages. |
| **4. Hero Banner Aspect Ratio**  | **Approved**: `16:9` on mobile (`1280x720px`) and `3.2:1` on desktop (`1920x600px`). Dedicated mobile image input with client-side WebP compression and crop preview. |
| **5. Migration Staging**        | **Approved**: Placed strictly in `mobile-app/mobile-app/supabase/phase42_home_merchandising.sql` + `phase42_rollback.sql`. Not mirrored to web repo. Not applied to production. |
| **6. Trust Badges & Claims**    | **Approved**: Removed "escrow" and 48h refund promises everywhere. Seeded with strictly verified existing copy: `"100% Sanitized Garments"`, `"Doorstep Delivery & Return"`, `"Deposit refunded after quality check"`. |
| **7. Table Architecture**       | `homepage_sections` is preserved intact for existing mobile builds. `homepage_blocks` is additive for web merchandising with real column sorting (`products.view_count`, `products.created_at`). |

### Phase B Implementation Progress
- [x] **Step B1 (Complete)**: `phase42_home_merchandising.sql` + `phase42_rollback.sql`, Admin panel pages (`/banners` by placement with live preview & WebP compression, `/homepage-blocks` builder, `/categories` strip toggle, `/theme` tokens & trust badges), `tsc` & `build` clean.
- [ ] **Step B2**: Rebuild web storefront homepage from admin data (`src/app/page.tsx`).
- [ ] **Step B3**: Listing page, unified ProductCard, Product Detail page, Cart page.
- [ ] **Step B4**: Header, footer, mobile bottom nav, polish, performance & accessibility audit.