export default function handler(req, res) {
  res.status(200).json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
    murallaApiKey: process.env.MURALLA_API_KEY || ''
  });
}
