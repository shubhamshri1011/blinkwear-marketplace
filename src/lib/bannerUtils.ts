/**
 * Helper to resolve banner navigation links safely.
 * CRITICAL RULE: NEVER prefix /products/ to absolute URLs or paths starting with "/".
 */
export function resolveBannerHref(banner: {
  target_type?: string | null;
  target_value?: string | null;
}): string {
  const val = (banner.target_value || '').trim();

  // If no target value or target_type is none/unset, default to rentals catalog
  if (!val || banner.target_type === 'none') {
    return '/products?type=rent';
  }

  // 1. If target_value is an absolute HTTP/HTTPS URL, return it directly
  if (/^https?:\/\//i.test(val)) {
    return val;
  }

  // 2. If target_value already starts with a slash, return as an absolute pathname
  if (val.startsWith('/')) {
    return val;
  }

  // 3. Resolve by target_type
  switch (banner.target_type) {
    case 'product':
      return `/products/${val}`;
    case 'category':
    case 'subcategory':
      return `/category/${val}`;
    case 'url':
      return `/${val}`;
    default:
      return `/${val}`;
  }
}
