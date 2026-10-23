import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getSubdomain, RESERVED_SLUGS } from '@/lib/store';

export async function proxy(request: NextRequest) {
  // Exclude external webhooks from session refreshing / middleware processing
  if (request.nextUrl.pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next();
  }

  // 1. Process Supabase auth session
  const sessionResponse = await updateSession(request);

  // 2. Hostname-based subdomain detection
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const testSubdomain =
    request.headers.get('x-subdomain') || request.nextUrl.searchParams.get('__subdomain');
  const subdomain = testSubdomain || getSubdomain(host);

  if (subdomain && !RESERVED_SLUGS.has(subdomain.toLowerCase())) {
    const cleanSubdomain = subdomain.toLowerCase();
    const url = request.nextUrl.clone();
    const pathname = url.pathname;

    // Pass store subdomain in request headers so Server Components can read it via headers()
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-store-subdomain', cleanSubdomain);

    // If root of subdomain, rewrite internally to /store/[slug]
    if (pathname === '/') {
      url.pathname = `/store/${cleanSubdomain}`;
      const rewriteResponse = NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });

      // Preserve cookies and set store headers
      rewriteResponse.headers.set('x-store-subdomain', cleanSubdomain);
      sessionResponse.cookies.getAll().forEach((c) => {
        rewriteResponse.cookies.set(c.name, c.value, c);
      });
      return rewriteResponse;
    }

    // Set header on sessionResponse for other routes
    sessionResponse.headers.set('x-store-subdomain', cleanSubdomain);
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, icons, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
