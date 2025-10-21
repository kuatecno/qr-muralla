export default async function handler(req, res) {
  // Verify this is a cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

  if (!APIFY_API_TOKEN) {
    return res.status(500).json({ error: 'Missing APIFY_API_TOKEN' });
  }

  try {
    console.log('[Cron] Starting weekly Instagram scrape...');

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
      console.error('[Cron] Failed to start scraper:', error);
      return res.status(500).json({ error: 'Failed to start scraper', details: error });
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    const defaultDatasetId = runData.data.defaultDatasetId;

    console.log('[Cron] Scraper started:', { runId, defaultDatasetId });

    // Don't wait for completion - let it run in background
    // The dataset ID will be used by the regular API endpoint

    res.status(200).json({
      success: true,
      message: 'Instagram scraper triggered successfully',
      runId,
      datasetId: defaultDatasetId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
