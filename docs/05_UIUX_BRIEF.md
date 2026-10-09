# BlinkWear UI/UX Brief

## Design Tokens From Source

| App | Typography | Colors | Spacing, radius, and layout tokens | Sources |
|---|---|---|---|---|
| Marketplace web | Loads Outfit through `next/font/google` as `--font-outfit`; body uses it as sans. Components also use Tailwind `font-serif`, but no custom serif font is loaded in the root layout. | CSS variables `--background: #ffffff`, `--foreground: #0a0a0a`; screens primarily use Tailwind neutral and emerald utilities, with rose/amber status accents. | No custom spacing/radius scale is declared in `globals.css`; pages use Tailwind utilities (`px-4/sm:px-6/lg:px-8`, `gap-4/6/8`, `rounded-xl/2xl/3xl`). Custom aspect-ratio utilities are 3:4, 4:3, square, and video. | [root layout/font](../src/app/layout.tsx), [global CSS](../src/app/globals.css), [product card](../src/components/product/ProductCard.tsx), [header](../src/components/layout/Header.tsx) |
| Admin panel | No custom font import/font-family declaration was found in app CSS or Tailwind config; components use Tailwind font weights/sizes. | `primary #D9376E`, `primaryDark #B32A57`, `secondary #2B2140`, `surface #F7F5FA`, `border #E8E4ED`; body background `#f7f5fa`. | Tailwind 3 default spacing/radius utilities are used; sidebar is `w-60`, navigation items use `rounded-lg`, `px-3 py-2`. | [Tailwind config](../../admin-panel/admin-panel/tailwind.config.ts), [global CSS](../../admin-panel/admin-panel/app/globals.css), [Sidebar](../../admin-panel/admin-panel/components/Sidebar.tsx) |
| Mobile app | No custom font family is declared in the theme; `fontSize` is a numeric scale used with React Native’s platform font. | `primary #D9376E`, `primaryDark #B32A57`, `secondary #2B2140`, white background, `surface #F7F5FA`, `border #E8E4ED`, dark text `#1A1625`, secondary text `#716C80`, success `#2E9E5B`, warning `#C7862B`, error `#D64545`. | Spacing: 4/8/16/24/32. Radius: 6/12/20/28/pill. Font sizes: 12/14/16/20/24/30. Icon sizes: 16/20/24. | [mobile theme](../../mobile-app/mobile-app/src/constants/theme.ts), [Expo config](../../mobile-app/mobile-app/app.json) |

## Reusable Components And Patterns

| App | Shared components/patterns in source | Sources |
|---|---|---|
| Marketplace web | `Header` combines announcement/city selector/search/cart/wishlist/account navigation; `Footer` holds policy/support links; `ProductCard` uses a 3:4 image, listing/featured/city badges, wishlist action, price and CTA; `ProductsFilter` supports rent/buy, city, category, size, sort, reset, and mobile filter panel; homepage uses banner and dynamic-section renderers. Lucide icons are used. | [Header](../src/components/layout/Header.tsx), [Footer](../src/components/layout/Footer.tsx), [ProductCard](../src/components/product/ProductCard.tsx), [ProductsFilter](../src/components/product/ProductsFilter.tsx), [DynamicSectionRenderer](../src/components/home/DynamicSectionRenderer.tsx) |
| Admin panel | `Sidebar` groups routes into Catalog, Merchandising, Sellers, Users, Delivery, and System. Product moderation uses a searchable/filterable table with status badges, action controls, loading/error/no-results text. | [Sidebar](../../admin-panel/admin-panel/components/Sidebar.tsx), [admin products](../../admin-panel/admin-panel/app/%28dashboard%29/products/page.tsx) |
| Mobile app | `AppHeader` provides city switch, wishlist/cart shortcuts, and search entry; `Button` centralizes primary/secondary/outline/ghost/danger, size, disabled, and loading variants; product cards carry listing/discount/verification/stock/lock indicators; shared home banner/category/section components. Ionicons are used. | [AppHeader](../../mobile-app/mobile-app/src/components/AppHeader.tsx), [Button](../../mobile-app/mobile-app/src/components/Button.tsx), [ProductCard](../../mobile-app/mobile-app/src/components/ProductCard.tsx), [home components](../../mobile-app/mobile-app/src/components/home/DynamicHomepageSection.tsx) |

The reviewed manifests define three separate app packages; no cross-app component/design-system package is declared. Sources: [marketplace package](../package.json), [admin package](../../admin-panel/admin-panel/package.json), [mobile package](../../mobile-app/mobile-app/package.json).

## Interaction And State Patterns

| Pattern | Current example | Sources |
|---|---|---|
| Responsive browse | Web cards use responsive 2/3/4-column grids and horizontal homepage carousels; filters have mobile and desktop layouts. | [ProductCard](../src/components/product/ProductCard.tsx), [ProductsFilter](../src/components/product/ProductsFilter.tsx), [DynamicSectionRenderer](../src/components/home/DynamicSectionRenderer.tsx) |
| City selection | Web header opens a city modal; mobile header opens city selection and mobile home toggles between the two local city constants. | [Header](../src/components/layout/Header.tsx), [CitySelectorModal](../src/components/layout/CitySelectorModal.tsx), [AppHeader](../../mobile-app/mobile-app/src/components/AppHeader.tsx), [HomeScreen](../../mobile-app/mobile-app/src/screens/Home/HomeScreen.tsx) |
| Browse without account | Mobile root navigation allows catalog tabs without a session; account-specific actions prompt login. | [RootNavigator](../../mobile-app/mobile-app/src/navigation/RootNavigator.tsx), [WishlistScreen](../../mobile-app/mobile-app/src/screens/Wishlist/WishlistScreen.tsx) |
| Seller mode | Mobile switches its bottom tabs to Seller Dashboard/Products/Orders/Store/Profile; marketplace web has a separate seller route group. | [MainTabNavigator](../../mobile-app/mobile-app/src/navigation/MainTabNavigator.tsx), [SellerTabNavigator](../../mobile-app/mobile-app/src/navigation/SellerTabNavigator.tsx), [seller routes](../src/app/seller/page.tsx) |

## Loading, Error, And Empty States

| App/screen | Existing state pattern | Sources |
|---|---|---|
| Marketplace cart | Signed-out prompt, empty-cart prompt, unavailable-item row, and disabled checkout when an item is unavailable. | [Cart page](../src/app/cart/page.tsx), [CartContext](../src/context/CartContext.tsx) |
| Marketplace wishlist | Signed-out prompt and empty-wishlist prompt with browse link. | [Wishlist page](../src/app/wishlist/page.tsx) |
| Marketplace checkout | Suspense “Loading Checkout…” fallback, loading-options message, processing spinner/button state, inline error message. | [Checkout page](../src/app/checkout/page.tsx) |
| Marketplace home sections | Empty section copy when a collection has no products. | [DynamicSectionRenderer](../src/components/home/DynamicSectionRenderer.tsx) |
| Admin dashboard | Centered “Loading…” while session/admin status resolves; protected dashboard redirects when unauthorized. | [dashboard layout](../../admin-panel/admin-panel/app/%28dashboard%29/layout.tsx) |
| Admin products | Loading row, visible error text, and “No products match this filter.” state. | [admin products](../../admin-panel/admin-panel/app/%28dashboard%29/products/page.tsx) |
| Mobile root/home | Root activity indicator during auth load; home error message, loading indicator, no-products/no-filter-match text, pull-to-refresh. | [RootNavigator](../../mobile-app/mobile-app/src/navigation/RootNavigator.tsx), [HomeScreen](../../mobile-app/mobile-app/src/screens/Home/HomeScreen.tsx) |
| Mobile cart/wishlist | Cart empty state and unavailable-item removal row; wishlist signed-out prompt, loading spinner, and empty state. | [CartScreen](../../mobile-app/mobile-app/src/screens/Cart/CartScreen.tsx), [WishlistScreen](../../mobile-app/mobile-app/src/screens/Wishlist/WishlistScreen.tsx) |
| Mobile product detail | Loading indicator, product error state, scheduled-drop lock state, and availability feedback. | [ProductDetailsScreen](../../mobile-app/mobile-app/src/screens/ProductDetails/ProductDetailsScreen.tsx) |

## OPEN QUESTIONS

1. Should storefront, admin, and mobile converge on one brand palette? Current source uses neutral/emerald storefront colors and pink/magenta admin/mobile tokens. Sources: [storefront CSS](../src/app/globals.css), [admin Tailwind](../../admin-panel/admin-panel/tailwind.config.ts), [mobile theme](../../mobile-app/mobile-app/src/constants/theme.ts).
2. Should the `font-serif` display treatment map to a named, bundled serif font? Storefront loads Outfit but no custom serif font. Sources: [root layout](../src/app/layout.tsx), [Header](../src/components/layout/Header.tsx), [ProductCard](../src/components/product/ProductCard.tsx).
3. Should the three apps establish shared spacing, type, radius, and component contracts, or remain independently themed? Sources: [three package manifests](../package.json), [admin package](../../admin-panel/admin-panel/package.json), [mobile package](../../mobile-app/mobile-app/package.json), [mobile theme](../../mobile-app/mobile-app/src/constants/theme.ts).
4. Should loading/error/empty-state copy and visual treatment be standardized across web, admin, and mobile? Current states are implemented locally by route/screen. Sources: [Checkout](../src/app/checkout/page.tsx), [admin products](../../admin-panel/admin-panel/app/%28dashboard%29/products/page.tsx), [HomeScreen](../../mobile-app/mobile-app/src/screens/Home/HomeScreen.tsx), [ProductDetailsScreen](../../mobile-app/mobile-app/src/screens/ProductDetails/ProductDetailsScreen.tsx).