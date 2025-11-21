# API Documentation

This document provides detailed information about all API endpoints in the Ad Intelligence application.

## Authentication

All API routes (except webhooks) require authentication via Bearer token:

```http
Authorization: Bearer <user_session_token>
```

Get the session token from Supabase client:
```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://ad-intelligence-mvp.vercel.app/api`

---

## Endpoints

### 1. POST `/api/analyze`

Analyze an ad creative using AI and generate insights.

**Authentication**: Required

**Request Body:**
```json
{
  "creative_id": "uuid-string",
  "image_url": "https://example.com/image.jpg",
  "ad_copy": "Ad copy text",
  "cta": "Call to action"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "analysis": {
    "id": "uuid-string",
    "creative_id": "uuid-string",
    "analysis_result": {
      "headline": "Extracted headline",
      "headline_length": 45,
      "emotion": "urgency",
      "copy_tone": "professional",
      "primary_color": "blue",
      "visual_elements": ["person", "product"],
      "performance_driver": "Strong CTA with urgency",
      "recommendations": [
        "Test shorter headline",
        "Add social proof"
      ]
    },
    "created_at": "2025-10-29T..."
  }
}
```

**Error Responses:**

- **401 Unauthorized**
  ```json
  { "error": "Unauthorized" }
  ```

- **403 Forbidden** (Free tier limit)
  ```json
  {
    "error": "Free tier limit reached",
    "message": "You've reached your free analysis limit...",
    "requiresUpgrade": true
  }
  ```

- **500 Server Error**
  ```json
  { "error": "Analysis failed" }
  ```

**Implementation Notes:**
- Enforces freemium tier (5 analyses for free users)
- Updates user's analysis_count
- Currently uses mock AI (can be switched to OpenAI)

---

### 2. POST `/api/stripe/checkout`

Create a Stripe checkout session for upgrading to Pro tier.

**Authentication**: Required

**Request Body:** None

**Success Response (200):**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Responses:**

- **401 Unauthorized**
  ```json
  { "error": "Unauthorized" }
  ```

- **500 Server Error**
  ```json
  { "error": "Failed to create checkout session" }
  ```

**Implementation Notes:**
- Creates Stripe customer if doesn't exist
- Stores payment record in database with `pending` status
- Redirects to Stripe hosted checkout
- Success redirect: `/dashboard?payment=success`
- Cancel redirect: `/dashboard?payment=cancelled`
- Subscription: $29/month recurring

---

### 3. POST `/api/stripe/webhook`

Handle Stripe webhook events (internal endpoint, called by Stripe).

**Authentication**: Stripe signature verification

**Headers:**
```http
stripe-signature: t=timestamp,v1=signature
```

**Supported Events:**
- `checkout.session.completed` - Updates user to paid tier
- `customer.subscription.deleted` - Downgrades user to free tier
- `invoice.payment_failed` - Handles failed payments

**Success Response (200):**
```json
{ "received": true }
```

**Error Responses:**

- **400 Bad Request**
  ```json
  { "error": "Invalid signature" }
  ```

- **500 Server Error**
  ```json
  { "error": "Webhook handler failed" }
  ```

**Implementation Notes:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS
- Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- Updates both `users` and `payments` tables
- Logs webhook events for debugging

**Setup:**
1. Local testing: Use Stripe CLI listener
2. Production: Configure webhook in Stripe Dashboard

---

### 4. GET `/api/google/connect`

OAuth callback for Google Ads authentication.

**Authentication**: None (public OAuth callback)

**Query Parameters:**
```
?code=<oauth_code>
```

**Success**: Redirects to `/dashboard` with token stored

**Error**: Returns error message

**Implementation Status:** 🚧 **Incomplete** - Requires Meta App approval and business verification

---

### 5. POST `/api/meta/import-ads`

Import ads from connected Meta account (partially implemented).

**Authentication**: Required

**Success Response (200):**
```json
{
  "success": true,
  "imported": 15,
  "total": 15,
  "ads": [...]
}
```

**Implementation Status:** 🚧 **Incomplete** - Meta OAuth must be completed first

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Error message",
  "details": "Optional additional details"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions/tier)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

**Current Status:** ⚠️ Not implemented

**Recommended:**
- 100 requests per minute per user
- Use Redis or Upstash for tracking
- Return `429 Too Many Requests` when exceeded

---

## Data Models

### Creative
```typescript
interface Creative {
  id: string;
  user_id: string;
  brand_name: string | null;
  ad_copy: string | null;
  ad_image_url: string | null;
  cta: string | null;
  source_type: 'own' | 'competitor';
  created_at: string;
}
```

### Analysis
```typescript
interface Analysis {
  id: string;
  creative_id: string;
  user_id: string;
  analysis_result: {
    headline?: string;
    headline_length?: number;
    emotion?: string;
    copy_tone?: string;
    primary_color?: string;
    visual_elements?: string[];
    performance_driver?: string;
    recommendations?: string[];
  };
  created_at: string;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  payment_status: 'free' | 'paid';
  analysis_count: number;
  stripe_customer_id: string | null;
  created_at: string;
}
```

---

## Testing API Endpoints

### Using curl

**Analyze endpoint:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "creative_id": "123e4567-e89b-12d3-a456-426614174000",
    "ad_copy": "Get 50% off today!",
    "cta": "Shop Now"
  }'
```

**Checkout endpoint:**
```bash
curl -X POST http://localhost:3000/api/stripe/checkout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using JavaScript (Next.js client)

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify({
    creative_id: creativeId,
    image_url: imageUrl,
    ad_copy: adCopy,
    cta: cta,
  }),
});

const data = await response.json();
```

---

## Future Enhancements

- [ ] Add rate limiting
- [ ] Add request/response logging
- [ ] Add API versioning (v1, v2)
- [ ] Add batch analysis endpoint
- [ ] Add webhook retry logic
- [ ] Complete Meta API integration
- [ ] Add admin API endpoints
- [ ] Add analytics/metrics endpoint

---

For more details, see:
- [Architecture Documentation](./ARCHITECTURE.md)
- [Meta OAuth Setup Guide](./META_OAUTH_SETUP.md)
- [Contributing Guide](../CONTRIBUTING.md)
