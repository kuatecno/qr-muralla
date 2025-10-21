// Import color palette
import { COLOR_PALETTE } from './color-palette.js';

// API Configuration
const MURALLA_API_URL = "https://muralla-kua.vercel.app";

// Prefer local JSON files for fast loading; fall back to Muralla 5.0 API if needed
const CONFIG_URLS = ["/assets/data/config.json", "/api/config"];
const TODAY_URLS = ["/assets/data/today.json", "/api/today"];
const PRODUCTS_URLS = ["/assets/data/products.json"]; // Use local file for fast loading
const EVENTS_URLS = ["/assets/data/events.json", "/api/events"];
const INSTAGRAM_URLS = ["/api/instagram", "/assets/data/instagram.json"];
const TIKTOK_URLS = ["/api/tiktok"];

const el = {
  tickerTrack: document.getElementById("tickerTrack"),
  ctaTop: document.getElementById("ctaTop"),
  carouselTrack: document.getElementById("carouselTrack"),
  prevSlide: document.getElementById("prevSlide"),
  nextSlide: document.getElementById("nextSlide"),
  igLink: document.getElementById("igLink"),
  brandLogo: document.getElementById("brandLogo"),
  brandText: document.getElementById("brandText"),
  categoryChips: document.getElementById("categoryChips"),
  subcategoryChips: document.getElementById("subcategoryChips"),
  chips: document.getElementById("chips"),
  products: document.getElementById("products"),
  qaInstagram: document.getElementById("qaInstagram"),
  qaMaps: document.getElementById("qaMaps"),
  qaProvWA: document.getElementById("qaProvWA"),
  qaProvEmail: document.getElementById("qaProvEmail"),
  qaEmail: document.getElementById("qaEmail"),
  fInstagram: document.getElementById("fInstagram"),
  fMaps: document.getElementById("fMaps"),
  fProvWA: document.getElementById("fProvWA"),
  fProvEmail: document.getElementById("fProvEmail"),
  fEmail: document.getElementById("fEmail"),
  mapOpen: document.getElementById("mapOpen"),
  sheet: document.getElementById("productSheet"),
  sheetBody: document.getElementById("sheetBody"),
  sheetClose: document.getElementById("sheetClose"),
  searchTrigger: document.getElementById("searchTrigger"),
  searchBarContainer: document.getElementById("searchBarContainer"),
  searchInput: document.getElementById("searchInput"),
  searchClose: document.getElementById("searchClose"),
  categorySection: document.getElementById("categorySection"),
};

const TAGS = [
  "vegano",
  "low carb / sin azúcar",
  "sin gluten",
  "sin procesar",
];

const CATEGORIES = [
  "Comidas",
  "Dulces",
  "Bebidas Calientes",
  "Ice Coffee",
  "Frapés",
  "Mocktails",
  "Jugos y Limonadas"
];

const state = {
  config: null,
  today: null,
  products: [],
  events: [],
  instagramPosts: [],
  tiktokPosts: [],
  selectedTags: new Set(),
  selectedCategory: null,
  searchQuery: "",
  slideIndex: 0,
  hasShuffled: false,
  eventSlideIndex: 0,
};

// Fallback data if JSON not available
const FALLBACK = {
  config: {
    instagram: "https://instagram.com/tu_instagram",
    mapsUrl: "https://maps.google.com/?q=Muralla",
    email: "hola@muralla.cl",
    providers: { whatsapp: "+56900000000", email: "proveedores@muralla.cl" },
    booking: {
      mode: "whatsapp",
      whatsapp: "+56900000000",
      message: "Hola! Quiero reservar/comprar: {item} para hoy {date}.",
    },
    hero: {
      slides: [
        { image: "", caption: "Sabor que abraza" },
        { image: "", caption: "Hecho con amor" },
        { image: "", caption: "Hoy cocinamos" },
      ],
    },
    map: {
      provider: "google",
      apiKey: "", // leave empty to use iframe fallback
      mapId: "73f23a273562e2f19d1560a3",
      placeId: "ChIJ2Wmo--LFYpYRjjZvjlHBkYg",
      lat: -33.443023,
      lng: -70.6374082,
      zoom: 17,
      placeUrl: "https://maps.app.goo.gl/hkvftZnfX1sZZ2ucA",
      styles: [
        {"featureType":"all","elementType":"labels.text.fill","stylers":[{"color":"#ffffff"}]},
        {"featureType":"all","elementType":"labels.text.stroke","stylers":[{"color":"#000000"},{"lightness":13}]},
        {"featureType":"all","elementType":"labels.icon","stylers":[{"saturation":"19"},{"lightness":"-21"},{"gamma":"0.92"},{"visibility":"simplified"}]},
        {"featureType":"administrative","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},
        {"featureType":"administrative","elementType":"geometry.stroke","stylers":[{"color":"#144b53"},{"lightness":14},{"weight":1.4}]},
        {"featureType":"landscape","elementType":"all","stylers":[{"color":"#08304b"}]},
        {"featureType":"poi","elementType":"geometry","stylers":[{"color":"#0c4152"},{"lightness":5}]},
        {"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},
        {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#0b434f"},{"lightness":25}]},
        {"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#000000"}]},
        {"featureType":"road.arterial","elementType":"geometry.stroke","stylers":[{"color":"#0b3d51"},{"lightness":16}]},
        {"featureType":"road.local","elementType":"geometry","stylers":[{"color":"#000000"}]},
        {"featureType":"transit","elementType":"all","stylers":[{"color":"#146474"}]},
        {"featureType":"water","elementType":"all","stylers":[{"color":"#021019"}]}
      ],
    },
  },
  today: {
    date: new Date().toISOString().slice(0, 10),
    items: [
      { id: "lasana", name: "Lasaña Casera", tags: ["sin procesar"], price: 6900 },
      { id: "pizza", name: "Pizza Margarita", tags: ["sin procesar"], price: 5500 },
      { id: "veggie", name: "Bowl Veggie", tags: ["vegano"], price: 6200 },
    ],
  },
  products: [
    // Comidas - Dulce
    { id: "01", name: "Pastel de Chocolate", category: "Pasteles", price: 3200, tags: ["sin gluten"], description: "Húmedo y rico en cacao.", image: "" },
    { id: "02", name: "Galletas de Avena", category: "Galletas", price: 1800, tags: ["vegano", "sin procesar"], description: "Crujientes y caseras.", image: "" },
    { id: "03", name: "Cheesecake de Frambuesa", category: "Postres", price: 3800, tags: [], description: "Cremoso con coulis.", image: "" },
    { id: "04", name: "Croissant de Almendras", category: "Bollería", price: 2500, tags: ["sin procesar"], description: "Hojaldrado y dulce.", image: "" },
    { id: "05", name: "Helado de Vainilla", category: "Helados", price: 2800, tags: ["sin gluten"], description: "Cremoso artesanal.", image: "" },

    // Comidas - Salada
    { id: "06", name: "Pasta Carbonara", category: "Pasta", price: 6500, tags: ["sin procesar"], description: "Cremosa y tradicional.", image: "" },
    { id: "07", name: "Empanadas de Pino", category: "Empanadas", price: 2200, tags: ["sin procesar"], description: "Relleno jugoso.", image: "" },
    { id: "08", name: "Pizza Margarita", category: "Pizza", price: 5800, tags: ["vegano"], description: "Clásica napolitana.", image: "" },
    { id: "09", name: "Ceviche Mixto", category: "Ceviche", price: 7200, tags: ["low carb / sin azúcar", "sin gluten"], description: "Fresco del día.", image: "" },
    { id: "10", name: "Ensalada César", category: "Ensaladas", price: 5200, tags: ["low carb / sin azúcar"], description: "Con pollo grillé.", image: "" },

    // Bebidas - Calientes
    { id: "11", name: "Café Americano", category: "Café", price: 2000, tags: [], description: "Intenso y aromático.", image: "" },
    { id: "12", name: "Matcha Latte", category: "Matcha", price: 3500, tags: ["vegano"], description: "Cremoso y verde.", image: "" },
    { id: "13", name: "Té Chai", category: "Té", price: 2500, tags: ["vegano", "sin procesar"], description: "Especiado y reconfortante.", image: "" },

    // Bebidas - Frías - Preparadas en Barra
    { id: "14", name: "Ice Coffee Vainilla", category: "Ice Coffee", price: 3200, tags: [], description: "Frío y dulce.", image: "" },
    { id: "15", name: "Frapé de Chocolate", category: "Frapés", price: 3800, tags: [], description: "Cremoso y helado.", image: "" },
    { id: "16", name: "Mocktail de Fresa", category: "Mocktails", price: 3500, tags: ["vegano"], description: "Sin alcohol, pura fruta.", image: "" },
    { id: "17", name: "Jugo de Naranja", category: "Jugos", price: 2800, tags: ["vegano", "sin procesar"], description: "Recién exprimido.", image: "" },
    { id: "18", name: "Limonada Menta", category: "Limonadas", price: 2500, tags: ["vegano", "sin azúcar"], description: "Refrescante natural.", image: "" },

    // Bebidas - Frías - Embotelladas
    { id: "19", name: "Kombucha de Jengibre", category: "Kombucha", price: 3200, tags: ["vegano", "sin procesar"], description: "Probiótico artesanal.", image: "" },
    { id: "20", name: "Agua de Chía Limón", category: "Agua de Chía", price: 2500, tags: ["vegano", "sin gluten"], description: "Hidratante y nutritiva.", image: "" },
    { id: "21", name: "Agua Mineral", category: "Agua", price: 1500, tags: [], description: "Pura y fresca.", image: "" },
    { id: "22", name: "Bless Té Verde", category: "Bless", price: 1800, tags: [], description: "Refrescante y ligero.", image: "" },
  ],
};

async function safeFetch(url) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function loadData() {
  async function firstAvailable(urls) {
    for (const u of urls) {
      const data = await safeFetch(u);
      if (data) return data;
    }
    return null;
  }
  const [config, today, productsResponse, eventsResponse, instagramResponse, tiktokResponse, apiConfig] = await Promise.all([
    firstAvailable(CONFIG_URLS),
    firstAvailable(TODAY_URLS),
    firstAvailable(PRODUCTS_URLS),
    firstAvailable(EVENTS_URLS),
    firstAvailable(INSTAGRAM_URLS),
    firstAvailable(TIKTOK_URLS),
    safeFetch('/api/config'),
  ]);
  state.config = config || FALLBACK.config;
  state.today = today || FALLBACK.today;

  // Inject API key from serverless function if available
  console.log('[Map Debug] API Config response:', apiConfig);
  console.log('[Map Debug] State config:', state.config);
  if (state.config && !state.config.map) {
    console.error('[Map Debug] ERROR: state.config.map is undefined! Using fallback.');
    state.config.map = FALLBACK.config.map;
  }
  if (apiConfig && apiConfig.googleMapsApiKey && state.config.map) {
    state.config.map.apiKey = apiConfig.googleMapsApiKey;
    console.log('[Map Debug] API key injected successfully');
  } else {
    console.log('[Map Debug] No API key available, will use iframe fallback');
  }
  console.log('[Map Debug] Final map config:', state.config.map);

  // Handle Muralla 5.0 API response format (with pagination) or local JSON array
  let productsData;
  if (productsResponse && productsResponse.data && Array.isArray(productsResponse.data)) {
    // Muralla 5.0 API format: { data: [...], pagination: {...} }
    productsData = productsResponse.data;
  } else if (Array.isArray(productsResponse)) {
    // Local JSON format: [...]
    productsData = productsResponse;
  } else {
    // Fallback
    productsData = FALLBACK.products;
  }

  state.products = productsData.map(normalizeProduct);

  // Load events
  state.events = Array.isArray(eventsResponse) ? eventsResponse : [];

  // Load instagram posts
  state.instagramPosts = Array.isArray(instagramResponse) ? instagramResponse : [];

  // Load TikTok posts
  state.tiktokPosts = Array.isArray(tiktokResponse) ? tiktokResponse : [];
}

function normalizeTag(t) {
  return String(t || "").trim().toLowerCase();
}

function normalizeProduct(p) {
  // Handle both Muralla 5.0 API format and local JSON format
  return {
    id: p.id || p.sku || "",
    name: p.name || "",
    description: p.description || "",
    category: p.category || "",
    price: p.unitPrice || p.price || 0,
    tags: (p.tags || []).map(normalizeTag),
    image: p.image || "",
    type: p.type || "",
    sku: p.sku || p.id || "",
  };
}

function setQuickLinks() {
  const c = state.config;
  // Brand
  if (c.brand?.logo) {
    el.brandLogo.src = c.brand.logo;
    el.brandLogo.hidden = false;
    if (c.brand?.alt) el.brandLogo.alt = c.brand.alt;
    if (el.brandText) el.brandText.style.display = "none";
  }
  const links = [
    [el.qaInstagram, c.instagram],
    [el.qaMaps, c.mapsUrl],
    [el.qaProvWA, waLink(c.providers?.whatsapp, "Hola! Proveedores aquí 👋")],
    [el.qaProvEmail, `mailto:${c.providers?.email || ""}`],
    [el.qaEmail, `mailto:${c.email || ""}`],
    [el.fInstagram, c.instagram],
    [el.fMaps, c.mapsUrl],
    [el.fProvWA, waLink(c.providers?.whatsapp, "Hola! Proveedores aquí 👋")],
    [el.fProvEmail, `mailto:${c.providers?.email || ""}`],
    [el.fEmail, `mailto:${c.email || ""}`],
  ];
  links.forEach(([a, href]) => { if (a && href) a.href = href; });
  if (state.config.instagram && el.igLink) el.igLink.href = state.config.instagram;
  if (el.mapOpen && c?.map?.placeUrl) el.mapOpen.href = c.map.placeUrl;
}

function waLink(number, text) {
  if (!number) return "#";
  const num = String(number).replace(/[^0-9]/g, "");
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${num}${q}`;
}

function bookingLink(itemName) {
  const { booking } = state.config;
  const date = state.today?.date || new Date().toISOString().slice(0, 10);
  const msg = (booking?.message || "Hola! Quiero reservar/comprar: {item} para hoy {date}.")
    .replace("{item}", itemName || "(sin especificar)")
    .replace("{date}", date);
  if (booking?.mode === "whatsapp") {
    return waLink(booking.whatsapp, msg);
  }
  if (booking?.mode === "url") {
    if (booking.url) {
      // Support optional placeholders in the URL
      return booking.url
        .replace("{item}", encodeURIComponent(itemName || ""))
        .replace("{date}", encodeURIComponent(date))
        .replace("{message}", encodeURIComponent(msg));
    }
  }
  return "#";
}

function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve(window.google.maps);
    const cbName = 'gmapsInit_' + Math.random().toString(36).slice(2);
    window[cbName] = () => {
      resolve(window.google.maps);
      try { delete window[cbName]; } catch {}
    };
  const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${cbName}&libraries=marker&loading=async`;
    s.async = true; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function renderMap() {
  const m = state.config?.map;
  const container = document.getElementById('map');
  if (!container || !m) return;
  const lat = Number(m.lat) || -33.4489; // Santiago fallback
  const lng = Number(m.lng) || -70.6693;
  const zoom = Number(m.zoom) || 15;

  console.log('[Map Debug] Rendering map with config:', { hasApiKey: !!m.apiKey, lat, lng, zoom, stylesCount: m.styles?.length });

  if (m.apiKey) {
    console.log('[Map Debug] Attempting to load Google Maps with API key');
    try {
      const gmaps = await loadGoogleMaps(m.apiKey);
      console.log('[Map Debug] Google Maps loaded successfully');
      const mapOptions = {
        center: { lat, lng },
        zoom,
        styles: Array.isArray(m.styles) ? m.styles : undefined,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
      };

      // Add mapId if available for Advanced Markers support
      if (m.mapId) {
        mapOptions.mapId = m.mapId;
      }

      const map = new gmaps.Map(container, mapOptions);
      console.log('[Map Debug] Map instance created');

      // Create info window for marker
      const infoWindow = new gmaps.InfoWindow({
        content: `
          <div style="font-family:system-ui;max-width:180px;padding:0;">
            <div style="font-size:14px;color:#0b0b10;font-weight:700;margin-bottom:2px;">Muralla</div>
            <div style="font-size:12px;color:#5a5a5a;line-height:1.3;">Diag Paraguay 276, costado izq super</div>
          </div>
        `,
        maxWidth: 220
      });

      // Use AdvancedMarkerElement if available, fallback to Marker for compatibility
      if (gmaps.marker?.AdvancedMarkerElement) {
        // Create custom black pin element
        const pinElement = new gmaps.marker.PinElement({
          background: '#0b0b10',
          borderColor: '#0b0b10',
          glyphColor: '#ffffff'
        });

        const marker = new gmaps.marker.AdvancedMarkerElement({
          position: { lat, lng },
          map,
          title: 'Muralla',
          content: pinElement.element
        });
        // Show info window on click
        marker.addListener('click', () => {
          infoWindow.open({ map, anchor: marker });
        });
        // Auto-open the info window
        infoWindow.open({ map, anchor: marker });
      } else {
        const marker = new gmaps.Marker({
          position: { lat, lng },
          map,
          title: 'Muralla',
          icon: {
            path: gmaps.SymbolPath.CIRCLE,
            fillColor: '#0b0b10',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 8
          }
        });
        // Show info window on click
        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
        // Auto-open the info window
        infoWindow.open(map, marker);
      }
      console.log('[Map Debug] Marker added with info window');
      try { renderMetro(map); } catch {}
      return;
    } catch (e) {
      console.error('[Map Debug] Failed to load Google Maps, falling back to iframe:', e);
    }
  } else {
    console.log('[Map Debug] No API key, using iframe fallback');
  }
  const url = m.placeUrl || `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}`;
  console.log('[Map Debug] Rendering iframe with URL:', url);
  container.innerHTML = `<iframe title="Mapa" width="100%" height="100%" frameborder="0" style="border:0" referrerpolicy="no-referrer-when-downgrade" loading="lazy" src="${url}"></iframe>`;
}

function renderMetro(map) {
  const cfg = state.config?.map || {};
  const list = Array.isArray(cfg.metroStations) ? cfg.metroStations : [];
  if (!list.length) return;
  const g = window.google;
  const AdvancedMarker = g?.maps?.marker?.AdvancedMarkerElement;
  list.forEach((st) => {
    const pos = { lat: Number(st.lat), lng: Number(st.lng) };
    if (AdvancedMarker) {
      const el = document.createElement('div');
      el.style.padding = '4px 8px';
      el.style.background = 'rgba(0,0,0,0.85)';
      el.style.border = '1px solid rgba(255,255,255,0.35)';
      el.style.borderRadius = '10px';
      el.style.color = '#fff';
      el.style.font = '600 12px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial';
      el.style.textShadow = '0 1px 0 rgba(0,0,0,0.6)';
      el.textContent = st.name || 'Estación';
      new AdvancedMarker({ map, position: pos, content: el, zIndex: 10 });
    } else {
      new g.maps.Marker({ map, position: pos, title: st.name || 'Estación' });
    }
  });
}

function renderTicker() {
  const items = (state.today?.items || []).slice();
  if (!items.length) return;
  // Duplicate to create continuous feel
  const dup = items.concat(items).concat(items);
  el.tickerTrack.innerHTML = dup
    .map((it) => {
      const price = it.price ? `<span class="price">$${Number(it.price).toLocaleString("es-CL")}</span>` : "";
      const tags = (it.tags || []).map(t => `<span class="tag">${t}</span>`).join(" ");
      return `<a class="tick" href="${bookingLink(it.name)}" title="Reservar ${it.name}">
        <strong>${it.name}</strong> ${price} ${tags}
      </a>`;
    })
    .join("");
}

// renderToday function removed - "Hoy" section has been removed from the site

// Generate a consistent hash from product ID/SKU/name for color assignment
function getProductHash(product) {
  const key = product.id || product.sku || product.name || '';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

function gradientPlaceholder(product) {
  const hash = getProductHash(product);
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function initCarousel() {
  const slides = state.config?.hero?.slides || [];
  if (!slides.length) return;
  el.carouselTrack.innerHTML = slides
    .map((s, i) => {
      const colors = s.image ? null : gradientPlaceholder(i);
      const bgStyle = s.image ? `background-image:url('${s.image}')` : `background-color:${colors.bg}`;
      return `<div class="slide" style="${bgStyle}"></div>`;
    })
    .join("");
  const total = slides.length;
  const go = (dir) => {
    state.slideIndex = (state.slideIndex + dir + total) % total;
    el.carouselTrack.style.transform = `translateX(-${state.slideIndex * 100}%)`;
  };
  let auto = setInterval(() => go(1), 5000);
  const poke = (dir) => { go(dir); clearInterval(auto); auto = setInterval(() => go(1), 5000); };
  el.prevSlide?.addEventListener("click", () => poke(-1));
  el.nextSlide?.addEventListener("click", () => poke(1));
}

function renderCategoryChips() {
  el.categoryChips.innerHTML = CATEGORIES.map(cat =>
    `<button class="category-chip" data-category="${cat}">${cat}</button>`
  ).join("");

  el.categoryChips.querySelectorAll(".category-chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.category;
      if (state.selectedCategory === cat) {
        // Deselect
        state.selectedCategory = null;
      } else {
        state.selectedCategory = cat;
      }
      updateCategoryStyles();
      renderProducts();
    });
  });
  updateCategoryStyles();
}

function renderSubcategoryChips() {
  // No subcategories needed with flat structure
  el.subcategoryChips.innerHTML = "";
}

function updateCategoryStyles() {
  el.categoryChips.querySelectorAll(".category-chip").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.category === state.selectedCategory);
  });
}

function renderChips() {
  const chips = TAGS.map((t) => `<button class="chip" data-tag="${t}">${t}</button>`).join("");
  el.chips.innerHTML = chips;
  el.chips.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tag = normalizeTag(btn.dataset.tag);
      if (state.selectedTags.has(tag)) state.selectedTags.delete(tag); else state.selectedTags.add(tag);
      updateChipStyles();
      renderProducts();
    });
  });
}

function updateChipStyles() {
  el.chips.querySelectorAll(".chip").forEach((btn) => {
    const tag = normalizeTag(btn.dataset.tag);
    btn.classList.toggle("active", state.selectedTags.has(tag));
  });
}

function matchTags(p) {
  if (state.selectedTags.size === 0) return true;
  const set = new Set(p.tags || []);
  for (const t of state.selectedTags) {
    if (!set.has(t)) return false;
  }
  return true;
}

function matchCategories(p) {
  if (!state.selectedCategory) return true;
  const pCategory = normalizeTag(p.category || "");
  const selectedCat = normalizeTag(state.selectedCategory);
  // Check if product's category matches the selected category
  return pCategory === selectedCat ||
         normalizeTag(p.name || "").includes(selectedCat) ||
         pCategory.includes(selectedCat);
}

function matchSearch(p) {
  if (!state.searchQuery) return true;
  const query = normalizeTag(state.searchQuery);
  const name = normalizeTag(p.name || "");
  const desc = normalizeTag(p.description || "");
  const category = normalizeTag(p.category || "");
  const tags = (p.tags || []).map(t => normalizeTag(t)).join(" ");

  return name.includes(query) ||
         desc.includes(query) ||
         category.includes(query) ||
         tags.includes(query);
}

function renderProducts() {
  let items = state.products.filter(p => matchTags(p) && matchCategories(p) && matchSearch(p));

  // Sort alphabetically if category or search is active, otherwise shuffle
  if (state.selectedCategory || state.searchQuery) {
    items = items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    // Shuffle only on initial load (check if we haven't shuffled yet)
    if (!state.hasShuffled) {
      state.products = shuffleArray(state.products);
      state.hasShuffled = true;
      items = state.products; // Use the shuffled array
    }
  }

  el.products.innerHTML = items
    .map((p, i) => {
      const colors = p.image ? null : gradientPlaceholder(p);
      const bgStyle = p.image ? `background-image:url('${p.image}')` : `background-color:${colors.bg}`;
      const textColor = colors ? colors.text : '#fff';
      const badges = (p.tags || []).map(t => `<span class="badge">${t}</span>`).join(" ");
      const price = p.price ? `$${Number(p.price).toLocaleString("es-CL")}` : "";
      const desc = p.description || "The quick, brown fox jumped over the lazy dog.";
      return `<article class="card-flip-container" data-id="${p.id}" style="${bgStyle}">
        <div class="card-flip">
          <div class="card-front" style="color:${textColor}">
            <div class="card-content">
              <h3 class="card-main-title">${p.name}</h3>
              <p class="card-subtitle">${badges ? `${badges} —` : ''} ${price}</p>
              <p class="card-description">${desc}</p>
            </div>
          </div>
          <div class="card-back" style="${bgStyle}">
            <div class="card-back-overlay">
              <div class="card-title" style="color:${textColor}">${p.name}</div>
              <a class="today-cta" href="${bookingLink(p.name)}">Reservar</a>
            </div>
          </div>
        </div>
      </article>`;
    })
    .join("");

  // Toggle flip on click/tap
  el.products.querySelectorAll(".card-flip-container").forEach((node) => {
    node.addEventListener("click", (e) => {
      // Avoid duplicate open when clicking CTA link
      if (e.target.closest("a")) return;
      node.classList.toggle("flipped");
    });
  });
}

function openSheet(p, i = 0) {
  const colors = p.image ? null : gradientPlaceholder(i);
  const bgStyle = p.image ? `background-image:url('${p.image}')` : `background-color:${colors.bg}`;
  el.sheetBody.innerHTML = `
    <div class="card-img" style="${bgStyle}"></div>
    <h3 style="margin:10px 0 6px">${p.name}</h3>
    <p style="color:var(--muted); margin:0 0 8px">${p.description || ""}</p>
    <div class="badges" style="margin-bottom:10px">${(p.tags||[]).map(t=>`<span class='badge'>${t}</span>`).join(" ")}</div>
    <div style="display:flex;gap:10px;align-items:center;justify-content:space-between">
      <strong>${p.price ? `$${Number(p.price).toLocaleString("es-CL")}` : ""}</strong>
      <a class="cta" href="${bookingLink(p.name)}" target="_blank" rel="noopener">Reservar</a>
    </div>
  `;
  el.sheet.setAttribute("aria-hidden", "false");
}

function closeSheet() {
  el.sheet.setAttribute("aria-hidden", "true");
}

function wireSheet() {
  el.sheetClose?.addEventListener("click", closeSheet);
  el.sheet?.addEventListener("click", (e) => {
    if (e.target === el.sheet) closeSheet();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeSheet();
  });
}

function wireTopCTA() {
  el.ctaTop?.addEventListener("click", () => {
    const first = state.today?.items?.[0];
    const href = bookingLink(first?.name);
    window.open(href, "_blank");
  });
}

function wireSearch() {
  // Toggle search bar
  el.searchTrigger?.addEventListener("click", () => {
    const isVisible = el.searchBarContainer.style.display !== "none";

    if (isVisible) {
      // Close search
      el.searchBarContainer.style.display = "none";
      el.categoryChips.style.display = "flex";
      el.searchInput.value = "";
      state.searchQuery = "";
      renderProducts();
    } else {
      // Open search
      el.searchBarContainer.style.display = "block";
      el.categoryChips.style.display = "none";
      // Clear category selection when opening search
      state.selectedCategory = null;
      updateCategoryStyles();
      el.searchInput.focus();
    }
  });

  // Close search
  el.searchClose?.addEventListener("click", () => {
    el.searchBarContainer.style.display = "none";
    el.categoryChips.style.display = "flex";
    el.searchInput.value = "";
    state.searchQuery = "";
    renderProducts();
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && el.searchBarContainer.style.display !== "none") {
      el.searchClose.click();
    }
  });

  // Real-time search filtering
  el.searchInput?.addEventListener("input", (e) => {
    state.searchQuery = e.target.value.trim();
    renderProducts();
  });
}

// Events rendering and carousel
function renderEvents() {
  const track = document.getElementById('eventsTrack');
  if (!track || !state.events || state.events.length === 0) return;

  // Filter future events only
  const now = new Date();
  const futureEvents = state.events
    .filter(event => new Date(event.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (futureEvents.length === 0) {
    track.innerHTML = '<p style="color:var(--muted);padding:40px;text-align:center;">No hay eventos próximos por ahora. ¡Vuelve pronto!</p>';
    return;
  }

  // Calendar card with 4-week grid
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Generate 4 weeks of calendar days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = lastDay.getDate();

  // Get event dates for highlighting
  const eventDates = new Set(futureEvents.map(e => new Date(e.date).getDate()));

  let calendarDays = '';
  let dayCounter = 1;

  // Generate 4 weeks (28 days max to fit nicely)
  for (let week = 0; week < 4; week++) {
    for (let day = 0; day < 7; day++) {
      const cellIndex = week * 7 + day;

      if (cellIndex < startingDayOfWeek || dayCounter > daysInMonth) {
        calendarDays += '<div class="calendar-grid-day empty"></div>';
      } else {
        const isToday = dayCounter === currentDay;
        const hasEvent = eventDates.has(dayCounter);
        const classes = `calendar-grid-day${isToday ? ' today' : ''}${hasEvent ? ' has-event' : ''}`;
        calendarDays += `<div class="${classes}">${dayCounter}</div>`;
        dayCounter++;
      }
    }
  }

  const calendarCard = `
    <div class="event-card event-card-calendar">
      <div class="calendar-header">
        <div class="calendar-month">${currentMonth}</div>
        <div class="calendar-year">${currentYear}</div>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          <div>D</div><div>L</div><div>M</div><div>M</div><div>J</div><div>V</div><div>S</div>
        </div>
        <div class="calendar-days">
          ${calendarDays}
        </div>
      </div>
      <div class="calendar-footer">
        <div class="calendar-count">${futureEvents.length} evento${futureEvents.length !== 1 ? 's' : ''}</div>
      </div>
    </div>
  `;

  const eventCards = futureEvents.map((event, index) => {
    const date = new Date(event.date);
    const day = date.getDate();
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const month = monthNames[date.getMonth()];

    // Use color palette if no image
    const colors = event.image ? null : gradientPlaceholder(event);
    const bgStyle = event.image
      ? `<div class="event-card-bg" style="background-image:url('${event.image}')"></div>`
      : `<div class="event-card-bg" style="background-color:${colors.bg}"></div>`;

    return `
      <div class="event-card">
        ${bgStyle}
        <div class="event-date-badge">
          <span class="event-date-day">${day}</span>
          <span class="event-date-month">${month}</span>
        </div>
        <div class="event-content">
          <span class="event-category">${event.category}</span>
          <h3 class="event-title">${event.title}</h3>
          <p class="event-description">${event.description}</p>
          <div class="event-meta">
            <span class="event-meta-item">🕐 ${event.time}</span>
          </div>
          <a href="${event.bookingUrl || bookingLink(event.title)}" class="event-cta" target="_blank" rel="noopener">
            Más info →
          </a>
        </div>
      </div>
    `;
  }).join('');

  track.innerHTML = calendarCard + eventCards;

  wireEventCarousel();
}

function wireEventCarousel() {
  const track = document.getElementById('eventsTrack');
  const prevBtn = document.getElementById('eventPrev');
  const nextBtn = document.getElementById('eventNext');

  if (!track || !prevBtn || !nextBtn) return;

  const cards = track.querySelectorAll('.event-card');
  const cardWidth = 320 + 16; // card width + gap
  const maxSlide = Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));

  function updateButtons() {
    prevBtn.disabled = state.eventSlideIndex <= 0;
    nextBtn.disabled = state.eventSlideIndex >= maxSlide;
  }

  function slide(direction) {
    state.eventSlideIndex = Math.max(0, Math.min(maxSlide, state.eventSlideIndex + direction));
    track.style.transform = `translateX(-${state.eventSlideIndex * cardWidth}px)`;
    updateButtons();
  }

  prevBtn.addEventListener('click', () => slide(-1));
  nextBtn.addEventListener('click', () => slide(1));
  updateButtons();

  // Touch/swipe support
  let startX = 0;
  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });
  track.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      slide(diff > 0 ? 1 : -1);
    }
  });
}

// Social Media Grid - Mix Instagram and TikTok
function renderInstagram() {
  const grid = document.getElementById('instagramGrid');
  if (!grid) return;

  // Combine Instagram and TikTok posts
  const instagramPosts = state.instagramPosts || [];
  const tiktokPosts = state.tiktokPosts || [];

  console.log('[Social Grid] Instagram posts:', instagramPosts.length);
  console.log('[Social Grid] TikTok posts:', tiktokPosts.length);

  const allPosts = [
    ...instagramPosts,
    ...tiktokPosts
  ];

  // Filter out posts without valid images
  const validPosts = allPosts
    .filter(post => post.image && post.image.trim() !== '')
    .slice(0, 10); // Take max 10 posts total

  if (validPosts.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted);padding:20px;text-align:center;grid-column:1/-1;">No hay posts disponibles</p>';
    return;
  }

  grid.innerHTML = validPosts.map(post => {
    const platform = post.platform === 'tiktok' ? 'TikTok' : 'Instagram';

    // SVG logos for each platform
    const instagramLogo = `<svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;

    const tiktokLogo = `<svg width="32" height="32" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>`;

    const logo = post.platform === 'tiktok' ? tiktokLogo : instagramLogo;

    return `
      <a href="${post.link}" class="instagram-post" target="_blank" rel="noopener" title="${post.caption || ''} (${platform})">
        <img src="${post.image}" alt="${post.caption || platform + ' post'}" loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="console.error('Failed to load:', this.src); this.parentElement.style.display='none'">
        <div class="instagram-post-overlay">
          ${logo}
        </div>
      </a>
    `;
  }).join('');
}

async function main() {
  await loadData();
  setQuickLinks();
  renderTicker();
  // initCarousel(); // Removed - carousel no longer in HTML
  renderCategoryChips();
  renderChips();
  renderProducts();
  renderEvents();
  renderInstagram();
  renderMap();
  wireSheet();
  // wireTopCTA(); // Removed - CTA no longer in HTML
  wireSearch();
  startVerbRotation();
  startSpinnerAnimation();
  updateOpenStatus();
  renderReviews();
  // Check status every minute
  setInterval(updateOpenStatus, 60000);

  // Show ticker and status after everything is loaded
  showHeaderElements();
}

function showHeaderElements() {
  const ticker = document.getElementById("ticker");
  const status = document.getElementById("openStatus");
  if (ticker) ticker.classList.add("loaded");
  if (status) status.classList.add("loaded");
}

// Google Reviews - Fetch from Google Places API
async function renderReviews() {
  const container = document.getElementById("reviewsContainer");
  const reviewsLink = document.getElementById("googleReviewsLink");

  if (!container) return;

  // Set Google reviews link
  const googleMapsUrl = state.config?.map?.placeUrl || "https://maps.app.goo.gl/XNC8be4Y53Xkyiba8";
  if (reviewsLink) reviewsLink.href = googleMapsUrl;

  const placeId = state.config?.map?.placeId || "ChIJ2Wmo--LFYpYRjjZvjlHBkYg";

  try {
    // Fetch reviews from backend proxy
    const response = await fetch(`/api/reviews?placeId=${placeId}`);

    if (!response.ok) throw new Error('Failed to fetch reviews');

    const data = await response.json();

    if (data.reviews && data.reviews.length > 0) {
      const topReviews = data.reviews.slice(0, 3);

      container.innerHTML = topReviews.map(review => {
        const avatarUrl = review.profile_photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.author_name) + '&background=c8b5d1&color=0b0b10&size=80';
        return `
          <div class="review-card">
            <div class="review-header">
              <img src="${avatarUrl}" alt="${review.author_name}" class="review-avatar">
              <div class="review-author-info">
                <div class="review-author">${review.author_name}</div>
                <div class="review-rating">${review.rating}/5</div>
              </div>
            </div>
            <p class="review-text">"${review.text}"</p>
          </div>
        `;
      }).join("");
    } else {
      throw new Error('No reviews available');
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    showPlaceholderReviews(container);
  }
}

function showPlaceholderReviews(container) {
  const reviews = [
    {
      rating: 5,
      text: "Increíble lugar! El café está espectacular y el ambiente es súper acogedor.",
      author_name: "María G."
    },
    {
      rating: 5,
      text: "La comida está deliciosa y el servicio es excelente. Me encanta venir aquí a trabajar.",
      author_name: "Carlos P."
    },
    {
      rating: 4,
      text: "Muy buen café y postres caseros. El lugar es pequeño pero muy bonito.",
      author_name: "Ana S."
    }
  ];

  container.innerHTML = reviews.map(review => {
    const avatarUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.author_name) + '&background=c8b5d1&color=0b0b10&size=80';
    return `
      <div class="review-card">
        <div class="review-header">
          <img src="${avatarUrl}" alt="${review.author_name}" class="review-avatar">
          <div class="review-author-info">
            <div class="review-author">${review.author_name}</div>
            <div class="review-rating">${review.rating}/5</div>
          </div>
        </div>
        <p class="review-text">"${review.text}"</p>
      </div>
    `;
  }).join("");
}

// Rotating verbs display
const VERBS = [
  "harmonizando",
  "germinando",
  "cultivando",
  "sanando",
  "destilando",
  "langüeteando",
  "desaprendiendo",
  "sapeando",
  "acicalándonos",
  "perforando",
  "ecualizando",
  "auto-tuneando",
  "desmalezando",
  "exorcizando",
  "resetiando",
  "decantando",
  "goteando",
  "degustando",
  "tanteando",
  "desapegándonos",
  "husmeando",
  "exfoliando",
  "distorsionando",
  "procrastinando",
  "energizando",
  "provocando",
  "condimentando",
  "bailando",
  "incomodando",
  "ghosteando",
  "fermentando",
  "susurrando",
  "desenredando",
  "burbujeando",
  "reposando",
  "filtrando",
  "aromatizando",
  "espumando",
  "tostando",
  "revolviendo",
  "reconciliando",
  "abrazando",
  "recalculando",
  "divagando",
  "mariconeando",
  "carreteando",
  "oxigenando",
  "maquillándonos",
  "fantaseando",
  "melodizando",
  "delirando",
  "anidando",
  "precipitando",
  "arrasando",
  "pontificando",
  "mascando",
  "comiendo",
  "fumando",
  "derritiendo",
  "despilfarrando",
  "limpiando",
  "taladreando",
  "perreando",
  "estudiando",
  "envenenando",
  "demorando",
  "tentando",
  "mirando",
  "olvidando",
  "shazameando",
  "mordisqueando",
  "oversharing",
  "licuando",
  "devorando",
  "crasheando",
  "glowing up",
  "glitching",
  "cafeineando",
  "ayunando",
  "rallando",
  "batiendo",
  "sofriendo",
  "amasando",
  "caramelizando",
  "ahumando",
  "aliñando",
  "sazonando",
  "marinando",
  "flambeando",
  "triturando",
  "cuchareando",
  "caceroleando",
  "derretideando",
  "cafeteando",
  "vaporizando",
  "bronceando"
];

function startVerbRotation() {
  const verbText = document.getElementById("verbText");
  if (!verbText) return;

  function updateVerb() {
    // Pick a random verb
    const randomIndex = Math.floor(Math.random() * VERBS.length);
    verbText.textContent = VERBS[randomIndex];
  }

  // Wait 2 seconds before starting random verbs (show "cargando" first)
  setTimeout(() => {
    updateVerb();
    // Then rotate every 2 minutes (120000ms)
    setInterval(updateVerb, 120000);
  }, 2000);
}

function startSpinnerAnimation() {
  const spinner = document.getElementById("verbSpinner");
  if (!spinner) return;

  // Star characters getting bigger and smaller
  const frames = ["·", "✶", "✳", "✶", "·"];
  let currentFrame = 0;

  function updateSpinner() {
    spinner.textContent = frames[currentFrame];
    currentFrame = (currentFrame + 1) % frames.length;
  }

  // Update every 300ms for pulsing effect
  setInterval(updateSpinner, 300);
}

// Opening hours - using Chile timezone (America/Santiago)
const OPENING_HOURS = {
  0: [], // Domingo - use second range: 12:00 PM - 8:00 PM
  1: [{start: "09:00", end: "21:00"}], // Lunes - only second range
  2: [{start: "10:00", end: "21:00"}], // Martes - only second range
  3: [{start: "10:00", end: "21:00"}], // Miércoles - only second range
  4: [{start: "10:00", end: "21:00"}], // Jueves - only second range
  5: [{start: "10:00", end: "21:00"}], // Viernes - only second range
  6: [{start: "12:00", end: "21:00"}], // Sábado
};

// Add Domingo hours
OPENING_HOURS[0] = [{start: "12:00", end: "20:00"}]; // 12 PM - 8 PM

function updateOpenStatus() {
  const statusEl = document.getElementById("openStatus");
  const statusText = document.getElementById("statusText");
  const tooltip = document.getElementById("statusTooltip");
  if (!statusEl || !statusText) return;

  // Use Chile timezone
  const now = new Date();
  const chileTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Santiago"}));
  const day = chileTime.getDay();
  const hours = chileTime.getHours();
  const minutes = chileTime.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Check if today is a special location day
  const todayDate = chileTime.toISOString().split('T')[0];
  const specialLocation = state.config?.specialLocations?.find(loc => loc.date === todayDate);

  if (specialLocation) {
    // Special location mode
    statusEl.className = "open-status special-location loaded";
    statusText.textContent = "abierto de visita";

    if (tooltip) {
      const message = `${specialLocation.name}\n${specialLocation.address}\n${specialLocation.description}`;
      tooltip.innerHTML = `
        <div style="white-space: pre-line; text-align: left;">
          <strong>${specialLocation.name}</strong><br>
          ${specialLocation.address}<br>
          <span style="font-size: 12px; opacity: 0.9;">${specialLocation.description}</span>
          ${specialLocation.mapsUrl ? `<br><a href="${specialLocation.mapsUrl}" target="_blank" rel="noopener" style="color: #e67e5f; text-decoration: underline;">Ver en mapa ↗</a>` : ''}
        </div>
      `;

      statusEl.onclick = () => {
        tooltip.classList.add("show");
        setTimeout(() => {
          tooltip.classList.remove("show");
        }, 5000);
      };
    }
    return;
  }

  // Normal hours logic
  const todayHours = OPENING_HOURS[day];
  let isOpen = false;
  let nextChangeTime = null;
  let nextChangeDay = null;

  if (todayHours && todayHours.length > 0) {
    for (const period of todayHours) {
      const [startH, startM] = period.start.split(":").map(Number);
      const [endH, endM] = period.end.split(":").map(Number);
      const startTime = startH * 60 + startM;
      const endTime = endH * 60 + endM;

      if (currentTime >= startTime && currentTime < endTime) {
        isOpen = true;
        nextChangeTime = period.end;
        nextChangeDay = day;
        break;
      } else if (currentTime < startTime && !nextChangeTime) {
        nextChangeTime = period.start;
        nextChangeDay = day;
      }
    }
  }

  // If no change found today, find next opening day
  if (!nextChangeTime) {
    for (let i = 1; i <= 7; i++) {
      const nextDay = (day + i) % 7;
      const nextDayHours = OPENING_HOURS[nextDay];
      if (nextDayHours && nextDayHours.length > 0) {
        nextChangeTime = nextDayHours[0].start;
        nextChangeDay = nextDay;
        break;
      }
    }
  }

  statusEl.className = isOpen ? "open-status open loaded" : "open-status closed loaded";
  statusText.textContent = isOpen ? "abierto" : "cerrado";

  // Setup click handler to show tooltip
  if (tooltip && nextChangeTime) {
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const message = isOpen
      ? `Cerramos a las ${nextChangeTime}`
      : (nextChangeDay === day
          ? `Abrimos a las ${nextChangeTime}`
          : `Abrimos ${dayNames[nextChangeDay]} a las ${nextChangeTime}`);

    tooltip.textContent = message;

    statusEl.onclick = () => {
      tooltip.classList.add("show");
      setTimeout(() => {
        tooltip.classList.remove("show");
      }, 3000);
    };
  }
}

main();
