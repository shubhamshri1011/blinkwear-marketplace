# DIAGNOSIS.md: Auth & Storefront Stabilization Root Cause Analysis

**Branch:** `fix/auth-and-storefront-stabilize`  
**Date:** 2026-10-23  
**Status:** Diagnosis Complete  

---

## Executive Summary

Following the merge of Storefront V2 work into `main`, multiple core functionalities failed:
1. Signup, Login, and Signout buttons appear unresponsive or fail to persist sessions.
2. A new seller cannot create an account / submit onboarding applications.
3. In Seller > Mini-Store settings, boutique settings cannot be saved, and the "Auto" subdomain slug button does not respond.
4. Product action buttons ("Add to Bag", "Rent Now") and interactive controls fail or exhibit broken behavior.

Through static code analysis, dev server tracing, and active Supabase schema querying (`node scripts/test-columns.mjs`), we have pinpointed the exact root causes across cookie handling, database triggers, schema discrepancies, and client event handlers.

---

## Detailed Root Cause Analysis & Evidence

### 1. Supabase Cookie Configuration Mismatch & Rejection (`client.ts`, `server.ts`, `middleware.ts`)
- **Suspects Investigated:** Suspect (a) and Suspect (b).
- **Evidence & Findings:**
  - In `src/lib/supabase/client.ts` (lines 15–17) and `src/lib/supabase/middleware.ts` (lines 13–15):
    ```ts
    if (hostname.endsWith('.localhost') || hostname === 'localhost') {
      return 'localhost';
    }
    ```
    When running in local development (`http://localhost:3000`), Supabase client and middleware configured `cookieOptions: { domain: 'localhost' }`.
  - **Browser Behavior (RFC 6265 §4.1.2.3 & §5.3):**
    Browsers (Chrome, Firefox, Safari, Edge) strictly **reject cookies containing `Domain=localhost`** because `localhost` does not contain an embedded dot and is treated as a top-level/public suffix. The browser silently drops the `Set-Cookie` header and rejects `document.cookie = "...; domain=localhost"`.
  - **Server Inconsistency (`src/lib/supabase/server.ts`):**
    `server.ts` configured **zero** `cookieOptions`. When SSR routes or Server Actions refresh tokens, they set host-only cookies, while `client.ts` attempted to set domain cookies.
  - **Impact:**
    - On **Login / Signup**: The browser drops the auth cookie. The user receives a successful auth response, but when the page refreshes or navigates, `supabase.auth.getUser()` finds no cookie and returns `null`. To the user, clicking "Sign In" or "Create Account" did nothing because they remain logged out.
    - On **Signout**: `supabase.auth.signOut()` cannot clear cookies with differing domain scopes, and `signOut()` in `AuthContext.tsx` lacked a window redirect (`window.location.href = '/'`), leaving stale memory state.
    - On **`*.vercel.app` Preview Domains**: Cookies with `domain: '.blinkwear.in'` are rejected by the browser because `*.vercel.app` is an entirely different domain.

---

### 2. Database Column Discrepancies on `seller_profiles`
- **Suspects Investigated:** Suspect (d).
- **Evidence & Findings (Executed via `scripts/test-columns.mjs` against Supabase):**
  ```
  Testing which columns exist on seller_profiles:
  ❌ Column DOES NOT EXIST: tagline
  ❌ Column DOES NOT EXIST: accent_palette
  ❌ Column DOES NOT EXIST: whatsapp_number
  ❌ Column DOES NOT EXIST: instagram_handle
  ❌ Column DOES NOT EXIST: store_hours
  ❌ Column DOES NOT EXIST: speciality_tags
  ❌ Column DOES NOT EXIST: show_about
  ❌ Column DOES NOT EXIST: show_contact
  ❌ Column DOES NOT EXIST: diwali_theme
  ❌ Column DOES NOT EXIST: is_approved
  ```
  - **The Missing Columns:** The database being tested does not yet have the Phase 41 columns (`tagline`, `accent_palette`, `whatsapp_number`, `instagram_handle`, `store_hours`, `speciality_tags`, `show_about`, `show_contact`, `diwali_theme`).
  - **The `is_approved` Myth:** `seller_profiles` never had an `is_approved` column. The actual database column for admin seller approval has always been `is_verified` (boolean) and `verification_status` ('pending' | 'verified' | 'rejected').
  - **Impact on Seller Store Settings Save (`/seller/store`):**
    `handleSave` in `src/app/seller/store/page.tsx` unconditionally issues an `UPDATE seller_profiles` payload containing all new columns:
    ```ts
    await supabase.from('seller_profiles').update({
      store_name, store_slug, tagline, accent_palette, whatsapp_number, ...
    })
    ```
    Postgres immediately rejects this with error `42703 (undefined_column: column "tagline" of relation "seller_profiles" does not exist)`.
    Consequently, **saving seller store settings fails completely**.

---

### 3. Database Triggers Blocking Seller Onboarding (`/become-a-seller`)
- **Suspects Investigated:** Suspect (e).
- **Evidence & Findings:**
  - In `phase41b_hardening.sql`:
    ```sql
    CREATE TRIGGER trg_protect_seller_profile_privileged_fields
    BEFORE UPDATE OF is_approved, is_active, is_verified, verification_status, verified_at, kyc_docs
    ON public.seller_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_seller_profile_privileged_fields();
    ```
    This trigger raises an exception if a non-admin modifies `kyc_docs` or `is_active`.
  - In `src/app/become-a-seller/page.tsx` (lines 426–447):
    When an applicant submits onboarding documents, the client sends:
    ```ts
    kyc_docs: kycMeta,
    is_active: false,
    ```
    Because the user is not an admin, Postgres trigger `trg_protect_seller_profile_privileged_fields` raises:
    `ERROR: Only administrators can modify the kyc_docs field.`
  - **Impact:**
    New sellers cannot complete the onboarding form or submit KYC documents; the application fails with a database exception.

---

### 4. Client Button Unresponsiveness
- **Suspects Investigated:** Suspect (c) and Form Handlers.
- **Evidence & Findings:**
  1. **"Auto" Subdomain Slug Button (`/seller/store` line 534):**
     ```tsx
     <button
       type="button"
       onClick={() => setStoreSlug(formatStoreSlug(storeName))}
       title="Auto-generate from name"
     >
     ```
     - If `storeName` has not yet been typed (the Subdomain Slug input is placed *above* Boutique Name in the form layout), `formatStoreSlug('')` returns `''`.
     - Clicking "Auto" produces zero visual feedback, does not fallback to existing profile name, and does not invoke `checkAvailability`.
  2. **Signup Form Submission (`/register`):**
     - When `supabase.auth.signUp()` succeeds, the client attempts `supabase.from('profiles').upsert(...)`.
     - Because `Domain=localhost` was rejected, the client session is unauthenticated (`auth.uid() IS NULL`).
     - The RLS policy on `public.profiles` forbids anonymous writes, causing the upsert to fail.
  3. **Signout Button (`Header.tsx`):**
     - `signOut()` in `AuthContext.tsx` only called `supabase.auth.signOut()`, which failed to clear host-only cookies when domain cookies were expected.
     - `signOut()` lacked a hard redirect, leaving stale auth state in memory until manual browser reload.
  4. **Product Actions ("Add to Bag" / "Rent Now"):**
     - When unauthenticated users click "Add to Bag", `ProductDetailView.tsx` redirected to `/login?redirect=...`.
     - Because login failed to store session cookies, users entered a login loop where the button appeared to "do nothing" or repeatedly prompt for sign in.

---

### 5. Proxy & Subdomain Middleware (`src/proxy.ts`)
- **Suspects Investigated:** Suspect (f).
- **Evidence & Findings:**
  - `src/proxy.ts` correctly excludes static assets, webhooks, and root domain requests.
  - However, when requests arrive on boutique subdomains (e.g. `anita.localhost:3000`), `/login`, `/register`, and `/api` requests should explicitly bypass any subdomain routing rewrites to ensure auth flows always reach the primary handlers cleanly.

---

## Action Plan (Step 2 Stabilization)

1. **Unified Cookie Helper (`src/lib/supabase/cookie-options.ts`):**
   - Create one authoritative helper used by `client.ts`, `server.ts`, and `middleware.ts`.
   - Set `domain: '.blinkwear.in'` **only** when hostname is `blinkwear.in` or ends with `.blinkwear.in`.
   - For all other environments (`localhost`, `*.localhost`, `*.vercel.app`, IP addresses), do **not** set a domain (host-only cookie).
2. **Robust Multi-Domain Signout:**
   - Clear cookies both with and without domain, call `supabase.auth.signOut()`, and perform a hard redirect (`window.location.href = '/'`).
3. **Resilient Seller Store Save & Migration Alignment:**
   - Update `phase41_storefront_v2.sql` and `phase41b_hardening.sql` to reference `is_verified` instead of non-existent `is_approved`.
   - Permit seller KYC document updates on application submission (`kyc_docs`).
   - In `/seller/store` save handler, gracefully fall back if optional V2 branding columns do not exist yet in the connected database, and surface explicit Supabase error messages.
4. **Fix "Auto" Slug Button:**
   - Fall back to `storeName || sellerProfile?.store_name || profile?.full_name || ''`, sanitize, set slug, and immediately trigger availability check.
