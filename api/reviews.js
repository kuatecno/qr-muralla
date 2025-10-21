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
    const runsResponse = await fetch(
      `https://api.apify.com/v2/actor-runs?userId=${APIFY_USER_ID}&token=${APIFY_API_TOKEN}&limit=10&status=SUCCEEDED&desc=true`
    );

    if (!runsResponse.ok) {
      console.error('Failed to fetch runs:', await runsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch Google Maps data' });
    }

    const runsData = await runsResponse.json();

    if (!runsData.data?.items?.length) {
      return res.status(404).json({ error: 'No Google Maps data available yet' });
    }

    // Find Google Maps scraper dataset by checking for reviews field
    let mapsRun = null;
    for (const run of runsData.data.items.slice(0, 10)) {
      if (!run.defaultDatasetId) continue;

      const testResponse = await fetch(
        `https://api.apify.com/v2/datasets/${run.defaultDatasetId}/items?token=${APIFY_API_TOKEN}&limit=1`
      );

      if (testResponse.ok) {
        const testData = await testResponse.json();
        if (testData.length > 0) {
          const item = testData[0];
          // Check if this looks like Google Maps data (has reviews, totalScore, etc.)
          if (item.reviews || item.totalScore || item.placeId) {
            console.log('[Reviews API] Found Google Maps dataset from run:', run.id);
            mapsRun = run;
            break;
          }
        }
      }
    }

    if (!mapsRun) {
      return res.status(404).json({ error: 'No Google Maps dataset found in recent runs' });
    }

    const datasetId = mapsRun.defaultDatasetId;

    // Fetch the place data (should be just 1 item - the Muralla cafe)
    const resultsResponse = await fetch(
      `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_TOKEN}&limit=1`
    );

    if (!resultsResponse.ok) {
      console.error('Failed to fetch dataset:', await resultsResponse.text());
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }

    const results = await resultsResponse.json();

    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No place data found' });
    }

    const place = results[0];

    console.log('[Reviews API] Place:', place.title);
    console.log('[Reviews API] Reviews count:', place.reviews?.length || 0);

    // Log first review structure to debug
    if (place.reviews && place.reviews.length > 0) {
      console.log('[Reviews API] First review keys:', Object.keys(place.reviews[0]));
      console.log('[Reviews API] First review sample:', JSON.stringify(place.reviews[0], null, 2));
    }

    // Transform Apify data to match existing format
    const reviews = (place.reviews || [])
      .map(review => {
        return {
          author_name: review.name,
          rating: review.stars || 0,
          text: review.text || review.textTranslated || '',
          time: review.publishAt ? new Date(review.publishAt).getTime() / 1000 : Date.now() / 1000,
          profile_photo_url: review.reviewerPhotoUrl || review.reviewerUrl || '',
          relative_time_description: review.publishedAtDate || '',
          images: review.reviewImageUrls || []
        };
      })
      // Filter: only 4+ stars and reviews with text
      .filter(review => {
        const hasText = review.text && review.text.trim().length > 0;
        const isHighRated = review.rating >= 4;
        return hasText && isHighRated;
      });

    // Return all filtered reviews (frontend will handle pagination)
    res.status(200).json({
      reviews: reviews,
      rating: place.totalScore || 0,
      totalReviews: reviews.length
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
