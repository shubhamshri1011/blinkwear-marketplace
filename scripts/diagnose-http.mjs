// scripts/diagnose-http.mjs
// Inspects HTTP status, response headers, and HTML output from dev server for key routes

const routes = [
  '/',
  '/login',
  '/register',
  '/become-a-seller',
  '/products',
  '/seller/store',
  '/cart',
];

console.log('--- Testing Next.js Dev Server HTTP Responses ---');

for (const r of routes) {
  try {
    const res = await fetch(`http://localhost:3000${r}`, {
      headers: {
        'Host': 'localhost:3000',
        'User-Agent': 'BlinkWear-Diag-Agent/1.0',
      },
      redirect: 'manual',
    });
    console.log(`Route ${r.padEnd(20)} => Status: ${res.status} ${res.statusText}`);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      console.log(`  Set-Cookie: ${setCookie.slice(0, 100)}...`);
    }
    const location = res.headers.get('location');
    if (location) {
      console.log(`  Redirects to: ${location}`);
    }
  } catch (err) {
    console.error(`Route ${r} FAILED:`, err.message);
  }
}
