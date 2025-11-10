// Serverless function to serve events
// Vercel serverless function for /api/events endpoint
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return events data
  // In the future, this could fetch from a database or CMS
  const events = [
    {
      id: "feria-negrx",
      title: "Feria Negrx",
      description: "Música en vivo con artistas locales. Ambiente íntimo y acogedor.",
      date: "2025-10-25",
      start_time: "12:00",
      end_time: "23:00",
      place: "Carmen 1235",
      image: "/assets/img/eventos/venta-garage.jpg",
      category: "fashion y música",
      bookingUrl: "https://ig.me/m/muralla.cafe?ref=feria-negrx"
    },
    {
      id: "venta-garage",
      title: "Venta de Garage",
      description: "Remate de artículos de librería y ropa",
      date: "2025-11-02",
      time: "18:00",
      image: "/assets/img/eventos/venta-garage.jpg",
      category: "mercado",
      bookingUrl: "https://ig.me/m/muralla.cafe?ref=venta-garage"
    },
    {
      id: "inaeg",
      title: "Inaeguración Muralla Café",
      description: "musiquita y celebración de este gran comienzo",
      date: "2025-11-22",
      time: "19:30",
      image: "/assets/img/eventos/dino.jpg",
      category: "evento",
      bookingUrl: "https://ig.me/m/muralla.cafe?ref=inaeguración"
    }
  ];

  res.status(200).json(events);
}
