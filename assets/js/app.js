// Import color palette
import { COLOR_PALETTE, getColorPalette } from './color-palette.js';

// API Configuration
const MURALLA_API_URL = "https://muralla-kua.vercel.app";
const MURALLA_ADMIN_API = "https://admin.murallacafe.cl";
const MURALLA_API_KEY = "muralla_live_5e63df1db66e8c739d3a87de5501472a45693af831c67328";

// Cache configuration
const CACHE_PREFIX = 'muralla_cache_';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes - cache freshness threshold

// Data source URLs - local files load first, API updates in background
const DATA_SOURCES = {
  config: {
    local: '/assets/data/config.json',
    api: '/api/config',
    cache: 'config'
  },
  today: {
    local: '/assets/data/today.json',
    api: '/api/today',
    cache: 'today'
  },
  products: {
    local: '/assets/data/products.json',
    api: `${MURALLA_ADMIN_API}/api/products?limit=100&includeInactive=false`, // Fetch from admin API
    cache: 'products'
  },
  events: {
    local: '/assets/data/events.json',
    api: '/api/events',
    cache: 'events'
  },
  instagram: {
    api: '/api/instagram',
    local: '/assets/data/instagram.json',
    cache: 'instagram'
  },
  tiktok: {
    api: '/api/tiktok',
    cache: 'tiktok'
  },
  categories: {
    local: '/assets/data/categories.json',
    api: `${MURALLA_ADMIN_API}/api/categories`,
    cache: 'categories'
  },
  recentArrivals: {
    local: '/assets/data/recent-arrivals.json',
    api: `${MURALLA_ADMIN_API}/api/products?limit=10&sortBy=createdAt&sortOrder=desc&includeInactive=false`,
    cache: 'recentArrivals'
  },
  blog: {
    local: '/assets/data/blog.json',
    api: '/api/blog',
    cache: 'blog'
  }
};

const el = {
  tickerTrack: document.getElementById("tickerTrack"),
  splitFlapBoard: document.getElementById("splitFlapBoard"),
  flapDisplay: document.getElementById("flapDisplay"),
  flapCard: document.getElementById("flapCard"),
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

// Fallback categories if API fails
const FALLBACK_CATEGORIES = [
  { name: "Comidas", emoji: "🍽️", color: "#92400E", isActive: true },
  { name: "Dulces", emoji: "🧁", color: "#BE185D", isActive: true },
  { name: "Bebidas Calientes", emoji: "☕🔥", color: "#92400E", isActive: true },
  { name: "Ice Coffee", emoji: "🧊☕", color: "#1E40AF", isActive: true },
  { name: "Frapés", emoji: "🥤", color: "#7C3AED", isActive: true },
  { name: "Mocktails", emoji: "🍹", color: "#DB2777", isActive: true },
  { name: "Jugos y Limonadas", emoji: "🍋", color: "#059669", isActive: true }
];

const state = {
  config: null,
  today: null,
  products: [],
  events: [],
  instagramPosts: [],
  tiktokPosts: [],
  categories: [],
  recentArrivals: [],
  blog: [],
  selectedTags: new Set(),
  selectedCategory: null,
  searchQuery: "",
  slideIndex: 0,
  hasShuffled: false,
  eventSlideIndex: 0,
  recentSlideIndex: 0,
  isInitialLoad: true,
  flapIndex: 0,
  flapInterval: null,
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

// Cache management
function getCacheKey(name) {
  return `${CACHE_PREFIX}${name}`;
}

function getFromCache(name) {
  try {
    const key = getCacheKey(name);
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    console.log(`[Cache] Found ${name} from ${new Date(timestamp).toLocaleTimeString()}`);
    return data;
  } catch (e) {
    console.warn(`[Cache] Error reading ${name}:`, e);
    return null;
  }
}

function saveToCache(name, data) {
  try {
    const key = getCacheKey(name);
    const cached = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cached));
    console.log(`[Cache] Saved ${name} at ${new Date().toLocaleTimeString()}`);
  } catch (e) {
    console.warn(`[Cache] Error saving ${name}:`, e);
  }
}

function isCacheFresh(name) {
  try {
    const key = getCacheKey(name);
    const cached = localStorage.getItem(key);
    if (!cached) return false;
    
    const { timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    return age < CACHE_DURATION_MS;
  } catch (e) {
    return false;
  }
}

async function safeFetch(url, options = {}) {
  try {
    const fetchOptions = {
      cache: "no-store",
      ...options
    };
    
    // Add Bearer token authentication if URL is from admin API
    if (url.includes(MURALLA_ADMIN_API)) {
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${MURALLA_API_KEY}`
      };
    }
    
    const res = await fetch(url, fetchOptions);
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } catch (e) {
    return null;
  }
}

// Load with cache-first strategy: cache → local → API
async function loadWithCache(source) {
  const { local, api, cache } = source;
  
  // 1. Try cache first (instant)
  const cached = getFromCache(cache);
  if (cached) {
    return cached;
  }
  
  // 2. Try local file (fast)
  if (local) {
    const localData = await safeFetch(local);
    if (localData) {
      // Save to cache for next time
      saveToCache(cache, localData);
      return localData;
    }
  }
  
  // 3. Try API (slower, but fresh)
  if (api) {
    const apiData = await safeFetch(api);
    if (apiData) {
      saveToCache(cache, apiData);
      return apiData;
    }
  }
  
  return null;
}

// Background update: fetch from API and update cache
async function updateCacheInBackground(source, onUpdate) {
  const { api, cache } = source;
  if (!api) return;
  
  try {
    console.log(`[Background Update] Fetching fresh ${cache} data...`);
    const freshData = await safeFetch(api);
    if (freshData) {
      saveToCache(cache, freshData);
      console.log(`[Background Update] Updated ${cache} cache`);
      
      // Call update callback if provided
      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(freshData);
      }
      
      return freshData;
    }
  } catch (e) {
    console.warn(`[Background Update] Failed to update ${cache}:`, e);
  }
}

async function loadData() {
  // Load data with cache-first strategy
  const [config, today, productsResponse, eventsResponse, instagramResponse, tiktokResponse, categoriesResponse, recentArrivalsResponse, blogResponse, apiConfig, verbs] = await Promise.all([
    loadWithCache(DATA_SOURCES.config),
    loadWithCache(DATA_SOURCES.today),
    loadWithCache(DATA_SOURCES.products),
    loadWithCache(DATA_SOURCES.events),
    loadWithCache(DATA_SOURCES.instagram),
    loadWithCache(DATA_SOURCES.tiktok),
    loadWithCache(DATA_SOURCES.categories),
    loadWithCache(DATA_SOURCES.recentArrivals),
    loadWithCache(DATA_SOURCES.blog),
    safeFetch('/api/config'),
    safeFetch('/assets/data/verbs.json'),
  ]);
  
  // Start background updates (non-blocking)
  setTimeout(() => {
    console.log('[Background Update] Starting cache refresh...');
    
    // Update categories in background
    updateCacheInBackground(DATA_SOURCES.categories, (freshCategories) => {
      if (freshCategories) {
        const categoriesData = freshCategories.success ? freshCategories.data : freshCategories;
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          const newCategories = categoriesData.filter(c => c.isActive);
          if (JSON.stringify(state.categories) !== JSON.stringify(newCategories)) {
            console.log('[Categories Update] New categories detected, updating...');
            state.categories = newCategories;
            renderCategoryChips();
          }
        }
      }
    });
    
    // Update products with callback to smoothly re-render
    updateCacheInBackground(DATA_SOURCES.products, (freshProducts) => {
      // Check if products actually changed
      const oldProducts = state.products;
      let productsData;
      
      if (freshProducts && freshProducts.data && Array.isArray(freshProducts.data)) {
        // Admin API format: { data: [...], pagination: {...} }
        productsData = freshProducts.data;
        console.log(`[Products Update] Fetched ${productsData.length} products from API`);
      } else if (Array.isArray(freshProducts)) {
        // Local JSON format
        productsData = freshProducts;
      }
      
      if (productsData && productsData.length > 0) {
        const newProducts = productsData.map(normalizeProduct).filter(p => p.isActive);
        
        // Only update if products changed
        if (JSON.stringify(oldProducts) !== JSON.stringify(newProducts)) {
          console.log('[Products Update] New products detected, fading in updates...');
          state.products = newProducts;
          state.isInitialLoad = false;
          renderProductsWithFade();
        } else {
          console.log('[Products Update] No changes detected');
        }
      }
    });
    
    // Update recent arrivals in background
    updateCacheInBackground(DATA_SOURCES.recentArrivals, (freshRecentArrivals) => {
      if (freshRecentArrivals && freshRecentArrivals.data && Array.isArray(freshRecentArrivals.data)) {
        const newRecentArrivals = freshRecentArrivals.data.map(normalizeProduct).filter(p => p.isActive);
        if (JSON.stringify(state.recentArrivals) !== JSON.stringify(newRecentArrivals)) {
          console.log('[Recent Arrivals Update] New products detected, updating...');
          state.recentArrivals = newRecentArrivals;
          renderRecentArrivals();
        }
      }
    });
    
    // Update other data sources
    Promise.all([
      updateCacheInBackground(DATA_SOURCES.config),
      updateCacheInBackground(DATA_SOURCES.today),
      updateCacheInBackground(DATA_SOURCES.events),
      updateCacheInBackground(DATA_SOURCES.instagram),
      updateCacheInBackground(DATA_SOURCES.tiktok),
    ]).then(() => {
      console.log('[Background Update] Cache refresh complete');
    });
  }, 1000); // Wait 1 second after initial load
  state.config = config || FALLBACK.config;
  state.today = today || FALLBACK.today;
  state.verbs = verbs || [];

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

  // Handle multiple API response formats
  let productsData;
  if (productsResponse) {
    if (productsResponse.data && Array.isArray(productsResponse.data)) {
      // Admin API format: { data: [...], pagination: {...} }
      productsData = productsResponse.data;
      console.log(`[Products] Loaded ${productsData.length} products from API`);
      if (productsResponse.pagination) {
        console.log(`[Products] Pagination: page ${productsResponse.pagination.page}/${productsResponse.pagination.totalPages}, total: ${productsResponse.pagination.totalCount}`);
      }
    } else if (Array.isArray(productsResponse)) {
      // Local JSON format: [...]
      productsData = productsResponse;
      console.log(`[Products] Loaded ${productsData.length} products from local file`);
    } else {
      // Fallback
      productsData = FALLBACK.products;
    }
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
  
  // Load categories from API response
  if (categoriesResponse) {
    // Handle admin API response format { success: true, data: [...] }
    const categoriesData = categoriesResponse.success ? categoriesResponse.data : categoriesResponse;
    if (Array.isArray(categoriesData)) {
      state.categories = categoriesData.filter(c => c.isActive);
      console.log(`[Categories] Loaded ${state.categories.length} active categories`);
    } else {
      state.categories = FALLBACK_CATEGORIES;
    }
  } else {
    state.categories = FALLBACK_CATEGORIES;
  }
  
  // Load recent arrivals from API response
  if (recentArrivalsResponse) {
    if (recentArrivalsResponse.data && Array.isArray(recentArrivalsResponse.data)) {
      // Admin API format: { data: [...], pagination: {...} }
      state.recentArrivals = recentArrivalsResponse.data.map(normalizeProduct).filter(p => p.isActive);
      console.log(`[Recent Arrivals] Loaded ${state.recentArrivals.length} recent products from API`);
    } else if (Array.isArray(recentArrivalsResponse)) {
      // Local JSON format
      state.recentArrivals = recentArrivalsResponse.map(normalizeProduct).filter(p => p.isActive);
      console.log(`[Recent Arrivals] Loaded ${state.recentArrivals.length} recent products`);
    }
  } else {
    state.recentArrivals = [];
    console.log('[Recent Arrivals] No recent arrivals data available');
  }

  // Load blog posts
  if (blogResponse && Array.isArray(blogResponse)) {
    state.blog = blogResponse;
    console.log(`[Blog] Loaded ${state.blog.length} blog posts`);
  } else {
    state.blog = [];
    console.log('[Blog] No blog posts available');
  }
}

function normalizeTag(t) {
  return String(t || "").trim().toLowerCase();
}

function normalizeProduct(p) {
  // Handle Admin API, Muralla 5.0 API, and local JSON formats
  return {
    id: p.id || p.sku || "",
    sku: p.sku || p.id || "",
    name: p.name || "",
    description: p.description || "",
    category: p.category || p.menuSection || "",
    price: p.unitPrice || p.price || 0,
    tags: (p.tags || []).map(normalizeTag),
    image: p.image || "",
    type: p.type || "",
    brand: p.brand || "",
    isActive: p.isActive !== undefined ? p.isActive : true,
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

  // Remove skeleton class from ticker
  document.getElementById('ticker')?.classList.remove('skeleton-element');

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

// Split-flap display for today's specials
function initSplitFlap() {
  const items = state.today?.items || [];
  console.log('[Split-Flap] Initializing with items:', items);
  
  if (!items.length) {
    console.warn('[Split-Flap] No items found in state.today.items');
    return;
  }
  
  if (!el.flapDisplay) {
    console.warn('[Split-Flap] flapDisplay element not found');
    return;
  }
  
  console.log(`[Split-Flap] Starting with ${items.length} items`);
  
  // Start with first item
  updateFlapText(items[0]);
  
  // Rotate through items every 4 seconds
  state.flapInterval = setInterval(() => {
    state.flapIndex = (state.flapIndex + 1) % items.length;
    flipToNextItem(items[state.flapIndex]);
  }, 4000);
}

function updateFlapText(item) {
  if (!el.flapCard) return;
  
  const price = item.price ? ` - $${Number(item.price).toLocaleString("es-CL")}` : "";
  const text = `${item.name}${price}`;
  
  const topHalf = el.flapCard.querySelector('.flap-top');
  const bottomHalf = el.flapCard.querySelector('.flap-bottom');
  
  if (topHalf && bottomHalf) {
    topHalf.innerHTML = `<span>${text}</span>`;
    bottomHalf.innerHTML = `<span>${text}</span>`;
  }
}

function flipToNextItem(item) {
  if (!el.flapDisplay) return;
  
  // Add flipping class
  el.flapDisplay.classList.add('flipping');
  
  // Update text mid-flip (at 300ms, halfway through 600ms animation)
  setTimeout(() => {
    updateFlapText(item);
  }, 300);
  
  // Remove flipping class after animation
  setTimeout(() => {
    el.flapDisplay.classList.remove('flipping');
  }, 600);
}

// renderToday function removed - "Hoy" section has been removed from the site

// Generate a consistent hash from product ID/SKU/name for color assignment
function getProductHash(product) {
  // Handle both products and events
  const key = product.id || product.sku || product.name || product.title || '';
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
  // Remove skeleton chips and render real categories
  el.categoryChips.innerHTML = state.categories.map(cat => {
    const emoji = cat.emoji || '';
    const name = cat.name || '';
    const displayName = emoji ? `${emoji} ${name}` : name;
    return `<button class="category-chip" data-category="${name}" style="${cat.color ? `border-color: ${cat.color}` : ''}">${displayName}</button>`;
  }).join("");

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
  // Remove skeleton chips and render real filter tags
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

function renderProductSkeletons() {
  // Render 20 skeleton cards immediately with correct colors
  const skeletons = Array.from({ length: 20 }, (_, i) => {
    const colors = getColorPalette(i);
    return `<article class="card-flip-container product-skeleton" style="background-color:${colors.bg}">
      <div class="card-flip">
        <div class="card-front" style="color:${colors.text}">
          <div class="card-content">
            <div class="skeleton-text skeleton-title"></div>
            <div class="skeleton-text skeleton-subtitle"></div>
            <div class="skeleton-text skeleton-desc"></div>
          </div>
        </div>
      </div>
    </article>`;
  }).join('');

  el.products.innerHTML = skeletons;
}

function renderProducts(skipAnimation = false) {
  // Limit to specific product IDs for homepage display
  const allowedIds = ['04', '05', '06', '07', '08', '09', '10', '11', '14', '15', '16', '18'];

  let items = state.products.filter(p =>
    allowedIds.includes(p.id) &&
    matchTags(p) &&
    matchCategories(p) &&
    matchSearch(p)
  );

  // Sort alphabetically if category or search is active, otherwise shuffle
  if (state.selectedCategory || state.searchQuery) {
    items = items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else {
    // Shuffle only on initial load (check if we haven't shuffled yet)
    if (!state.hasShuffled) {
      state.products = shuffleArray(state.products);
      state.hasShuffled = true;
      items = state.products.filter(p => allowedIds.includes(p.id)); // Use shuffled but filtered
    }
  }

  const animationClass = skipAnimation ? '' : 'fade-in';
  
  el.products.innerHTML = items
    .map((p, i) => {
      // Use sequential color assignment by index (no repeats until all palettes exhausted)
      const colors = p.image ? null : getColorPalette(i);
      const bgStyle = p.image ? `background-image:url('${p.image}')` : `background-color:${colors.bg}`;
      const textColor = colors ? colors.text : '#fff';
      const badges = (p.tags || []).map(t => `<span class="badge">${t}</span>`).join(" ");
      const price = p.price ? `$${Number(p.price).toLocaleString("es-CL")}` : "";
      const desc = p.description || "The quick, brown fox jumped over the lazy dog.";
      return `<article class="card-flip-container ${animationClass}" data-id="${p.id}" style="${bgStyle}">
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

// Render products with smooth fade transition
function renderProductsWithFade() {
  // Add fade-out class
  el.products.classList.add('products-fade-out');
  
  setTimeout(() => {
    // Render new products
    renderProducts();
    
    // Remove fade-out, products will fade in
    el.products.classList.remove('products-fade-out');
  }, 300); // Match CSS transition duration
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

    // Use random color palette
    const randomIndex = Math.floor(Math.random() * COLOR_PALETTE.length);
    const colors = COLOR_PALETTE[randomIndex];
    const bgStyle = `<div class="event-card-bg" style="background-color:${colors.bg}"></div>`;
    const textColor = colors.text;

    // Build time display
    let timeDisplay = '';
    if (event.start_time && event.end_time) {
      timeDisplay = `${event.start_time} - ${event.end_time}`;
    } else if (event.start_time) {
      timeDisplay = `desde ${event.start_time}`;
    } else if (event.end_time) {
      timeDisplay = `hasta ${event.end_time}`;
    } else if (event.time) {
      timeDisplay = event.time;
    }

    // Front: Image (if available) or color
    const frontContent = event.image
      ? `<img src="${event.image}" alt="${event.title}" class="event-card-front-image" />`
      : bgStyle;

    return `
      <div class="event-card" data-event-id="${event.id}" onclick="this.classList.toggle('flipped')">
        <div class="event-card-inner">
          <div class="event-card-front">
            ${frontContent}
          </div>
          <div class="event-card-back">
            ${bgStyle}
            <div class="event-date-badge">
              <span class="event-date-day">${day}</span>
              <span class="event-date-month">${month}</span>
            </div>
            <span class="event-category">${event.category}</span>
            <div class="event-content">
              <h3 class="event-title" style="color:${textColor}">${event.title}</h3>
              <p class="event-description" style="color:${textColor}">${event.description}</p>
              ${timeDisplay ? `<div class="event-meta" style="color:${textColor}">
                <span class="event-meta-item">🕐 ${timeDisplay}</span>
              </div>` : ''}
              ${event.place ? `<div class="event-meta" style="color:${textColor}">
                <span class="event-meta-item">📍 ${event.place}</span>
              </div>` : ''}
              <a href="${event.bookingUrl || bookingLink(event.title)}" class="event-cta" target="_blank" rel="noopener" onclick="event.stopPropagation()">
                Más info →
              </a>
            </div>
          </div>
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

// Recent Arrivals rendering and carousel
function renderRecentArrivals() {
  const track = document.getElementById('recentArrivalsTrack');
  if (!track || !state.recentArrivals || state.recentArrivals.length === 0) {
    if (track) {
      track.innerHTML = '<p style="color:var(--muted);padding:40px;text-align:center;">No hay productos recién llegados por ahora.</p>';
    }
    return;
  }

  const recentProducts = state.recentArrivals.slice(0, 10); // Limit to 10 products

  const productCards = recentProducts.map((product, index) => {
    // Use color palette for products without images
    const colors = product.image ? null : getColorPalette(index);
    const bgStyle = product.image 
      ? `background-image: url('${product.image}'); background-size: cover; background-position: center;` 
      : `background-color: ${colors.bg}`;
    const textColor = colors ? colors.text : '#fff';

    // Format price
    const price = product.price ? `$${Number(product.price).toLocaleString("es-CL")}` : "";
    
    // Format tags/badges
    const badges = (product.tags || []).map(t => `<span class="badge">${t}</span>`).join(" ");

    return `
      <div class="recent-arrival-card" data-product-id="${product.id}" onclick="this.classList.toggle('flipped')">
        <div class="recent-arrival-card-inner">
          <div class="recent-arrival-card-front" style="${bgStyle}">
            <div class="recent-arrival-overlay">
              <span class="recent-arrival-badge">NUEVO</span>
            </div>
          </div>
          <div class="recent-arrival-card-back" style="${bgStyle}">
            <div class="recent-arrival-content">
              <h3 class="recent-arrival-title" style="color:${textColor}">${product.name}</h3>
              <p class="recent-arrival-category" style="color:${textColor}">${product.category || ''}</p>
              ${badges ? `<div class="recent-arrival-badges">${badges}</div>` : ''}
              <div class="recent-arrival-footer">
                <span class="recent-arrival-price" style="color:${textColor}">${price}</span>
                <a href="${bookingLink(product.name)}" class="recent-arrival-cta" target="_blank" rel="noopener" onclick="event.stopPropagation()">
                  Reservar →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  track.innerHTML = productCards;
  wireRecentArrivalsCarousel();
}

function wireRecentArrivalsCarousel() {
  const track = document.getElementById('recentArrivalsTrack');
  const prevBtn = document.getElementById('recentPrev');
  const nextBtn = document.getElementById('recentNext');

  if (!track || !prevBtn || !nextBtn) return;

  const cards = track.querySelectorAll('.recent-arrival-card');
  const cardWidth = 280 + 16; // card width + gap
  const maxSlide = Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardWidth));

  function updateButtons() {
    prevBtn.disabled = state.recentSlideIndex <= 0;
    nextBtn.disabled = state.recentSlideIndex >= maxSlide;
  }

  function slide(direction) {
    state.recentSlideIndex = Math.max(0, Math.min(maxSlide, state.recentSlideIndex + direction));
    track.style.transform = `translateX(-${state.recentSlideIndex * cardWidth}px)`;
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

// Blog rendering with browser-window cards
function renderBlog() {
  const grid = document.getElementById('blogGrid');
  if (!grid || !state.blog || state.blog.length === 0) {
    if (grid) {
      grid.innerHTML = '<p style="color:var(--muted);padding:40px;text-align:center;grid-column:1/-1;">No hay historias disponibles por ahora.</p>';
    }
    return;
  }

  // Show only featured posts (max 3)
  const featuredPosts = state.blog.filter(post => post.featured).slice(0, 3);
  
  if (featuredPosts.length === 0) {
    grid.innerHTML = '<p style="color:var(--muted);padding:40px;text-align:center;grid-column:1/-1;">No hay historias destacadas.</p>';
    return;
  }

  const categoryColors = {
    'Manifiesto': '#ff6b6b',
    'Café': '#e67e5f',
    'Eventos': '#9b87f5',
    'Comida': '#7ed957',
    'Comunidad': '#f59e0b',
    'Sostenibilidad': '#10b981',
    'Arte': '#ec4899'
  };

  grid.innerHTML = featuredPosts.map((post, index) => {
    const categoryColor = categoryColors[post.category] || '#e67e5f';
    const colors = getColorPalette(index);
    
    // Format date
    const postDate = new Date(post.date);
    const formattedDate = postDate.toLocaleDateString('es-CL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const isManifesto = post.isManifesto || false;
    const manifestoClass = isManifesto ? ' blog-card-manifesto' : '';
    
    return `
      <article class="blog-card${manifestoClass}" data-category="${post.category}">
        <div class="blog-card-window">
          <div class="blog-card-titlebar">
            <div class="blog-card-dots">
              <span class="blog-dot"></span>
              <span class="blog-dot"></span>
              <span class="blog-dot"></span>
            </div>
          </div>
          <div class="blog-card-content" style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%);">
            <div class="blog-card-inner">
              <span class="blog-category" style="color: ${categoryColor}">${post.category}</span>
              <h3 class="blog-title">${post.title}</h3>
              <p class="blog-excerpt">${post.excerpt}</p>
              <div class="blog-meta">
                <span class="blog-author">${post.author}</span>
                <span class="blog-divider">•</span>
                <span class="blog-read-time">${post.readTime}</span>
              </div>
              <a href="/blog/${post.slug}" class="blog-read-link">
                ${isManifesto ? 'Leer manifiesto →' : 'Leer historia →'}
              </a>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');
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

  // Filter valid posts first
  const validInstagram = instagramPosts.filter(post => post.image && post.image.trim() !== '');
  const validTikTok = tiktokPosts.filter(post => post.image && post.image.trim() !== '');

  // Aim for 50/50 split - 5 from each platform for 10 total posts
  const targetTotal = 10;
  const targetPerPlatform = targetTotal / 2; // 5 each

  // Shuffle each platform's posts
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const shuffledInstagram = shuffleArray(validInstagram);
  const shuffledTikTok = shuffleArray(validTikTok);

  // Calculate how many to take from each platform
  let instagramCount = Math.min(targetPerPlatform, shuffledInstagram.length);
  let tiktokCount = Math.min(targetPerPlatform, shuffledTikTok.length);

  // If one platform has fewer posts, take more from the other to reach target
  if (instagramCount < targetPerPlatform) {
    tiktokCount = Math.min(targetTotal - instagramCount, shuffledTikTok.length);
  } else if (tiktokCount < targetPerPlatform) {
    instagramCount = Math.min(targetTotal - tiktokCount, shuffledInstagram.length);
  }

  // Take the calculated number from each platform
  const selectedInstagram = shuffledInstagram.slice(0, instagramCount);
  const selectedTikTok = shuffledTikTok.slice(0, tiktokCount);

  // Combine and shuffle again for final random order
  const allPosts = [...selectedInstagram, ...selectedTikTok];
  const validPosts = shuffleArray(allPosts);

  console.log('[Social Grid] Final mix:', instagramCount, 'Instagram +', tiktokCount, 'TikTok =', validPosts.length, 'total');

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

    // Format engagement numbers (1234 -> 1.2k)
    const formatCount = (num) => {
      if (!num || num === 0) return '0';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
    };

    const likes = formatCount(post.likesCount || 0);
    const comments = formatCount(post.commentCount || 0);

    return `
      <a href="${post.link}" class="instagram-post" target="_blank" rel="noopener" title="${post.caption || ''} (${platform})">
        <img src="${post.image}" alt="${post.caption || platform + ' post'}" loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="console.error('Failed to load:', this.src); this.parentElement.style.display='none'">
        <div class="instagram-post-overlay">
          ${logo}
          <div class="instagram-post-stats">
            <span>❤️ ${likes}</span>
            <span>💬 ${comments}</span>
          </div>
        </div>
      </a>
    `;
  }).join('');
}

// Social comments scrolling animation
function initSocialComments() {
  const column1 = document.getElementById('commentsColumn1');
  const column2 = document.getElementById('commentsColumn2');
  const column3 = document.getElementById('commentsColumn3');

  if (!column1 || !column2 || !column3) return;

  const columns = [column1, column2, column3];

  // Collect all comments from Instagram posts
  const instagramPosts = state.instagramPosts || [];
  const allComments = [];

  instagramPosts.forEach(post => {
    if (post.comments && Array.isArray(post.comments)) {
      post.comments.forEach(comment => {
        // Filter out muralla.cafe replies only
        if (comment.text &&
            comment.text.trim().length > 0 &&
            comment.ownerUsername !== 'muralla.cafe') {
          // Generate color from username
          const colors = gradientPlaceholder({ name: comment.ownerUsername });

          allComments.push({
            author: '@' + comment.ownerUsername,
            text: comment.text,
            avatar: comment.ownerProfilePicUrl || '',
            link: post.link, // Link to the Instagram post
            color: colors.text // Random color for username
          });
        }
      });
    }
  });

  // Shuffle comments for variety
  const shuffled = [...allComments].sort(() => Math.random() - 0.5);

  // If no comments available, use placeholder
  if (shuffled.length === 0) {
    console.log('[Comments] No Instagram comments available');
    return;
  }

  columns.forEach((column, colIndex) => {
    // Create double set of comments for seamless loop
    const startIndex = colIndex * 5;
    const commentsForColumn = [];

    for (let i = 0; i < 5; i++) {
      commentsForColumn.push(shuffled[(startIndex + i) % shuffled.length]);
    }

    // Duplicate comments for infinite scroll effect
    const allCommentsForColumn = [...commentsForColumn, ...commentsForColumn];

    allCommentsForColumn.forEach(comment => {
      const commentEl = document.createElement('a');
      commentEl.className = 'social-comment';
      commentEl.href = comment.link;
      commentEl.target = '_blank';
      commentEl.rel = 'noopener noreferrer';

      // Fallback avatar if image fails to load
      const avatarHTML = comment.avatar
        ? `<img src="${comment.avatar}" alt="${comment.author}" class="social-comment-avatar" loading="lazy" onerror="this.style.display='none'">`
        : `<div class="social-comment-avatar" style="background:var(--violet);display:flex;align-items:center;justify-content:center;color:#0b0b10;font-weight:700;font-size:18px;">${comment.author.charAt(1).toUpperCase()}</div>`;

      commentEl.innerHTML = `
        ${avatarHTML}
        <div class="social-comment-content">
          <div class="social-comment-author" style="color:${comment.color}">${comment.author}</div>
          <div class="social-comment-text">${comment.text}</div>
        </div>
      `;
      column.appendChild(commentEl);
    });
  });
}

async function main() {
  // Render skeleton cards immediately before data loads
  renderProductSkeletons();

  // Render category and filter chips immediately (they're hardcoded, don't need data)
  renderCategoryChips();
  renderChips();

  await loadData();
  setQuickLinks();
  renderTicker();
  initSplitFlap();
  // initCarousel(); // Removed - carousel no longer in HTML
  renderProducts();
  renderRecentArrivals();
  renderEvents();
  renderBlog();
  renderInstagram();
  renderMap();
  wireSheet();
  // wireTopCTA(); // Removed - CTA no longer in HTML
  wireSearch();
  startVerbRotation();
  startSpinnerAnimation();
  updateOpenStatus();
  renderReviews();
  initSocialComments();
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

// Google Reviews - Fetch from Apify Google Maps scraper
let allReviews = [];
let displayedReviewsCount = 3;

async function renderReviews() {
  const container = document.getElementById("reviewsContainer");
  const reviewsLink = document.getElementById("googleReviewsLink");

  if (!container) return;

  // Set Google reviews link
  const googleMapsUrl = state.config?.map?.placeUrl || "https://maps.app.goo.gl/XNC8be4Y53Xkyiba8";
  if (reviewsLink) reviewsLink.href = googleMapsUrl;

  try {
    // Fetch reviews from Apify Google Maps scraper
    const response = await fetch(`/api/reviews`);

    if (!response.ok) throw new Error('Failed to fetch reviews');

    const data = await response.json();

    if (data.reviews && data.reviews.length > 0) {
      allReviews = data.reviews;
      displayReviewsWithPagination();
    } else {
      throw new Error('No reviews available');
    }
  } catch (error) {
    console.error('Error fetching reviews:', error);
    showPlaceholderReviews(container);
  }
}

function displayReviewsWithPagination() {
  const container = document.getElementById("reviewsContainer");

  // Show 3 reviews at a time in carousel
  const reviewsHTML = allReviews.map((review, index) => {
    const avatarUrl = review.profile_photo_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(review.author_name) + '&background=c8b5d1&color=0b0b10&size=80';
    const maxChars = 150;
    const isLong = review.text.length > maxChars;
    const truncatedText = isLong ? review.text.substring(0, maxChars) + '...' : review.text;

    const images = review.images || [];
    const imagesHTML = images.length > 0 ? `
      <div class="review-images-horizontal">
        ${images.map((img, imgIndex) => `
          <img src="${img}" alt="Review image ${imgIndex + 1}" class="review-thumbnail" onclick="openImageCarousel(${index}, ${imgIndex})" loading="lazy">
        `).join('')}
      </div>
    ` : '';

    return `
      <div class="review-card" data-review-index="${index}">
        <div class="review-rating-large">${review.rating}/5</div>
        <div class="review-header">
          <img src="${avatarUrl}" alt="${review.author_name}" class="review-avatar">
          <div class="review-author-info">
            <div class="review-author">${review.author_name}</div>
          </div>
        </div>
        <p class="review-text" data-full-text="${review.text.replace(/"/g, '&quot;')}">
          "${truncatedText}"
          ${isLong ? `<button class="review-read-more" onclick="toggleReviewText(${index})">Leer más</button>` : ''}
        </p>
        ${imagesHTML}
      </div>
    `;
  }).join("");

  container.innerHTML = `
    <div class="reviews-carousel-track" id="reviewsTrack">
      ${reviewsHTML}
    </div>
  `;

  // Add navigation arrows
  const reviewsContainer = document.getElementById('reviewsContainer');
  if (reviewsContainer && allReviews.length > 3) {
    let existingNav = reviewsContainer.querySelector('.reviews-carousel-nav');
    if (!existingNav) {
      const nav = document.createElement('div');
      nav.className = 'reviews-carousel-nav';
      nav.innerHTML = `
        <button class="reviews-carousel-prev" onclick="scrollReviews(-1)" aria-label="Previous reviews">‹</button>
        <button class="reviews-carousel-next" onclick="scrollReviews(1)" aria-label="Next reviews">›</button>
      `;
      reviewsContainer.appendChild(nav);
    }
  }
}

function scrollReviews(direction) {
  const track = document.getElementById('reviewsTrack');
  if (!track) return;

  const container = document.getElementById('reviewsContainer');
  const cardWidth = container.querySelector('.review-card')?.offsetWidth || 300;
  const gap = 12; // Gap between cards
  const scrollAmount = (cardWidth + gap) * 3 * direction; // Scroll 3 cards at a time

  track.scrollBy({
    left: scrollAmount,
    behavior: 'smooth'
  });
}

function toggleReviewText(index) {
  const reviewCard = document.querySelector(`[data-review-index="${index}"]`);
  const textElement = reviewCard.querySelector('.review-text');
  const button = reviewCard.querySelector('.review-read-more');
  const fullText = textElement.getAttribute('data-full-text');

  if (button.textContent === 'Leer más') {
    textElement.innerHTML = `"${fullText}" <button class="review-read-more" onclick="toggleReviewText(${index})">Leer menos</button>`;
  } else {
    const maxChars = 150;
    const truncatedText = fullText.substring(0, maxChars) + '...';
    textElement.innerHTML = `"${truncatedText}" <button class="review-read-more" onclick="toggleReviewText(${index})">Leer más</button>`;
  }
}


function openImageCarousel(reviewIndex, imageIndex) {
  const review = allReviews[reviewIndex];
  const images = review.images || [];

  if (images.length === 0) return;

  // Create modal
  const modal = document.createElement('div');
  modal.className = 'image-carousel-modal';
  modal.innerHTML = `
    <div class="image-carousel-overlay" onclick="closeImageCarousel()"></div>
    <div class="image-carousel-container">
      <button class="carousel-close" onclick="closeImageCarousel()">✕</button>
      ${images.length > 1 ? '<button class="carousel-prev" onclick="carouselPrev()">‹</button>' : ''}
      <img src="${images[imageIndex]}" alt="Review image" class="carousel-image" id="carouselImage">
      ${images.length > 1 ? '<button class="carousel-next" onclick="carouselNext()">›</button>' : ''}
      ${images.length > 1 ? `<div class="carousel-dots">${images.map((_, i) => `<span class="carousel-dot ${i === imageIndex ? 'active' : ''}" onclick="carouselGoTo(${i})"></span>`).join('')}</div>` : ''}
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // Store carousel state
  window.carouselState = {
    images: images,
    currentIndex: imageIndex
  };
}

function closeImageCarousel() {
  const modal = document.querySelector('.image-carousel-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
    window.carouselState = null;
  }
}

function carouselPrev() {
  if (!window.carouselState) return;
  const { images, currentIndex } = window.carouselState;
  const newIndex = (currentIndex - 1 + images.length) % images.length;
  carouselGoTo(newIndex);
}

function carouselNext() {
  if (!window.carouselState) return;
  const { images, currentIndex } = window.carouselState;
  const newIndex = (currentIndex + 1) % images.length;
  carouselGoTo(newIndex);
}

function carouselGoTo(index) {
  if (!window.carouselState) return;
  window.carouselState.currentIndex = index;
  const img = document.getElementById('carouselImage');
  if (img) img.src = window.carouselState.images[index];

  // Update dots
  document.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.className = i === index ? 'carousel-dot active' : 'carousel-dot';
  });
}

// Make functions global for onclick handlers
window.toggleReviewText = toggleReviewText;
window.scrollReviews = scrollReviews;
window.openImageCarousel = openImageCarousel;
window.closeImageCarousel = closeImageCarousel;
window.carouselPrev = carouselPrev;
window.carouselNext = carouselNext;
window.carouselGoTo = carouselGoTo;

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
function getContextualVerbs() {
  const verbsData = state.verbs || {};
  const now = new Date();
  const hour = now.getHours();
  const month = now.getMonth(); // 0-11

  let pool = [...(verbsData.all || [])];

  // Time of day
  if (hour >= 6 && hour < 12) {
    pool = [...pool, ...(verbsData.morning || [])];
  } else if (hour >= 12 && hour < 17) {
    pool = [...pool, ...(verbsData.afternoon || [])];
  } else if (hour >= 17 && hour < 21) {
    pool = [...pool, ...(verbsData.evening || [])];
  } else {
    pool = [...pool, ...(verbsData.night || [])];
  }

  // Season (Southern Hemisphere - Chile)
  let season;
  if (month >= 11 || month <= 1) { // Dec, Jan, Feb
    season = 'summer';
  } else if (month >= 2 && month <= 4) { // Mar, Apr, May
    season = 'fall';
  } else if (month >= 5 && month <= 7) { // Jun, Jul, Aug
    season = 'winter';
  } else { // Sep, Oct, Nov
    season = 'spring';
  }
  pool = [...pool, ...(verbsData[season] || [])];

  // Special dates and festivities
  const day = now.getDate();

  // Pride Month (June)
  if (month === 5) {
    pool = [...pool, ...(verbsData.pride || [])];
  }

  // Christmas season (Dec 1-31)
  if (month === 11) {
    pool = [...pool, ...(verbsData.christmas || [])];
  }

  // New Year (Dec 25 - Jan 7)
  if ((month === 11 && day >= 25) || (month === 0 && day <= 7)) {
    pool = [...pool, ...(verbsData.newyear || [])];
  }

  // Halloween (Oct 25-31)
  if (month === 9 && day >= 25) {
    pool = [...pool, ...(verbsData.halloween || [])];
  }

  // Valentine's Day (Feb 10-14)
  if (month === 1 && day >= 10 && day <= 14) {
    pool = [...pool, ...(verbsData.valentines || [])];
  }

  // Fiestas Patrias - Chile Independence (Sep 15-19)
  if (month === 8 && day >= 15 && day <= 19) {
    pool = [...pool, ...(verbsData.fiestas_patrias || [])];
  }

  return pool;
}

function startVerbRotation() {
  const verbText = document.getElementById("verbText");
  if (!verbText) return;

  if (!state.verbs || Object.keys(state.verbs).length === 0) {
    console.warn('No verbs loaded');
    return;
  }

  function updateVerb() {
    // Get contextual verb pool based on time and season
    const verbs = getContextualVerbs();
    if (verbs.length === 0) return;

    // Pick a random verb from the contextual pool
    const randomIndex = Math.floor(Math.random() * verbs.length);
    verbText.textContent = verbs[randomIndex];
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

  // Remove skeleton class from status
  statusEl.classList.remove('skeleton-element');

  // Use Chile timezone
  const now = new Date();
  const chileTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Santiago"}));
  const day = chileTime.getDay();
  const hours = chileTime.getHours();
  const minutes = chileTime.getMinutes();
  const currentTime = hours * 60 + minutes;

  // Check if today is a special location day from config
  const todayDate = chileTime.toISOString().split('T')[0];
  const specialLocation = state.config?.specialLocations?.find(loc => loc.date === todayDate);

  // Also check for events with a place field happening today
  const todayEvent = state.events?.find(event => {
    const eventDate = event.date;
    return eventDate === todayDate && event.place;
  });

  if (specialLocation) {
    // Special location mode from config
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
  } else if (todayEvent) {
    // Event with place happening today
    statusEl.className = "open-status special-location loaded";
    statusText.textContent = "abierto de visita";

    if (tooltip) {
      // Build time range display
      let timeInfo = '';
      if (todayEvent.start_time && todayEvent.end_time) {
        timeInfo = `${todayEvent.start_time} - ${todayEvent.end_time}`;
      } else if (todayEvent.start_time) {
        timeInfo = `desde ${todayEvent.start_time}`;
      } else if (todayEvent.end_time) {
        timeInfo = `hasta ${todayEvent.end_time}`;
      } else if (todayEvent.time) {
        timeInfo = todayEvent.time;
      }

      tooltip.innerHTML = `
        <div style="white-space: pre-line; text-align: left;">
          <strong>${todayEvent.title}</strong><br>
          ${todayEvent.place}<br>
          ${timeInfo ? `<span style="font-size: 12px; opacity: 0.9;">🕐 ${timeInfo}</span><br>` : ''}
          <span style="font-size: 12px; opacity: 0.9;">${todayEvent.description}</span>
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
