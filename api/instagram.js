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
    // Get the latest successful run from this user's actor runs
    // This will always fetch the most recent data from Apify's scheduled scraper
    const runsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs?userId=${APIFY_USER_ID}&token=${APIFY_API_TOKEN}&limit=1&status=SUCCEEDED&desc=true`
    );

    if (!runsResponse.ok) {
      console.error('Failed to fetch runs:', await runsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch Instagram data' });
    }

    const runsData = await runsResponse.json();

    if (!runsData.data?.items?.length) {
      return res.status(404).json({ error: 'No Instagram data available yet' });
    }

    const latestRun = runsData.data.items[0];
    const datasetId = latestRun.defaultDatasetId;

    if (!datasetId) {
      return res.status(404).json({ error: 'No dataset found' });
    }

    // Fetch posts from the latest dataset
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&limit=10`
    );

    if (!resultsResponse.ok) {
      console.error('Failed to fetch dataset:', await resultsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch Instagram posts' });
    }

    const results = await resultsResponse.json();

    // Log the raw data to help debug
    console.log('[Instagram API] Dataset items count:', results.length);
    console.log('[Instagram API] First item sample:', JSON.stringify(results[0], null, 2));

    // Transform Apify data to our format
    // Handle carousel posts - expand them into individual posts
    const allPosts = [];

    results.forEach((post, index) => {
      let dateStr = new Date().toISOString().split('T')[0];

      // Try to parse timestamp
      if (post.timestamp) {
        try {
          const timestamp = typeof post.timestamp === 'string' ? Date.parse(post.timestamp) : post.timestamp * 1000;
          if (!isNaN(timestamp)) {
            dateStr = new Date(timestamp).toISOString().split('T')[0];
          }
        } catch (e) {
          console.error('Error parsing timestamp:', post.timestamp, e);
        }
      }

      const postUrl = post.url || `https://www.instagram.com/p/${post.shortCode}/`;
      const caption = post.caption || '';

      // Check if this is a carousel post
      if (post.type === 'Sidecar' && post.childPosts && post.childPosts.length > 0) {
        // Add each image from the carousel as a separate post
        post.childPosts.forEach((childPost, childIndex) => {
          allPosts.push({
            id: `${post.shortCode}-${childIndex}`,
            image: childPost.displayUrl || childPost.url,
            link: postUrl,
            caption: caption,
            date: dateStr,
          });
        });
      } else {
        // Regular post
        allPosts.push({
          id: post.shortCode || `post-${index}`,
          image: post.displayUrl || post.thumbnailUrl || post.url,
          link: postUrl,
          caption: caption,
          date: dateStr,
        });
      }
    });

    const posts = allPosts;

    console.log('[Instagram API] Total posts after processing:', posts.length);
    console.log('[Instagram API] Sample transformed post:', JSON.stringify(posts[0], null, 2));

    // Set cache headers - cache for 1 hour
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).json(posts.slice(0, 10));

  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
