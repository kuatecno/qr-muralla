// Helper endpoint to trigger Instagram comments scraper with latest post URLs
// Call this after your posts scraper completes

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  const APIFY_USER_ID = process.env.APIFY_USER_ID;
  const INSTAGRAM_COMMENTS_TASK_ID = process.env.INSTAGRAM_COMMENTS_TASK_ID; // You need to add this

  if (!APIFY_API_TOKEN || !APIFY_USER_ID || !INSTAGRAM_COMMENTS_TASK_ID) {
    return res.status(500).json({
      error: 'Missing configuration',
      message: 'APIFY_API_TOKEN, APIFY_USER_ID, and INSTAGRAM_COMMENTS_TASK_ID must be set'
    });
  }

  try {
    // 1. Get latest posts dataset
    const runsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs?userId=${APIFY_USER_ID}&token=${APIFY_API_TOKEN}&limit=20&status=SUCCEEDED&desc=true`
    );

    if (!runsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch runs' });
    }

    const runsData = await runsResponse.json();

    // Find posts dataset
    let postsRun = null;
    for (const run of runsData.data.items) {
      if (!run.defaultDatasetId) continue;

      const testResponse = await fetch(
        `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${APIFY_API_TOKEN}&limit=1`
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.length > 0 && (testData[0].shortCode || testData[0].displayUrl)) {
          postsRun = run;
          break;
        }
      }
    }

    if (!postsRun) {
      return res.status(404).json({ error: 'No posts dataset found' });
    }

    // 2. Get all post URLs from the dataset
    const postsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${postsRun.defaultDatasetId}/items?token=${APIFY_API_TOKEN}&limit=200`
    );

    if (!postsResponse.ok) {
      return res.status(500).json({ error: 'Failed to fetch posts' });
    }

    const posts = await postsResponse.json();
    const postUrls = posts.map(post =>
      post.url || `https://www.instagram.com/p/${post.shortCode}/`
    ).filter(Boolean);

    console.log('[Trigger Comments] Found', postUrls.length, 'post URLs');

    // 3. Trigger comments scraper task with these URLs
    const taskRunResponse = await fetch(
      `https://api.apify.com/v2/actor-tasks/${INSTAGRAM_COMMENTS_TASK_ID}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          directUrls: postUrls,
          resultsType: 'comments',
          resultsLimit: 200,
          addParentData: false,
        }),
      }
    );

    if (!taskRunResponse.ok) {
      const error = await taskRunResponse.text();
      console.error('[Trigger Comments] Failed to start task:', error);
      return res.status(500).json({ error: 'Failed to trigger comments scraper', details: error });
    }

    const taskRun = await taskRunResponse.json();

    return res.status(200).json({
      success: true,
      message: 'Comments scraper started',
      runId: taskRun.data.id,
      runUrl: `https://console.apify.com/actors/runs/${taskRun.data.id}`,
      postCount: postUrls.length
    });

  } catch (error) {
    console.error('[Trigger Comments] Error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
