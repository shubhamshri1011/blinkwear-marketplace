import React from 'react';

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

/**
 * Escapes characters that can break out of HTML <script> tags or cause JavaScript parsing issues.
 * - '<' -> \u003c (prevents closing </script> breakouts)
 * - '>' -> \u003e
 * - '&' -> \u0026
 * - U+2028 (Line Separator) -> \u2028
 * - U+2029 (Paragraph Separator) -> \u2029
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function JsonLd({ data }: JsonLdProps) {
  const safeJson = safeJsonLdStringify(data);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
