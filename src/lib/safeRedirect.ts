/**
 * Sanitize a redirect path from user input (e.g. query parameter).
 * Returns '/' if the input is not a safe relative path.
 *
 * Rejects:
 * - Protocol-relative URLs (//evil.com)
 * - Backslash tricks (\/evil.com, /foo\..\bar)
 * - Whitespace and control characters (raw ASCII 0x00-0x1F, 0x7F-0x9F)
 * - URL-encoded control characters (%00, %0d, %0a, etc.)
 * - Absolute URLs with scheme (https://evil.com)
 */
export function safeRedirect(rawRedirect: string | null | undefined): string {
  if (!rawRedirect) return '/';
  const trimmed = rawRedirect.trim();
  // Reject raw control characters and DEL/C1 controls (0x00-0x1F, 0x7F-0x9F)
  if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) return '/';
  // Reject URL-encoded control characters (%00-%1F, %7F)
  if (/%(0[0-9a-fA-F]|1[0-9a-fA-F]|7[fF])/.test(trimmed)) return '/';
  // Must start with exactly one '/', no '//', no backslashes, no whitespace
  if (!/^\/(?![\/\\])[^\\\s]*$/.test(trimmed)) return '/';
  return trimmed;
}

