'use client';

import { useEffect } from 'react';
import { getContrastTokens } from '@/lib/theme';

interface ThemeStyleInjectorProps {
  accentColor: string;
}

export function ThemeStyleInjector({ accentColor }: ThemeStyleInjectorProps) {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const tokens = getContrastTokens(accentColor);
    const root = document.documentElement;

    root.style.setProperty('--accent-color', tokens.accentColor);
    root.style.setProperty('--accent-contrast', tokens.textOnAccent);
    root.style.setProperty('--accent-dark', tokens.accessibleDarkShade);
    root.style.setProperty('--accent-light', tokens.accentLight);
  }, [accentColor]);

  const tokens = getContrastTokens(accentColor);

  return (
    <style dangerouslySetInnerHTML={{
      __html: `
        :root {
          --accent-color: ${tokens.accentColor};
          --accent-contrast: ${tokens.textOnAccent};
          --accent-dark: ${tokens.accessibleDarkShade};
          --accent-light: ${tokens.accentLight};
        }
      `,
    }} />
  );
}
