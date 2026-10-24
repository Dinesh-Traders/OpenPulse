/**
 * Vercel Serverless Function — /api/issues
 *
 * Proxies GitHub Search API with a server-side token.
 * Token never reaches the browser.
 *
 * Query params forwarded: q, sort, order, per_page
 */
export default async function handler(req, res) {
  // CORS — allow only our own origin in production
  const origin = req.headers.origin || '';
  const allowed = [
    'https://openpulse.vercel.app',
    'https://open-pulse.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Forward only safe query params
  const { q, sort, order, per_page } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter: q' });
  }

  const params = new URLSearchParams({
    q,
    sort:     sort     || 'created',
    order:    order    || 'desc',
    per_page: per_page || '100',
  });

  const githubUrl = `https://api.github.com/search/issues?${params}`;

  try {
    const token = process.env.GITHUB_TOKEN;

    const headers = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const upstream = await fetch(githubUrl, { headers });

    // Pass rate-limit headers to client so UI can inform users
    const rateLimitHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'x-ratelimit-used',
    ];
    rateLimitHeaders.forEach(h => {
      const val = upstream.headers.get(h);
      if (val) res.setHeader(h, val);
    });

    // Cache successful responses for 5 minutes at the CDN edge
    if (upstream.ok) {
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    }

    const data = await upstream.json();
    return res.status(upstream.status).json(data);

  } catch (err) {
    console.error('[OpenPulse API]', err.message);
    return res.status(502).json({ error: 'Upstream request failed', detail: err.message });
  }
}
