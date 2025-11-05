# Apify Integration Analysis & Service Architecture

## Current Architecture Overview

### How QRMURALLA Uses Apify

```
┌─────────────────────────────────────────────────────────────────┐
│                     APIFY SCRAPERS (scheduled)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Instagram   │  │   TikTok     │  │ Google Maps  │          │
│  │   Scraper    │  │   Scraper    │  │   Scraper    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                   │
│         ▼                  ▼                  ▼                   │
│  ┌──────────────────────────────────────────────────┐           │
│  │         Apify Datasets (Cloud Storage)            │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Token Authentication
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               QRMURALLA (Vercel Serverless)                      │
│  ┌──────────────────────────────────────────────────┐           │
│  │        Proxy Endpoints (api/*.js)                 │           │
│  │  • /api/instagram   → Transforms IG data          │           │
│  │  • /api/tiktok      → Transforms TT data          │           │
│  │  • /api/reviews     → Transforms Maps data        │           │
│  │  • /api/instagram-image → Proxies images (CORS)  │           │
│  └──────────────────────────────────────────────────┘           │
│                                                                   │
│  Cache Strategy:                                                 │
│  • HTTP Cache-Control: 1 hour for posts, 24h for images         │
│  • Local JSON fallbacks for instant loading                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   End Users     │
                    │   (Frontend)    │
                    └─────────────────┘
```

## Current Implementation Details

### 1. **Instagram API** (`api/instagram.js`)
- Fetches last 10 actor runs from Apify
- Identifies Instagram datasets by checking for `shortCode` or `displayUrl` fields
- Transforms Apify data format to custom format
- Expands carousel posts into individual posts
- Proxies images through `/api/instagram-image`
- **Cache**: 1 hour (`s-maxage=3600`)

### 2. **TikTok API** (`api/tiktok.js`)
- Fetches latest successful TikTok scraper run
- Transforms video metadata to unified post format
- Extracts engagement metrics (likes, comments)
- **Cache**: 1 hour

### 3. **Google Reviews API** (`api/reviews.js`)
- Searches recent runs for Google Maps dataset
- Filters reviews: 4+ stars with text only
- Transforms to simplified review format
- **Cache**: Not explicitly set (defaults to no-cache)

### 4. **Image Proxy** (`api/instagram-image.js`)
- Bypasses CORS restrictions
- Whitelists: Instagram CDN, Facebook CDN, TikTok CDN
- **Cache**: 24 hours (CDN + browser cache)

### 5. **Frontend Strategy** (`assets/js/app.js`)
- Loads local JSON files first (instant display)
- Fetches fresh data from API in background
- Client-side cache: 5 minutes in localStorage
- Progressive enhancement approach

---

## Performance Analysis

### ✅ Strengths
1. **Instant Initial Load** - Local JSON files load immediately
2. **Background Refresh** - API updates don't block rendering
3. **Image Optimization** - 24-hour cache on images
4. **CORS Handled** - Serverless proxy avoids cross-origin issues
5. **Data Transformation** - Clean, consistent format for frontend

### ⚠️ Current Limitations
1. **No Database** - Data is fetched from Apify every time (no persistent cache)
2. **Cold Starts** - Vercel serverless functions have ~200-500ms cold start
3. **API Latency** - Apify API calls add 500-1000ms per request
4. **Rate Limits** - Multiple clients = multiple Apify API calls
5. **Cost** - Every user request triggers an Apify API call

---

## Offering This as a Service to External Clients

### Strategy: White-Label Social Media Data API

You become the intermediary between Apify and your clients, so they don't need:
- Apify accounts
- Technical knowledge of scraping
- CORS handling
- Data transformation logic

---

## Architecture Options for Service Offering

### **Option 1: Simple API Proxy (Current + API Keys)**

**Best for:** Quick MVP, low maintenance

```
Client → qr.murallacafe.cl/api/instagram?api_key=CLIENT_KEY
         ↓
         Validate API key
         ↓
         Fetch from Apify (real-time)
         ↓
         Transform & return
```

**Pros:**
- Simple to implement (add API key middleware)
- No database needed
- Always fresh data

**Cons:**
- Slow (500-2000ms per request)
- Expensive (Apify API call per client request)
- No rate limit control
- Cold starts affect performance

**Implementation:**
```javascript
// api/instagram.js - Add at the top
const API_KEYS = {
  'muralla_client_123': { name: 'Muralla Cafe', limit: 1000 },
  'client_abc': { name: 'Other Client', limit: 500 }
};

// Middleware
const apiKey = req.headers['x-api-key'] || req.query.api_key;
if (!API_KEYS[apiKey]) {
  return res.status(401).json({ error: 'Invalid API key' });
}
```

---

### **Option 2: Cached Proxy with Database (RECOMMENDED)**

**Best for:** Production service with multiple clients

```
Client → qr.murallacafe.cl/api/instagram?api_key=CLIENT_KEY
         ↓
         Validate API key
         ↓
         Check database cache (< 10 mins old?)
         ↓
         Yes → Return cached data (50ms)
         No  → Fetch from Apify, update cache, return
```

**Pros:**
- ⚡ Fast (50-100ms from database)
- 💰 Cost-effective (1 Apify call per 10 mins instead of per request)
- 📊 Analytics (track client usage)
- 🎯 Rate limiting per client
- 🔒 No Apify credentials exposed

**Cons:**
- Requires database (Postgres/MongoDB)
- Slightly more complex
- Data can be up to 10 mins stale

**Tech Stack:**
```
Database: Vercel Postgres (or Supabase/PlanetScale)
Cache Duration: 5-15 minutes (configurable)
Background Jobs: Vercel Cron (refresh every 10 mins)
```

**Schema:**
```sql
CREATE TABLE apify_cache (
  id SERIAL PRIMARY KEY,
  data_type VARCHAR(50), -- 'instagram', 'tiktok', 'reviews'
  data JSONB,            -- The transformed data
  client_id VARCHAR(100), -- Optional: per-client cache
  fetched_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE api_usage (
  id SERIAL PRIMARY KEY,
  api_key VARCHAR(100),
  endpoint VARCHAR(100),
  requests_count INT DEFAULT 0,
  last_request_at TIMESTAMP
);

CREATE INDEX idx_cache_type ON apify_cache(data_type, fetched_at);
```

---

### **Option 3: Real-Time with Redis Cache (FASTEST)**

**Best for:** High-traffic service, instant updates

```
Client → qr.murallacafe.cl/api/instagram?api_key=CLIENT_KEY
         ↓
         Validate API key
         ↓
         Check Redis cache (< 5 mins?)
         ↓
         Hit  → Return (10-20ms) ⚡
         Miss → Fetch from Apify, cache in Redis, return
```

**Pros:**
- ⚡⚡⚡ Ultra-fast (10-20ms)
- Scales to millions of requests
- TTL auto-expiration
- Pub/Sub for real-time updates

**Cons:**
- Requires Redis instance ($10-50/mo)
- More complex infrastructure
- Need cache invalidation strategy

**Tech Stack:**
```
Cache: Upstash Redis (serverless, pay-per-request)
TTL: 5-10 minutes
Cron: Background refresh every 5 mins
```

**Implementation:**
```javascript
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// In api/instagram.js
const cacheKey = 'instagram_posts';
const cached = await redis.get(cacheKey);

if (cached) {
  return res.json(cached); // 10ms response!
}

// Fetch from Apify...
const posts = await fetchFromApify();
await redis.setex(cacheKey, 300, posts); // Cache 5 mins
return res.json(posts);
```

---

### **Option 4: Edge Cache with CDN (GLOBALLY FAST)**

**Best for:** Global clients, minimize latency worldwide

```
Client (Worldwide) → Cloudflare/Vercel Edge Cache
                     ↓
                     Cache Hit? → Return (5-50ms based on location)
                     ↓
                     Cache Miss → Origin (Vercel) → Apify
```

**Pros:**
- 🌍 Global edge network (sub-50ms worldwide)
- 💰 CDN handles caching automatically
- 🚀 No database needed
- ⚡ Scales infinitely

**Cons:**
- Cache invalidation harder
- Less control over per-client data

**Implementation:**
```javascript
// api/instagram.js
export default async function handler(req, res) {
  // Set aggressive edge caching
  res.setHeader('Cache-Control',
    'public, s-maxage=600, stale-while-revalidate=1800'
  );
  // s-maxage=600 → CDN caches for 10 mins
  // stale-while-revalidate=1800 → Serve stale for 30 mins while refreshing

  const posts = await fetchFromApify();
  return res.json(posts);
}
```

---

## Comparison Matrix

| Feature                  | Option 1<br/>Simple Proxy | Option 2<br/>DB Cache | Option 3<br/>Redis | Option 4<br/>Edge CDN |
|--------------------------|---------------------------|------------------------|--------------------|-----------------------|
| **Response Time**        | 500-2000ms                | 50-100ms               | 10-20ms            | 5-50ms (global)       |
| **Cost per 10k reqs**    | $10-20                    | $0.50-1                | $0.10-0.50         | $0.05-0.20            |
| **Data Freshness**       | Real-time                 | 5-15 mins              | 5-10 mins          | 10-30 mins            |
| **Setup Complexity**     | ⭐ Simple                  | ⭐⭐ Medium             | ⭐⭐⭐ Complex       | ⭐⭐ Medium            |
| **Scalability**          | Low (Apify limits)        | Medium                 | High               | Very High             |
| **Per-Client Analytics** | Easy                      | Easy                   | Medium             | Hard                  |
| **Infrastructure**       | None                      | Postgres               | Redis              | CDN                   |

---

## RECOMMENDED APPROACH

### **Phase 1: MVP (Week 1)**
Use **Option 1 (Simple Proxy)** with API keys
- Add API key authentication
- Implement basic rate limiting
- Track usage in-memory
- Cost: ~$0 (uses existing infrastructure)

### **Phase 2: Production (Week 2-3)**
Upgrade to **Option 2 (DB Cache)**
- Add Vercel Postgres (free tier: 60hrs/month)
- Implement caching layer
- Add analytics dashboard
- Cron job to refresh cache every 10 mins
- Cost: ~$20/mo (Vercel Postgres)

### **Phase 3: Scale (Month 2+)**
Add **Option 4 (Edge CDN)** for global clients
- Enable Vercel Edge Network
- Add CDN purge API for manual refresh
- Implement webhook from Apify when new data available
- Cost: ~$20-50/mo

---

## What Makes Data Load "Instantly"?

### Current Strategy (Already Good!)
```javascript
// 1. Load local JSON immediately (0ms - from disk)
const cachedData = localStorage.getItem('instagram_posts');
if (cachedData && isFresh(cachedData)) {
  displayPosts(cachedData); // Instant!
}

// 2. Fetch fresh data in background
fetch('/api/instagram')
  .then(data => {
    updatePosts(data); // Refresh if different
    localStorage.setItem('instagram_posts', data);
  });
```

### Optimization Strategies

#### 1. **Static Site Generation (SSG)** - Pre-build HTML
```javascript
// Build time: Fetch from Apify and generate HTML
// Runtime: Serve pre-rendered HTML (instant!)
// Use: Vercel Build Output API or Next.js ISR
```

**Response time: 10-50ms (serving static HTML)**

#### 2. **Server-Side Rendering (SSR) with Cache**
```javascript
// First request: 500ms (fetch from Apify)
// Cached requests: 20ms (serve from memory)
```

#### 3. **Progressive Web App (PWA) with Service Worker**
```javascript
// Offline-first approach
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

**Response time: 5-10ms (from service worker cache)**

#### 4. **WebSocket Real-Time Updates**
```javascript
// Keep connection open
// Push updates when Apify scraper completes
const ws = new WebSocket('wss://api.murallacafe.cl');
ws.onmessage = (event) => {
  const newPosts = JSON.parse(event.data);
  updateUI(newPosts); // Instant update!
};
```

---

## Pricing Strategy for Your Service

### Tier Structure

| Tier          | Requests/Month | Response Time | Price    | Features                        |
|---------------|----------------|---------------|----------|---------------------------------|
| **Free**      | 1,000          | 500-1000ms    | $0       | Basic API access                |
| **Starter**   | 10,000         | 50-100ms      | $29/mo   | DB cache, analytics             |
| **Pro**       | 100,000        | 10-20ms       | $99/mo   | Redis cache, priority support   |
| **Enterprise**| Unlimited      | 5-10ms        | $299/mo  | Edge CDN, dedicated cache, SLA  |

### Revenue Model
```
Cost per 10k requests with DB cache: ~$1
Revenue at Starter tier: $29
Gross margin: 96%

With 10 clients: $290/mo revenue - $50 infrastructure = $240/mo profit
```

---

## Implementation Checklist

### Immediate (Today)
- [ ] Add API key authentication middleware
- [ ] Create client API keys table
- [ ] Implement basic rate limiting
- [ ] Add usage tracking

### Week 1
- [ ] Set up Vercel Postgres database
- [ ] Create cache tables
- [ ] Implement cache-first API endpoints
- [ ] Create Vercel Cron job to refresh cache

### Week 2
- [ ] Build client dashboard (API key management)
- [ ] Add analytics (requests/day, response times)
- [ ] Create documentation site
- [ ] Set up billing (Stripe)

### Week 3
- [ ] Add webhook support (notify clients on new data)
- [ ] Implement cache invalidation API
- [ ] Add more data sources (Twitter, YouTube)
- [ ] Launch beta

---

## Sample Client Integration

### How Clients Would Use Your Service

```javascript
// Instead of dealing with Apify...
const MURALLA_API_KEY = 'client_abc123';

// They just call your simple API
fetch('https://qr.murallacafe.cl/api/instagram?api_key=' + MURALLA_API_KEY)
  .then(res => res.json())
  .then(posts => {
    // Data is already transformed, images proxied, ready to use!
    posts.forEach(post => {
      console.log(post.caption, post.image);
    });
  });
```

### Even Simpler: CDN URL
```html
<!-- Drop-in script tag -->
<script src="https://cdn.murallacafe.cl/widget.js?key=client_abc"></script>
<div id="muralla-instagram-feed"></div>

<!-- Widget auto-loads and displays posts -->
```

---

## Questions to Decide

1. **Who are your target clients?**
   - Restaurants/cafes like Muralla?
   - Digital agencies?
   - Marketing platforms?

2. **What data sources to offer?**
   - Just Instagram/TikTok?
   - Also Google Reviews, Twitter, YouTube?

3. **Pricing model?**
   - Per-request?
   - Monthly subscription?
   - Pay-per-data-source?

4. **Brand as?**
   - White-label (they don't know it's Apify)?
   - Co-branded (Muralla + Apify)?

---

## Next Steps

**I recommend:**

1. **Start with Option 2 (DB Cache)** - Best balance of speed, cost, and simplicity
2. **Use Vercel Postgres** - Stays in the same ecosystem, easy to set up
3. **10-minute cache refresh** - Fresh enough for social media data
4. **Simple API key auth** - Easy for clients to integrate
5. **Usage-based pricing** - Scales with client success

Would you like me to implement any of these options? I can start with the database schema and API key authentication system.
