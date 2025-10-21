export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
  const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

  if (!APIFY_API_TOKEN || !INSTAGRAM_USER_ID) {
    return res.status(500).json({
      error: 'Missing configuration',
      message: 'APIFY_API_TOKEN and INSTAGRAM_USER_ID must be set in environment variables'
    });
  }

  try {
    // Use Apify's Instagram Profile Scraper
    const actorId = 'apify/instagram-profile-scraper';

    // Start the actor run
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernames: [`${INSTAGRAM_USER_ID}`],
          resultsLimit: 10,
        }),
      }
    );

    if (!runResponse.ok) {
      console.error('Apify run failed:', await runResponse.text());
      return res.status(500).json({ error: 'Failed to start Apify scraper' });
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;

    // Wait for the run to complete (with timeout)
    let status = 'RUNNING';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max

    while (status === 'RUNNING' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const statusResponse = await fetch(
        `https://api.apify.com/v2/acts/${actorId}/runs/${runId}?token=${APIFY_API_TOKEN}`
      );

      const statusData = await statusResponse.json();
      status = statusData.data.status;
      attempts++;
    }

    if (status !== 'SUCCEEDED') {
      console.error('Apify run did not succeed:', status);
      return res.status(500).json({ error: 'Scraper did not complete successfully' });
    }

    // Fetch the results
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/acts/${actorId}/runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`
    );

    if (!resultsResponse.ok) {
      console.error('Failed to fetch results:', await resultsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch results' });
    }

    const results = await resultsResponse.json();

    // Transform Apify data to our format
    const posts = results.map((post, index) => ({
      id: post.shortCode || `post-${index}`,
      image: post.displayUrl || post.thumbnailUrl,
      link: `https://www.instagram.com/p/${post.shortCode}/`,
      caption: post.caption || '',
      date: post.timestamp ? new Date(post.timestamp * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }));

    res.status(200).json(posts.slice(0, 10)); // Return max 10 posts

  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
