// Serverless function to proxy Instagram verification requests to Flowkick
// This avoids CORS issues by making the API call from the server

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const FLOWKICK_API_KEY = process.env.FLOWKICK_API_KEY || 'fk_4d28b904c9d90c9583d90a4f4bfd3de52144c8be83924757a45e756473e42c2d';
  const FLOWKICK_API_URL = 'https://flowkick.kua.cl/api/verification/generate';

  try {
    const { external_user_id, webhook_url, expires_in_minutes } = req.body;

    console.log('[IG Verify Proxy] Generating code for user:', external_user_id);
    console.log('[IG Verify Proxy] API URL:', FLOWKICK_API_URL);
    console.log('[IG Verify Proxy] API Key:', FLOWKICK_API_KEY.substring(0, 10) + '...');

    // Make request to Flowkick API
    const response = await fetch(FLOWKICK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLOWKICK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_website: 'qr.murallacafe.cl',
        external_user_id,
        webhook_url: webhook_url || 'https://qr.murallacafe.cl/api/ig-webhook',
        expires_in_minutes: expires_in_minutes || 10
      })
    });

    console.log('[IG Verify Proxy] Response status:', response.status);
    console.log('[IG Verify Proxy] Response headers:', Object.fromEntries(response.headers));

    // Get the raw response text first to handle HTML responses
    const responseText = await response.text();
    console.log('[IG Verify Proxy] Response body preview:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[IG Verify Proxy] Failed to parse JSON:', parseError.message);
      console.error('[IG Verify Proxy] Raw response:', responseText.substring(0, 1000));
      throw new Error(`Flowkick API returned non-JSON response: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error('[IG Verify Proxy] API error:', data);
      return res.status(response.status).json({
        error: data.error || 'Failed to generate verification code',
        details: data
      });
    }

    console.log('[IG Verify Proxy] Code generated successfully');
    
    // Return the response
    return res.status(200).json(data);

  } catch (error) {
    console.error('[IG Verify Proxy] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
