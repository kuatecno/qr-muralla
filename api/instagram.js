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
    // Get recent successful runs from this user's actor runs
    // We'll check multiple runs to find the Instagram scraper specifically
    const runsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs?userId=${APIFY_USER_ID}&token=${APIFY_API_TOKEN}&limit=10&status=SUCCEEDED&desc=true`
    );

    if (!runsResponse.ok) {
      console.error('Failed to fetch runs:', await runsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch Instagram data' });
    }

    const runsData = await runsResponse.json();

    if (!runsData.data?.items?.length) {
      return res.status(404).json({ error: 'No Instagram data available yet' });
    }

    // Filter for Instagram runs specifically by checking multiple recent runs
    // Instagram posts have 'shortCode', 'displayUrl', 'caption' fields
    // TikTok has 'videoMeta', 'authorMeta', 'createTimeISO'
    console.log('[Instagram API] Total runs found:', runsData.data.items.length);

    let latestRun = null;
    for (const run of runsData.data.items.slice(0, 10)) {
      if (!run.defaultDatasetId) continue;

      // Test this dataset to see if it's Instagram data
      const testResponse = await fetch(
        `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${APIFY_API_TOKEN}&limit=1`
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.length > 0) {
          const item = testData[0];
          // Check if this looks like Instagram data (has shortCode or displayUrl)
          if (item.shortCode || item.displayUrl || item.displayUrl || (item.type && item.type !== 'video')) {
            console.log('[Instagram API] Found Instagram dataset from actor:', run.actId);
            latestRun = run;
            break;
          }
        }
      }
    }

    if (!latestRun) {
      return res.status(404).json({ error: 'No Instagram dataset found in recent runs' });
    }
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
    console.log('[Instagram API] Run info:', {
      actorId: latestRun.actId,
      actorName: latestRun.actId,
      buildId: latestRun.buildId,
      startedAt: latestRun.startedAt
    });
    console.log('[Instagram API] Dataset items count:', results.length);
    if (results.length > 0) {
      console.log('[Instagram API] First item sample:', JSON.stringify(results[0], null, 2));
      console.log('[Instagram API] First item keys:', Object.keys(results[0]));
      console.log('[Instagram API] Has comments?', 'latestComments' in results[0] || 'comments' in results[0]);
    }

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

      // Extract comments if available (latestComments is the field used by Apify Instagram Scraper)
      const comments = post.latestComments || post.comments || [];
      const commentCount = post.commentsCount || comments.length || 0;

      // Check if this is a carousel post
      if (post.type === 'Sidecar' && post.childPosts && post.childPosts.length > 0) {
        // Add each image from the carousel as a separate post
        post.childPosts.forEach((childPost, childIndex) => {
          const imageUrl = childPost.displayUrl || childPost.url;
          allPosts.push({
            id: `${post.shortCode}-${childIndex}`,
            image: imageUrl ? `/api/instagram-image?url=${encodeURIComponent(imageUrl)}` : '',
            link: postUrl,
            caption: caption,
            date: dateStr,
            comments: comments,
            commentCount: commentCount,
          });
        });
      } else {
        // Regular post
        const imageUrl = post.displayUrl || post.thumbnailUrl || post.url;
        allPosts.push({
          id: post.shortCode || `post-${index}`,
          image: imageUrl ? `/api/instagram-image?url=${encodeURIComponent(imageUrl)}` : '',
          link: postUrl,
          caption: caption,
          date: dateStr,
          comments: comments,
          commentCount: commentCount,
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
