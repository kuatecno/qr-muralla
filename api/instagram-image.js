// Proxy endpoint to serve Instagram images
// This bypasses CORS restrictions by fetching images server-side

export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  // Only allow Instagram and TikTok CDN URLs
  const allowedDomains = [
    'cdninstagram.com',
    'fbcdn.net',
    'tiktokcdn',  // Matches tiktokcdn.com, tiktokcdn-us.com, etc
    'tiktok.com',
    'bytedance.com'
  ];

  const isAllowed = allowedDomains.some(domain => url.includes(domain));

  if (!isAllowed) {
    console.error('[Image Proxy] Blocked URL:', url);
    return res.status(403).json({ error: 'Only Instagram and TikTok CDN URLs allowed' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch image' });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Set caching headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400'); // Cache for 24 hours

    return res.status(200).send(Buffer.from(imageBuffer));

  } catch (error) {
    console.error('Error proxying image:', error);
    return res.status(500).json({ error: 'Failed to proxy image' });
  }
}
