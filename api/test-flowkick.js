// Simple config test - no API call
export default async function handler(req, res) {
  return res.status(200).json({
    test: 'Config Test v2 - Simple',
    timestamp: new Date().toISOString(),
    env: {
      apiKeySet: !!process.env.FLOWKICK_API_KEY,
      apiKeyValue: process.env.FLOWKICK_API_KEY ? process.env.FLOWKICK_API_KEY.substring(0, 15) + '...' : 'NOT SET'
    }
  });
}
