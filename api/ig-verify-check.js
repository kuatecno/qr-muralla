// Serverless function to check Instagram verification status
// This avoids CORS issues by making the API call from the server

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const FLOWKICK_API_KEY = process.env.FLOWKICK_API_KEY || 'fk_4d28b904c9d90c9583d90a4f4bfd3de52144c8be83924757a45e756473e42c2d';
  const FLOWKICK_API_URL = 'https://flowkick.kua.cl/api/verification/check';

  try {
    const { session } = req.query;

    if (!session) {
      return res.status(400).json({ error: 'Missing session parameter' });
    }

    console.log('[IG Verify Check] Checking session:', session);

    // Make request to Flowkick API
    const response = await fetch(`${FLOWKICK_API_URL}?session=${session}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${FLOWKICK_API_KEY}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[IG Verify Check] API error:', data);
      return res.status(response.status).json({
        error: data.error || 'Failed to check verification status',
        details: data
      });
    }

    console.log('[IG Verify Check] Status:', data.status);
    
    // Return the response
    return res.status(200).json(data);

  } catch (error) {
    console.error('[IG Verify Check] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
