// Serverless function to serve today's specials
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For now, return today's date with empty items
  // In the future, this could fetch from the Admin API or a database
  const today = {
    date: new Date().toISOString().slice(0, 10),
    items: [
      {
        id: "lasana",
        name: "Lasaña Casera",
        tags: ["sin procesar"],
        price: 6900,
        image: "/assets/img/prod-01.svg"
      },
      {
        id: "pizza",
        name: "Pizza Margarita",
        tags: ["sin procesar"],
        price: 5500,
        image: "/assets/img/prod-02.svg"
      },
      {
        id: "veggie",
        name: "Bowl Veggie",
        tags: ["vegano"],
        price: 6200,
        image: "/assets/img/prod-03.svg"
      }
    ]
  };

  res.status(200).json(today);
}
