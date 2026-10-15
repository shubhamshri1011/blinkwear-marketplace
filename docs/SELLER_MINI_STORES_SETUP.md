# BlinkWear Free Seller Mini-Stores: Wildcard Subdomain & DNS Setup Guide

This guide details the architecture, DNS configuration, Vercel wildcard domain setup, and database migration required for free seller mini-stores on subdomains (e.g. `shubhamclothing.blinkwear.in`).

---

## 1. Architecture Overview

```
                                 [ Incoming Request ]
                                           │
                                           ▼
                           [ DNS: *.blinkwear.in ]
                                           │
                                           ▼
                            [ Vercel Edge Network ]
                                           │
                                           ▼
                           [ Next.js 16 (proxy.ts) ]
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     │                                           │
       [ Apex / Root Domain ]                       [ Seller Subdomain ]
       blinkwear.in, www.blinkwear.in               e.g. shubhamclothing.blinkwear.in
                     │                                           │
                     ▼                                           ▼
       Standard Marketplace Home (/)             Internally rewrites (/) to:
       All sellers & platform catalog            /store/shubhamclothing
                                                                 │
                                                                 ▼
                                                  [ Seller Store Page ]
                                                  • Approved & Active outfits only
                                                  • Seller Branding & Verification badge
                                                  • Rent & Buy pricing & actions
                                                  • Shared cart & Cashfree checkout
```

### Key Technical Characteristics
1. **Zero Path Clutter**: The customer visits `https://shubhamclothing.blinkwear.in/` and the address bar stays clean. Next.js 16 `proxy.ts` performs a server-side rewrite to `/store/shubhamclothing`.
2. **Unified Cart & Checkout**: The cart context, Cashfree prepaid checkout, and order lifecycle remain 100% unified with the platform database. A customer can add an outfit from a mini-store to their bag and complete checkout securely.
3. **Privacy by Design**:
   - Direct anon `SELECT` on `seller_profiles` remains revoked.
   - Public store reads query `seller_public_profiles` view or the `get_store_by_slug` RPC.
   - Private seller information (`phone`, `email`, `pan_number`, `kyc_docs`, `business_address`) is never exposed on the storefront.
4. **Reserved Subdomains**: Platform routes (`admin`, `api`, `app`, `www`, `store`, `checkout`, `cart`, `orders`, `profile`, `seller`, etc.) are protected by database CHECK constraints, frontend validation, and proxy routing guards.

---

## 2. Vercel Wildcard Domain Setup

To route all current and future seller subdomains to the same Next.js production deployment:

1. Open the **[Vercel Dashboard](https://vercel.com/)**.
2. Select the **`marketplace-web`** project.
3. Navigate to **Settings** → **Domains**.
4. Enter the wildcard domain:
   ```text
   *.blinkwear.in
   ```
5. Click **Add**.
6. When prompted, select your production branch (e.g., `main`).

---

## 3. DNS Configuration (Cloudflare, GoDaddy, Route53, Namecheap)

In your DNS provider (where `blinkwear.in` is registered or hosted):

| Type | Name / Host | Target / Value | TTL | Proxy Status (Cloudflare) |
|---|---|---|---|---|
| **CNAME** | `*` | `cname.vercel-dns.com.` | Auto / 3600 | DNS Only (Gray Cloud) or Proxied* |
| **A** / **CNAME** | `@` | (Existing root domain record) | Auto | Active |
| **CNAME** | `www` | `cname.vercel-dns.com.` | Auto | Active |

> **Cloudflare Note**: If using Cloudflare DNS with Proxy (Orange Cloud), ensure Cloudflare's SSL/TLS encryption mode is set to **Full (strict)**, or set the `*` record to **DNS Only** (Gray Cloud) to allow Vercel to issue Let's Encrypt certificates directly.

---

## 4. Wildcard SSL Certificate

Vercel automatically provisions and renews a free wildcard SSL certificate covering `*.blinkwear.in` via Let's Encrypt.
- Once the `*` CNAME record is detected by Vercel, the certificate status in the Vercel Domains tab will turn **Valid (Green Checkmark)**.
- Propagation typically completes in **5–15 minutes**.

---

## 5. Environment Variables

Ensure the following environment variables are configured in your Vercel Project Settings and `.env.local`:

```ini
# Root domain for subdomain parsing and public link generation
NEXT_PUBLIC_ROOT_DOMAIN=blinkwear.in

# Optional: Shared cookie domain for multi-subdomain session persistence
NEXT_PUBLIC_COOKIE_DOMAIN=.blinkwear.in
```

### Local Development Support
In local development, modern web browsers resolve all `*.localhost` domains to `127.0.0.1` automatically.
- Main marketplace: `http://localhost:3000`
- Seller mini-store: `http://shubhamclothing.localhost:3000`
- Direct path fallback: `http://localhost:3000/store/shubhamclothing`
- Testing header / param: `http://localhost:3000/?__subdomain=shubhamclothing`

---

## 6. Supabase Database Migration

The migration is defined in:
`mobile-app/mobile-app/supabase/phase38_seller_store_subdomains.sql`

### What it applies:
1. Adds `store_slug` to `public.seller_profiles`.
2. Creates format CHECK constraint:
   - 3 to 63 characters
   - Regex `^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$`
   - No double hyphens (`--`)
   - Rejects reserved words (`admin`, `api`, `checkout`, `cart`, etc.)
3. Creates unique index `seller_profiles_store_slug_lower_idx` on `LOWER(store_slug)`.
4. Backfills existing active seller profiles with unique slugs derived from `store_name`.
5. Updates view `public.seller_public_profiles` to expose `store_slug`.
6. Creates RPCs:
   - `get_store_by_slug(p_slug text)`: Safe public store lookup.
   - `check_store_slug_available(p_slug text, p_seller_id uuid)`: Real-time availability check.
   - Updates `get_seller_storefront(p_seller_id uuid)` to include `store_slug`.

### Manual Application Procedure:
1. Open the **[Supabase Dashboard](https://supabase.com/)**.
2. Select the BlinkWear project.
3. Open the **SQL Editor**.
4. Paste the content of `phase38_seller_store_subdomains.sql` and run it.
5. Run the read-only live verification queries in `marketplace-web/docs/_verify.sql`.

---

## 7. Seller Experience & Self-Service

1. **Dashboard Access**:
   Sellers visit their Dashboard (`/seller/dashboard`) to see their live Mini-Store URL with one-click copy and store visit actions.
2. **Customization**:
   Sellers visit `/seller/store` to:
   - Update Store Name
   - Choose or auto-generate a unique subdomain slug
   - Update Boutique Bio / Description
   - Set custom Logo URL and Hero Banner URL
   - Check real-time subdomain availability
3. **Product Curation**:
   Any outfit uploaded and approved by an admin at `/seller/products` instantly appears on that seller's subdomain mini-store.
