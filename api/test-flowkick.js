// Test endpoint to diagnose Flowkick API connection
export default async function handler(req, res) {
  const FLOWKICK_API_KEY = process.env.FLOWKICK_API_KEY || 'fk_4d28b904c9d90c9583d90a4f4bfd3de52144c8be83924757a45e756473e42c2d';
  const FLOWKICK_API_URL = 'https://flowkick.kua.cl/api/verification/generate';

  try {
    const response = await fetch(FLOWKICK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLOWKICK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_website: 'qr.murallacafe.cl',
        external_user_id: 'diagnostic-test',
        expires_in_minutes: 10
      })
    });

    const responseText = await response.text();

    return res.status(200).json({
      test: 'Flowkick API Connection Test',
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      responsePreview: responseText.substring(0, 500),
      isJSON: responseText.startsWith('{'),
      apiKeySet: !!process.env.FLOWKICK_API_KEY,
      apiKeyPreview: FLOWKICK_API_KEY.substring(0, 10) + '...'
    });
  } catch (error) {
    return res.status(500).json({
      test: 'Flowkick API Connection Test',
      error: error.message,
      stack: error.stack
    });
  }
}
