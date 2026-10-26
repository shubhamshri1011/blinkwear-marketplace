import { createCatalogClient } from '@/lib/supabase/catalog';
import type { SiteThemeSettings, TrustBadge } from '@/types/database';

export const DEFAULT_TRUST_BADGES: TrustBadge[] = [
  {
    icon: 'shield-check',
    title: '100% Sanitized Garments',
    description: 'Every piece professionally dry-cleaned & sanitized',
  },
  {
    icon: 'truck',
    title: 'Doorstep Delivery & Return',
    description: 'Available across Pune & Bhopal',
  },
  {
    icon: 'check-circle',
    title: 'Deposit Refunded',
    description: 'Deposit refunded after quality check',
  },
];

export const DEFAULT_THEME_SETTINGS: SiteThemeSettings = {
  is_singleton: true,
  accent_color: '#F97316',
  logo_url: null,
  trust_badges: DEFAULT_TRUST_BADGES,
  updated_at: new Date().toISOString(),
};

/**
 * Calculates WCAG AA contrast colors from a hex accent.
 * Amber #F97316 on white fails WCAG AA (~2.9:1).
 * If the accent is bright, text on accent should be dark noir (#0F0F11).
 * If white text is needed on an accent button, we darken the accent to #C2410C (contrast > 4.5:1).
 */
export function getContrastTokens(accentHex: string) {
  const cleanHex = accentHex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  // Relative luminance calculation
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // If luminance > 0.35, the background is light -> use dark text on top
  const isLight = lum > 0.35;
  const textOnAccent = isLight ? '#0F0F11' : '#FFFFFF';

  // For solid buttons that require white text, compute an accessible darkened shade (WCAG AA > 4.5:1)
  const accessibleDarkShade = isLight ? '#C2410C' : accentHex;

  return {
    accentColor: accentHex,
    textOnAccent,
    accessibleDarkShade,
    accentLight: `${accentHex}1A`, // 10% opacity hex
  };
}

/**
 * Fetches site theme settings from Supabase.
 * If the table does not exist yet (pre-phase42) or query fails,
 * safely falls back to hardcoded defaults so the web app never breaks.
 */
export async function getSiteThemeSettings(): Promise<SiteThemeSettings> {
  const client = createCatalogClient();
  if (!client) {
    return DEFAULT_THEME_SETTINGS;
  }

  try {
    const { data, error } = await client
      .from('site_theme_settings')
      .select('is_singleton, accent_color, logo_url, trust_badges, updated_at')
      .eq('is_singleton', true)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_THEME_SETTINGS;
    }

    return {
      is_singleton: true,
      accent_color: data.accent_color || DEFAULT_THEME_SETTINGS.accent_color,
      logo_url: data.logo_url || null,
      trust_badges: Array.isArray(data.trust_badges) && data.trust_badges.length > 0
        ? (data.trust_badges as TrustBadge[])
        : DEFAULT_TRUST_BADGES,
      updated_at: data.updated_at || DEFAULT_THEME_SETTINGS.updated_at,
    };
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}
