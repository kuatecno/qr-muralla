// Manual endpoint to trigger Instagram refresh
// Visit this URL to update posts: https://qr.murallacafe.cl/api/refresh-instagram?secret=YOUR_SECRET

export default async function handler(req, res) {
  const REFRESH_SECRET = process.env.INSTAGRAM_REFRESH_SECRET || 'muralla2025';
  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

  // Simple authentication
  if (req.query.secret !== REFRESH_SECRET) {
    return res.status(401).json({ error: 'Unauthorized - invalid secret' });
  }

  if (!APIFY_API_TOKEN) {
    return res.status(500).json({ error: 'Missing APIFY_API_TOKEN' });
  }

  try {
    console.log('[Refresh] Starting Instagram scrape...');

    // Trigger Apify Instagram scraper
    const actorId = 'apify/instagram-profile-scraper';

    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernames: ['muralla.cafe'],
          resultsLimit: 10,
        }),
      }
    );

    if (!runResponse.ok) {
      const error = await runResponse.text();
      console.error('[Refresh] Failed to start scraper:', error);
      return res.status(500).json({ error: 'Failed to start scraper', details: error });
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const defaultDatasetId = runData.data.defaultDatasetId;

    console.log('[Refresh] Scraper started:', { runId, defaultDatasetId });

    res.status(200).json({
      success: true,
      message: 'Instagram scraper triggered successfully. Posts will update in about 30 seconds.',
      runId,
      datasetId: defaultDatasetId,
      timestamp: new Date().toISOString(),
      tip: 'Refresh your website in 30 seconds to see new posts'
    });

  } catch (error) {
    console.error('[Refresh] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
