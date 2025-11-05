# Flowkick Data Architecture - Storage & Access Explained

## 🎯 Your Business Model Summary

- **Brand:** Flowkick (white-label)
- **Target Clients:** Restaurants/cafes, digital agencies, end users
- **Data Sources:** Instagram, TikTok, Google Reviews + expandable (Twitter, YouTube, Facebook)
- **Pricing:** Monthly subscription tiers
- **Promise:** Clients get instant social media data without dealing with scraping/APIs

---

## 📦 Where Data is Stored: Shared Database Architecture

### **Answer: YES - All client data in YOUR database (Flowkick's database)**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APIFY (Data Collection)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Instagram   │  │   TikTok     │  │ Google Maps  │              │
│  │   Scraper    │  │   Scraper    │  │   Scraper    │              │
│  │              │  │              │  │              │              │
│  │ Runs every   │  │ Runs every   │  │ Runs every   │              │
│  │ 30 mins      │  │ 30 mins      │  │ 2 hours      │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                  │                  │                       │
│         └──────────────────┴──────────────────┘                      │
│                            │                                          │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────────┐
                │  Apify Webhook (on finish) │
                └────────────┬───────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│               FLOWKICK DATABASE (Vercel Postgres)                    │
│                  ** YOUR CENTRAL DATA STORAGE **                     │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  social_media_cache                                         │    │
│  ├─────────────┬──────────────┬──────────────┬─────────────┤    │
│  │ id          │ client_id    │ platform     │ data        │    │
│  ├─────────────┼──────────────┼──────────────┼─────────────┤    │
│  │ 1           │ muralla_cafe │ instagram    │ {...posts}  │    │
│  │ 2           │ cafe_central │ instagram    │ {...posts}  │    │
│  │ 3           │ muralla_cafe │ tiktok       │ {...videos} │    │
│  │ 4           │ agency_x     │ instagram    │ {...posts}  │    │
│  │ 5           │ muralla_cafe │ google_maps  │ {...reviews}│    │
│  └─────────────┴──────────────┴──────────────┴─────────────┘    │
│                                                                       │
│  Cache Duration: 10-30 minutes (configurable per data source)        │
│  Total Storage: ~50-200 MB per 100 clients                           │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             │ Multiple clients request simultaneously
                             ▼
        ┌────────────────────────────────────────────┐
        │  FLOWKICK API (Vercel Edge Functions)      │
        │  flowkick.kua.cl                           │
        └────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Client 1     │    │ Client 2     │    │ Client 3     │
│ muralla.cafe │    │ cafe-central │    │ Agency Site  │
│              │    │              │    │              │
│ Response:    │    │ Response:    │    │ Response:    │
│ 50-100ms     │    │ 50-100ms     │    │ 50-100ms     │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🗄️ Database Schema (Your Flowkick Database)

### **1. Clients Table**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  api_key VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
  monthly_requests_limit INT DEFAULT 10000,
  monthly_requests_used INT DEFAULT 0,

  -- Social media accounts to track
  instagram_handle VARCHAR(100),
  tiktok_handle VARCHAR(100),
  google_place_id VARCHAR(255),
  twitter_handle VARCHAR(100),
  youtube_channel VARCHAR(100),

  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_request_at TIMESTAMP
);
```

### **2. Social Media Cache Table** (Core!)
```sql
CREATE TABLE social_media_cache (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  platform VARCHAR(50) NOT NULL, -- 'instagram', 'tiktok', 'google_maps', etc.
  data_type VARCHAR(50) NOT NULL, -- 'posts', 'reviews', 'videos', etc.

  data JSONB NOT NULL, -- The actual posts/reviews/videos

  -- Metadata
  item_count INT DEFAULT 0,
  fetched_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- When to refresh

  -- Apify tracking
  apify_dataset_id VARCHAR(100),
  apify_run_id VARCHAR(100),

  UNIQUE(client_id, platform, data_type)
);

CREATE INDEX idx_cache_lookup ON social_media_cache(client_id, platform, data_type);
CREATE INDEX idx_cache_expiry ON social_media_cache(expires_at);
```

### **3. API Usage Tracking**
```sql
CREATE TABLE api_requests (
  id SERIAL PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  endpoint VARCHAR(255),
  response_time_ms INT,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- For analytics dashboard
CREATE INDEX idx_requests_client ON api_requests(client_id, created_at);
```

---

## 🚀 How Clients Access Data (Step-by-Step)

### **Scenario: Restaurant "Cafe Central" wants Instagram posts on their website**

```javascript
// 1. Cafe Central adds this to their website:
<script>
fetch('https://flowkick.kua.cl/api/v1/social/instagram?api_key=fc_cafe_central_abc123')
  .then(res => res.json())
  .then(posts => {
    // Display posts on their website
    posts.forEach(post => {
      document.getElementById('instagram-feed').innerHTML +=
        `<img src="${post.image}" alt="${post.caption}">`;
    });
  });
</script>
```

### **What Happens Behind the Scenes:**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Request arrives at Flowkick API                     │
│ GET /api/v1/social/instagram?api_key=fc_cafe_central_abc123 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Validate API Key (5ms)                              │
│ - Look up client in database                                │
│ - Check if active, within rate limits                       │
│ - Get client's instagram_handle                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Check Cache (10ms)                                  │
│ SELECT data FROM social_media_cache                         │
│ WHERE client_id = 'cafe_central'                            │
│   AND platform = 'instagram'                                │
│   AND expires_at > NOW()                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
         Cache HIT?        Cache MISS?
                │                 │
                ▼                 ▼
    ┌───────────────────┐  ┌────────────────────────┐
    │ Step 4a: Return   │  │ Step 4b: Fetch Fresh   │
    │ Cached Data       │  │ - Query Apify API      │
    │ (50ms total)      │  │ - Transform data       │
    │                   │  │ - Store in cache       │
    │ FAST! ⚡          │  │ - Return to client     │
    └───────────────────┘  │ (800ms total)          │
                           └────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Step 5: Update Usage │
                         │ monthly_requests++   │
                         └──────────────────────┘
```

---

## ⚡ Access Speed Breakdown

### **Cold Start (First Request or Cache Expired)**
```
┌─────────────────────────────────────────────┐
│ API Key Validation:        5ms              │
│ Database Query (cache):    10ms             │
│ Cache Miss - Fetch Apify:  500-800ms        │
│ Transform Data:            50ms             │
│ Store in Database:         20ms             │
│ Return to Client:          10ms             │
├─────────────────────────────────────────────┤
│ TOTAL:                     ~600-900ms       │
└─────────────────────────────────────────────┘
```

### **Warm Cache (Within 10-30 mins)**
```
┌─────────────────────────────────────────────┐
│ API Key Validation:        5ms              │
│ Database Query (cache):    10ms             │
│ Cache Hit - Read JSON:     20ms             │
│ Return to Client:          10ms             │
├─────────────────────────────────────────────┤
│ TOTAL:                     ~50ms ⚡         │
└─────────────────────────────────────────────┘
```

### **Edge Cache (Cloudflare/Vercel Edge)**
```
┌─────────────────────────────────────────────┐
│ Edge Cache Hit:            5-20ms           │
│ (Cached at 200+ locations globally)         │
├─────────────────────────────────────────────┤
│ TOTAL:                     5-20ms ⚡⚡       │
└─────────────────────────────────────────────┘
```

---

## 💾 Storage Efficiency - How Much Data?

### **Per Client Per Platform:**

| Platform | Data Size | Cache Duration | Refresh Frequency |
|----------|-----------|----------------|-------------------|
| Instagram (10 posts) | ~50-100 KB | 30 mins | Every 30 mins |
| TikTok (10 videos) | ~80-120 KB | 30 mins | Every 30 mins |
| Google Reviews | ~30-60 KB | 2 hours | Every 2 hours |
| Twitter | ~40-80 KB | 15 mins | Every 15 mins |
| YouTube | ~60-100 KB | 1 hour | Every hour |

**Total per client (all platforms):** ~250-450 KB

### **Scaling Numbers:**

| Clients | Total Storage | DB Cost/Month | Apify Calls/Month |
|---------|---------------|---------------|-------------------|
| 10 | ~5 MB | $0 (free tier) | ~7,200 |
| 100 | ~50 MB | $20 | ~72,000 |
| 1,000 | ~500 MB | $20 | ~720,000 |
| 10,000 | ~5 GB | $50 | ~7.2M |

**Note:** Vercel Postgres free tier = 256 MB (enough for ~500 clients)

---

## 🔄 Data Freshness Strategy

### **Option A: Scheduled Refresh (Recommended for MVP)**

```
Apify Scraper runs → Webhook to Flowkick → Update all clients' cache
```

**Example:**
```javascript
// Vercel Cron: /api/cron/refresh-instagram
// Runs every 30 minutes

export default async function handler() {
  // Get all clients with instagram_handle
  const clients = await db.query(
    'SELECT id, instagram_handle FROM clients WHERE instagram_handle IS NOT NULL'
  );

  // For each client, check if cache expired
  for (const client of clients) {
    const cache = await db.query(
      'SELECT * FROM social_media_cache WHERE client_id = $1 AND platform = $2',
      [client.id, 'instagram']
    );

    // If expired or doesn't exist, fetch fresh data
    if (!cache || cache.expires_at < new Date()) {
      const posts = await fetchFromApify(client.instagram_handle);

      // Update cache
      await db.query(`
        INSERT INTO social_media_cache (client_id, platform, data, expires_at)
        VALUES ($1, 'instagram', $2, NOW() + INTERVAL '30 minutes')
        ON CONFLICT (client_id, platform)
        DO UPDATE SET data = $2, expires_at = NOW() + INTERVAL '30 minutes'
      `, [client.id, posts]);
    }
  }
}
```

**Benefits:**
- Proactive caching (always fast for clients)
- Predictable Apify usage
- Cheaper (batch requests)

**Drawbacks:**
- Not real-time (max 30min delay)
- Some clients may not need frequent updates

---

### **Option B: On-Demand with Cache (Lazy Loading)**

```
Client requests → Check cache → If expired, fetch fresh → Update cache
```

**Benefits:**
- Only fetch data when clients actually need it
- More efficient Apify usage
- Simpler to implement

**Drawbacks:**
- First request after expiry is slow (600-900ms)
- Unpredictable Apify usage

---

### **Option C: Hybrid (BEST - Recommended for Production)**

```
1. Scheduled refresh for "active" clients (requested in last 24h)
2. On-demand for "inactive" clients
3. Webhook from Apify when new data available
```

**Implementation:**
```javascript
// Mark client as "active" on each request
await db.query(
  'UPDATE clients SET last_request_at = NOW() WHERE id = $1',
  [client.id]
);

// Cron job only refreshes active clients
const activeClients = await db.query(`
  SELECT * FROM clients
  WHERE last_request_at > NOW() - INTERVAL '24 hours'
`);
```

**Benefits:**
- Fast for active clients
- Efficient for inactive clients
- Optimal Apify usage

---

## 🌐 Client Website Integration Examples

### **Example 1: Simple JavaScript**

```html
<!-- Client adds this to their website -->
<!DOCTYPE html>
<html>
<head>
  <title>Cafe Central - Instagram Feed</title>
</head>
<body>
  <div id="instagram-feed"></div>

  <script>
    const FLOWKICK_API_KEY = 'fc_cafe_central_abc123';

    fetch(`https://flowkick.kua.cl/api/v1/social/instagram?api_key=${FLOWKICK_API_KEY}`)
      .then(res => res.json())
      .then(posts => {
        const feed = document.getElementById('instagram-feed');
        posts.forEach(post => {
          feed.innerHTML += `
            <div class="post">
              <img src="${post.image}" />
              <p>${post.caption}</p>
              <span>${post.likes} likes</span>
            </div>
          `;
        });
      });
  </script>
</body>
</html>
```

**Load Time:** 50-100ms (from your cache)

---

### **Example 2: React Component**

```jsx
import { useEffect, useState } from 'react';

export default function InstagramFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('https://flowkick.kua.cl/api/v1/social/instagram?api_key=fc_client_123')
      .then(res => res.json())
      .then(setPosts);
  }, []);

  return (
    <div className="instagram-grid">
      {posts.map(post => (
        <img key={post.id} src={post.image} alt={post.caption} />
      ))}
    </div>
  );
}
```

**Load Time:** 50-100ms

---

### **Example 3: WordPress Plugin (No Code)**

```php
// WordPress Shortcode: [flowkick platform="instagram" key="fc_client_123"]

add_shortcode('flowkick', function($atts) {
  $api_key = $atts['key'];
  $platform = $atts['platform'];

  $response = wp_remote_get(
    "https://flowkick.kua.cl/api/v1/social/{$platform}?api_key={$api_key}"
  );

  $posts = json_decode($response['body']);

  $html = '<div class="flowkick-feed">';
  foreach($posts as $post) {
    $html .= "<img src='{$post->image}' />";
  }
  $html .= '</div>';

  return $html;
});
```

**Usage:** Client just adds `[flowkick platform="instagram" key="..."]` to any page

**Load Time:** 50-100ms

---

### **Example 4: Drop-in Widget (Easiest for Non-Technical Clients)**

```html
<!-- Client adds ONE line of code -->
<script src="https://flowkick.kua.cl/widget.js?key=fc_client_123&platform=instagram"></script>

<!-- That's it! Instagram feed appears automatically -->
```

**Your widget.js does:**
1. Creates container
2. Fetches data
3. Renders styled feed
4. Handles loading states

**Load Time:** 50-100ms + widget load (~100ms) = ~150-200ms total

---

## 📊 Cost Analysis for YOU (Flowkick)

### **Infrastructure Costs:**

| Service | Cost | What For |
|---------|------|----------|
| Vercel Hosting | $20/mo | Serverless functions |
| Vercel Postgres | $0-50/mo | Client cache (256MB free, then $20/1GB) |
| Apify Subscription | $49-249/mo | Data scraping (500-5000 runs/mo) |
| Upstash Redis (optional) | $10/mo | Ultra-fast caching |
| Cloudflare (optional) | $20/mo | Global CDN |
| **TOTAL** | **$50-350/mo** | Depends on scale |

### **Revenue Potential:**

| Tier | Price | Clients | Monthly Revenue |
|------|-------|---------|-----------------|
| **Free** | $0 | 50 | $0 |
| **Starter** | $29/mo | 20 | $580 |
| **Pro** | $99/mo | 10 | $990 |
| **Enterprise** | $299/mo | 3 | $897 |
| **TOTAL** | | 83 | **$2,467/mo** |

**Profit:** $2,467 - $150 (infrastructure) = **$2,317/mo**

---

## 🎯 Summary Answers to Your Questions

### **1. Where is information stored?**
**Answer:** In YOUR database (Flowkick's Vercel Postgres database)
- Shared across all clients
- Each client has their own cached data
- Stored as JSONB for fast retrieval
- Expires every 10-30 mins (configurable)

### **2. How quickly can clients access data on their website?**

| Scenario | Speed | When This Happens |
|----------|-------|-------------------|
| **Cache Hit** | 50-100ms | 95% of the time (after first request) |
| **Cache Miss** | 600-900ms | First request or after cache expires |
| **Edge Cache** | 5-20ms | With Cloudflare/Vercel Edge (optional) |
| **With Service Worker** | 0-10ms | Client implements PWA caching |

**In Practice:**
- Client's website loads in 1-2 seconds total
- Flowkick data appears within 50-100ms of that
- Users see Instagram posts almost instantly
- No spinner/loading needed in most cases

### **3. Is this faster than API?**

**Comparison:**

| Method | Speed | Client Experience |
|--------|-------|-------------------|
| Direct Apify API | 1000-2000ms | Slow, spinner needed |
| Instagram Official API | 200-500ms | Fast but requires approval, rate limits |
| **Your Flowkick Service** | **50-100ms** | **Instant, no loading** |

**Why faster:**
- Data is pre-fetched and cached
- No need to scrape on every request
- Database query vs API call
- Edge caching for global clients

---

## 🚀 Next Steps

Want me to implement:

1. **Database schema** - Set up Postgres tables?
2. **API endpoints** - Build the Flowkick API with caching?
3. **Admin dashboard** - Client management, usage analytics?
4. **Widget/SDK** - Drop-in JavaScript widget for clients?
5. **Billing integration** - Stripe subscription management?

Let me know what to start with! 🎉
