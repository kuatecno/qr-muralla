export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  const APIFY_USER_ID = process.env.APIFY_USER_ID;

  if (!APIFY_API_TOKEN || !APIFY_USER_ID) {
    return res.status(500).json({
      error: 'Missing configuration',
      message: 'APIFY_API_TOKEN and APIFY_USER_ID must be set in environment variables'
    });
  }

  try {
    // Get the latest successful TikTok scraper run from this user
    const runsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs?userId=${APIFY_USER_ID}&token=${APIFY_API_TOKEN}&limit=1&status=SUCCEEDED&desc=true`
    );

    if (!runsResponse.ok) {
      console.error('Failed to fetch TikTok runs:', await runsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch TikTok data' });
    }

    const runsData = await runsResponse.json();

    if (!runsData.data?.items?.length) {
      return res.status(404).json({ error: 'No TikTok data available yet' });
    }

    const latestRun = runsData.data.items[0];
    const datasetId = latestRun.defaultDatasetId;

    if (!datasetId) {
      return res.status(404).json({ error: 'No dataset found' });
    }

    // Fetch TikTok videos from the latest dataset
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&limit=10`
    );

    if (!resultsResponse.ok) {
      console.error('Failed to fetch TikTok dataset:', await resultsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch TikTok videos' });
    }

    const results = await resultsResponse.json();

    console.log('[TikTok API] Dataset items count:', results.length);
    console.log('[TikTok API] First item sample:', JSON.stringify(results[0], null, 2));

    // Transform Apify TikTok data to our format
    const posts = results.map((video, index) => {
      let dateStr = new Date().toISOString().split('T')[0];

      // Try to parse timestamp
      if (video.createTimeISO) {
        try {
          const timestamp = Date.parse(video.createTimeISO);
          if (!isNaN(timestamp)) {
            dateStr = new Date(timestamp).toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error parsing TikTok timestamp:', video.createTimeISO, e);
        }
      }

      // Get video thumbnail from covers or author avatar
      const imageUrl = video.videoMeta?.coverUrl ||
                      video.videoMeta?.dynamicCover ||
                      video.authorMeta?.avatar ||
                      video.covers?.default;

      // Extract comments and engagement metrics
      const comments = video.comments || [];
      const commentCount = video.commentCount || comments.length || 0;
      const likesCount = video.diggCount || video.likesCount || 0;

      return {
        id: video.id || `tiktok-${index}`,
        image: imageUrl ? `/api/instagram-image?url=${encodeURIComponent(imageUrl)}` : '',
        link: video.webVideoUrl || `https://www.tiktok.com/@muralla.cafe/video/${video.id}`,
        caption: video.text || '',
        date: dateStr,
        platform: 'tiktok',
        comments: comments,
        commentCount: commentCount,
        likesCount: likesCount,
      };
    });

    console.log('[TikTok API] Total posts after processing:', posts.length);
    console.log('[TikTok API] Sample transformed post:', JSON.stringify(posts[0], null, 2));

    // Set cache headers - cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).json(posts.slice(0, 10));

  } catch (error) {
    console.error('Error fetching TikTok videos:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
