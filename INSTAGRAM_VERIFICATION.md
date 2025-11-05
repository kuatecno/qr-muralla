# Instagram Verification Integration

## Overview

This integration allows users to verify their Instagram accounts by sending a code via DM to your Instagram bot account (@murallacafe).

## Files Created

- `assets/js/instagram-verification.js` - Core verification logic
- `assets/css/instagram-verification.css` - Modal styling
- `ig-verify-example.html` - Demo implementation

## Setup

### 1. Configure API Credentials

Edit `assets/js/instagram-verification.js`:

```javascript
const IG_VERIFICATION_CONFIG = {
  apiUrl: 'https://api.flowkick.com', // Your API URL
  apiKey: 'YOUR_API_KEY',             // Your API key
  webhookUrl: 'https://qr.murallacafe.cl/api/ig-webhook',
  expiresInMinutes: 10
};
```

### 2. Basic Usage

```javascript
import { 
  InstagramVerification, 
  IG_VERIFICATION_CONFIG, 
  showVerificationModal, 
  updateVerificationStatus 
} from '/assets/js/instagram-verification.js';

// Initialize verifier
const verifier = new InstagramVerification(IG_VERIFICATION_CONFIG);

// Generate code for a user
const result = await verifier.generateCode('user123');

// Show modal
const modal = showVerificationModal(
  result.verification_code,
  '10 minutos'
);

// Start polling
verifier.startPolling(
  // On success
  (status) => {
    console.log('Verified!', status.ig_username);
    updateVerificationStatus(modal, 'verified');
  },
  // On error
  (error) => {
    console.error('Error:', error);
    updateVerificationStatus(modal, 'error');
  }
);
```

## API Flow

### 1. Generate Verification Code

```javascript
POST /api/verification/generate
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "external_website": "qr.murallacafe.cl",
  "external_user_id": "user123",
  "webhook_url": "https://qr.murallacafe.cl/api/ig-webhook",
  "expires_in_minutes": 10
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "verification_code": "CAFE2025",
  "expires_at": "2025-11-05T02:10:00Z"
}
```

### 2. Check Verification Status

```javascript
GET /api/verification/check?session=sess_abc123
Authorization: Bearer YOUR_API_KEY
```

**Response (Pending):**
```json
{
  "status": "pending",
  "session_id": "sess_abc123"
}
```

**Response (Verified):**
```json
{
  "status": "verified",
  "ig_username": "@johndoe",
  "verified_at": "2025-11-05T02:05:00Z"
}
```

**Response (Expired):**
```json
{
  "status": "expired",
  "session_id": "sess_abc123"
}
```

### 3. Webhook (Optional)

If you provide a `webhook_url`, the API will POST to it when verification succeeds:

```javascript
POST https://qr.murallacafe.cl/api/ig-webhook
X-Flowkick-Signature: HMAC_SIGNATURE
Content-Type: application/json

{
  "event": "verification.success",
  "ig_username": "@johndoe",
  "external_user_id": "user123",
  "verified_at": "2025-11-05T02:05:00Z"
}
```

## Use Cases

### 1. Exclusive Discounts for Instagram Followers

```javascript
// Verify user follows @murallacafe
const result = await verifier.generateCode(userId);
showVerificationModal(result.verification_code, '10 minutos');

verifier.startPolling((status) => {
  // User verified! Apply 10% discount
  applyDiscount(status.ig_username, 0.10);
});
```

### 2. Instagram-Only Menu Items

```javascript
// Show special menu items only to verified IG users
if (userIsVerified) {
  showInstagramExclusiveMenu();
}
```

### 3. Loyalty Program

```javascript
// Link Instagram account to loyalty program
verifier.startPolling((status) => {
  linkAccountToLoyalty(userId, status.ig_username);
});
```

## UI Components

### Modal Features

- ✅ Clean, modern design matching Muralla branding
- ✅ Copy-to-clipboard functionality
- ✅ Real-time status updates
- ✅ Countdown timer
- ✅ Direct link to Instagram app
- ✅ Responsive mobile design
- ✅ Loading spinner during verification
- ✅ Success/error states

### Customization

Edit `assets/css/instagram-verification.css` to match your brand:

```css
.ig-verification-content {
  background: linear-gradient(180deg, #1a1622 0%, #0f0f15 100%);
  border: 2px solid rgba(200, 181, 209, 0.3);
}

.code-display {
  color: var(--primary); /* Change code color */
  font-size: 32px;       /* Change code size */
}
```

## Security

### Webhook Signature Verification

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const expectedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Testing

1. Open `ig-verify-example.html` in your browser
2. Click "Verificar con Instagram"
3. Copy the generated code
4. Send it via DM to @murallacafe on Instagram
5. Watch the modal update when verified

## Production Checklist

- [ ] Replace `YOUR_API_KEY` with real API key
- [ ] Update `apiUrl` with production endpoint
- [ ] Configure webhook URL (optional)
- [ ] Set up webhook signature verification
- [ ] Test with real Instagram account
- [ ] Add error handling for network failures
- [ ] Implement rate limiting
- [ ] Add analytics tracking

## Support

For API issues, contact Flowkick support or check their documentation.

## License

MIT
