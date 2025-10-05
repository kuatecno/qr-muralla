Muralla QR Landing (Prototype)

What’s inside
- Single-scroll landing with:
  - Sticky header + “Hoy” specials ticker with CTA
  - Hero carousel (Y2K vibe) with Instagram link
  - Quick links (Instagram, Maps, Proveedores WhatsApp/Email, Email)
  - Category chips and product grid (vegano, low carb / sin azúcar, sin gluten, sin procesar)
  - Product sheet with Reservar/Comprar via WhatsApp
  - Footer: “Hecho con ❤ en Chile”

Run locally
- Easiest: `bash preview.sh` (prefers Node server with APIs; falls back to Python)
- Node directly: `node server.js` then visit `http://127.0.0.1:8000/`.
- Python fallback (static only): `python3 -m http.server 8000` → APIs will not be available; the site will use local JSON.

API endpoints
- `GET /api/config` → site config (instagram, booking, hero slides)
- `GET /api/today` → `{ date, items: [{ id, name, description, price, image, instagram, tags[] }] }`
- `GET /api/products` → `[{ id, name, description, price, image, instagram, tags[] }]`

Backend sources (choose one)
- Filesystem (e.g., Muralla 5.0 export):
  - Set env vars and run:
    - `BACKEND_MODE=fs BACKEND_FS_PATH="/Users/kavi/Sharedcodingprojects/Muralla 5.0/out" node server.js`
  - Expects files in that folder: `config.json`, `today.json`, `products.json`.
- HTTP proxy:
  - `BACKEND_MODE=http BACKEND_HTTP_BASE="https://your-backend.example" node server.js`
  - Optional path overrides: `BACKEND_HTTP_CONFIG_PATH`, `BACKEND_HTTP_TODAY_PATH`, `BACKEND_HTTP_PRODUCTS_PATH`

Notes
- If the chosen source is unavailable, the server falls back to `assets/data/*.json`.
- Normalization ensures products have: `id, name, description, price, image, instagram, tags[]`.

Configure links and booking
- Edit `assets/data/config.json`:
  - `instagram`: profile URL
  - `mapsUrl`: Google Maps link
  - `email`: public email
  - `providers.whatsapp`: phone for proveedores (e.g., +569...)
  - `providers.email`: proveedores email
  - `booking.mode`: `whatsapp`
  - `booking.whatsapp`: phone used by “Reservar/Comprar”
  - `booking.message`: template, supports `{item}` and `{date}`

Data sources
- Today’s specials: `assets/data/today.json`
- Products: `assets/data/products.json`
- Hero slides: `assets/data/config.json` → `hero.slides[]` (add image paths if available)

Images
- Drop images into `assets/img/` and reference them in JSON.
- If an image path is empty/missing, a gradient placeholder is shown.

Connect to Muralla 5.0 (later)
- Option A (static handoff): Muralla 5.0 exports JSON to this repo’s `assets/data/` (overwrite `today.json` and `products.json`) as part of its publish flow.
- Option B (proxy API): Host an API from Muralla 5.0 and point this site to it; swap the URLs in `assets/js/app.js` (`CONFIG_URL`, `TODAY_URL`, `PRODUCTS_URL`) or add a small adapter.
- Option C (build sync): Add a build script to copy JSON from `../Muralla 5.0/out/` into `assets/data/` before deploy.

Notes
- Tags are matched case-insensitively. Supported chips: `vegano`, `low carb / sin azúcar`, `sin gluten`, `sin procesar`.
- Ticker duplicates items to create a seamless marquee.
- `index.html`/CSS/JS are framework-free for simplicity; can be migrated to Next.js/Astro later.
