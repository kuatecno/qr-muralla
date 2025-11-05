# CORS Configuration Complete ✅

## What Was Done

Added CORS (Cross-Origin Resource Sharing) support to the Muralla Admin API to allow `qr.murallacafe.cl` to access products and categories data.

## Changes Made

### 1. Created CORS Helper (`src/lib/cors.ts`)
```typescript
const ALLOWED_ORIGINS = [
  'https://qr.murallacafe.cl',
  'http://localhost:3000',
  'http://localhost:8000',
];
```

**Functions:**
- `getCorsHeaders(origin)` - Returns appropriate CORS headers
- `corsResponse(data, status, origin)` - Wraps JSON responses with CORS headers
- `corsError(error, status, origin)` - Wraps error responses with CORS headers

### 2. Updated Products API (`/api/products`)
- ✅ Added `OPTIONS` handler for preflight requests
- ✅ Added CORS headers to all GET responses
- ✅ Added CORS headers to all POST responses
- ✅ Added CORS headers to all error responses

### 3. Updated Categories API (`/api/categories`)
- ✅ Added `OPTIONS` handler for preflight requests
- ✅ Added CORS headers to all GET responses
- ✅ Added CORS headers to all POST responses
- ✅ Added CORS headers to all error responses

## How It Works

### Before (CORS Error):
```
Browser (qr.murallacafe.cl) → Admin API (admin.murallacafe.cl)
❌ Blocked by CORS policy
```

### After (CORS Allowed):
```
Browser (qr.murallacafe.cl) → Admin API (admin.murallacafe.cl)
✅ Allowed with proper headers
```

## CORS Headers Added

```
Access-Control-Allow-Origin: https://qr.murallacafe.cl
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## Testing

### Test Products API:
```bash
curl https://admin.murallacafe.cl/api/products \
  -H "Authorization: Bearer muralla_live_5e63df1db66e8c739d3a87de5501472a45693af831c67328" \
  -H "Origin: https://qr.murallacafe.cl" \
  -v
```

Look for these headers in the response:
```
< Access-Control-Allow-Origin: https://qr.murallacafe.cl
< Access-Control-Allow-Credentials: true
```

### Test Categories API:
```bash
curl https://admin.murallacafe.cl/api/categories \
  -H "Authorization: Bearer muralla_live_5e63df1db66e8c739d3a87de5501472a45693af831c67328" \
  -H "Origin: https://qr.murallacafe.cl" \
  -v
```

## Expected Behavior

### In QR Muralla Site Console:
**Before:**
```
❌ Access to fetch at 'https://admin.murallacafe.cl/api/products' 
   blocked by CORS policy
```

**After:**
```
✅ [Products] Loaded 47 products from API
✅ [Categories] Loaded 15 active categories
```

## Deployment

The Admin API will automatically redeploy on Vercel when the changes are pushed to `main` branch.

**Check deployment status:**
1. Go to https://vercel.com/dashboard
2. Find `muralla5.0` or `admin-murallacafe` project
3. Wait for **● Ready** status (~1-2 minutes)

## Security Notes

- ✅ Only `qr.murallacafe.cl` is allowed (plus localhost for development)
- ✅ API key authentication still required
- ✅ CORS headers only added when origin is in allowed list
- ✅ Credentials (cookies/auth) are allowed

## Troubleshooting

### If CORS errors persist:

1. **Hard refresh** the QR site: `Cmd + Shift + R`
2. **Check Admin API deployment** is complete
3. **Verify origin** in browser console matches exactly: `https://qr.murallacafe.cl`
4. **Check API key** is set in Vercel environment variables

### Check CORS headers:
```bash
curl -I https://admin.murallacafe.cl/api/products \
  -H "Origin: https://qr.murallacafe.cl" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Should see:
```
Access-Control-Allow-Origin: https://qr.murallacafe.cl
```

## Files Modified

- `/Users/kavi/Sharedcodingprojects/muralla5.0/src/lib/cors.ts` (new)
- `/Users/kavi/Sharedcodingprojects/muralla5.0/src/app/api/products/route.ts`
- `/Users/kavi/Sharedcodingprojects/muralla5.0/src/app/api/categories/route.ts`

## Commit

```
feat: add CORS support for qr.murallacafe.cl - products and categories APIs
```

---

**Status:** ✅ Complete - Waiting for Vercel deployment
