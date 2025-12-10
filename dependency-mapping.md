# Dependency Mapping - Ad Intelligence App

A complete reference of every external service, library, API endpoint, and database table in this application.

---

## Table of Contents

1. [External Services](#1-external-services)
2. [Major NPM Libraries](#2-major-npm-libraries)
3. [Backend API Endpoints](#3-backend-api-endpoints)
4. [Database Tables & Relationships](#4-database-tables--relationships)
5. [Third-Party Integrations](#5-third-party-integrations)
6. [Environment Variables](#6-environment-variables)
7. [Failure Impact Analysis](#7-failure-impact-analysis)

---

## 1. External Services

### 1.1 Vercel (Hosting & Deployment)

**What it does:**
- Hosts the Next.js application
- Provides serverless functions for API routes
- Handles automatic deployments from Git
- Provides CDN for static assets
- SSL/HTTPS certificates

**Why it's needed:**
- Makes the app accessible on the internet
- Automatically scales API routes
- Zero-config deployments

**What breaks if it fails:**
- ❌ Entire app becomes unreachable
- ❌ No API routes work
- ❌ Users can't access the website
- **Severity:** CRITICAL - App completely down

**Alternative:** Could deploy to AWS, Railway, or self-hosted server

---

### 1.2 Supabase (Database + Authentication)

**Service URL:** `https://pxmhzjxsbcwqmoctkkhu.supabase.co`

**What it does:**
- PostgreSQL database hosting
- User authentication (signup/login/logout)
- Row-Level Security (RLS) enforcement
- Real-time subscriptions (not used currently)
- JWT token generation and validation
- Database triggers

**Why it's needed:**
- Stores all user data, creatives, analyses, payments
- Manages user sessions and authentication
- Enforces data access permissions at database level
- Eliminates need to build auth from scratch

**What breaks if it fails:**
- ❌ Login/signup impossible
- ❌ All database queries fail
- ❌ Can't store or retrieve any data
- ❌ Dashboard becomes empty
- ❌ Analysis feature completely broken
- **Severity:** CRITICAL - App becomes a static landing page

**Tables used:** `auth.users`, `public.users`, `public.creatives`, `public.analysis`, `public.payments`

**Alternative:** Could migrate to Firebase, AWS RDS + Cognito, or self-hosted PostgreSQL + custom auth

---

### 1.3 Stripe (Payment Processing)

**Account:** Test mode keys configured

**What it does:**
- Processes credit card payments
- Manages subscriptions ($29/month)
- Handles checkout sessions
- Sends webhooks for payment events
- Manages customer records
- Handles refunds and cancellations

**Why it's needed:**
- Enables the business model (freemium → Pro)
- Handles PCI compliance (we don't touch card data)
- Manages recurring billing automatically
- Sends payment confirmation webhooks

**What breaks if it fails:**
- ❌ Users can't upgrade to Pro
- ❌ No new subscriptions
- ❌ Existing subscriptions might not renew
- ✅ Free tier still works
- ✅ Existing Pro users retain access (until subscription expires)
- **Severity:** HIGH - Revenue stops, but core features work

**Webhooks required:**
- `checkout.session.completed` - Marks user as paid
- `customer.subscription.deleted` - Downgrades user to free
- `invoice.payment_failed` - Notifies of payment issues

**Alternative:** Could use PayPal, Paddle, or Lemon Squeezy

---

### 1.4 OpenAI API (AI Analysis - Paid Users)

**Model:** GPT-3.5-turbo

**What it does:**
- Analyzes ad copy and images (paid users only)
- Generates insights and recommendations
- Detects emotional tone and marketing effectiveness
- Returns structured JSON analysis

**Why it's needed:**
- Provides real AI value for paying customers
- Differentiates Pro tier from free tier
- Generates professional marketing insights

**What breaks if it fails:**
- ❌ Paid users get analysis errors
- ✅ Free users unaffected (use mock AI)
- ❌ Pro value proposition weakens
- ✅ Could fallback to mock AI temporarily
- **Severity:** MEDIUM - Paid feature broken, but app functional

**Cost:** ~$0.002 per analysis (99%+ profit margin maintained)

**Fallback:** Falls back to mock AI if API key missing or quota exceeded

**Alternative:** Claude API, Google Gemini, or fine-tuned open-source models

---

### 1.5 Google Ads API (Ad Import)

**API Version:** v17

**What it does:**
- OAuth 2.0 authentication with user's Google account
- Fetches ad campaigns, ad groups, and ads
- Retrieves performance metrics (impressions, clicks, CTR, CPC)
- Lists accessible customer accounts

**Why it's needed:**
- Allows users to import their existing ads
- Saves manual data entry
- Provides real performance data for analysis
- Core value proposition feature

**What breaks if it fails:**
- ❌ Can't import ads from Google
- ✅ Manual ad entry still works
- ✅ Previously imported ads remain accessible
- ❌ Performance metrics can't be updated
- **Severity:** MEDIUM - Major feature broken, but workarounds exist

**Requirements:**
- Developer token (approved by Google)
- OAuth client ID and secret
- User's refresh token (stored in database)

**Alternative:** Manual CSV import, or integrate Meta Ads, TikTok Ads instead

---

## 2. Major NPM Libraries

### 2.1 Framework & Core

| Package | Version | Purpose | Why Needed | If It Breaks |
|---------|---------|---------|------------|--------------|
| **next** | 15.0.0 | React framework, routing, SSR | Core framework for entire app | ❌ App won't build or run |
| **react** | 18.3.1 | UI library | Powers all components | ❌ Nothing renders |
| **react-dom** | 18.3.1 | React rendering to DOM | Connects React to browser | ❌ Nothing renders |
| **typescript** | 5.6.2 | Type safety | Catches errors at compile time | ⚠️ More runtime bugs |

---

### 2.2 Supabase & Database

| Package | Version | Purpose | What It Does |
|---------|---------|---------|--------------|
| **@supabase/supabase-js** | 2.45.0 | Supabase client | Main client for auth + DB queries |
| **@supabase/ssr** | 0.7.0 | Server-side rendering | Handles cookies for auth in API routes |
| **@supabase/auth-helpers-nextjs** | 0.10.0 | Next.js helpers | Simplifies auth in Next.js |

**If these break:** ❌ No database access, no authentication, app becomes static

---

### 2.3 Payment Processing

| Package | Version | Purpose | What It Does |
|---------|---------|---------|--------------|
| **stripe** | 16.12.0 | Stripe API client | Creates checkouts, handles webhooks, manages subscriptions |

**If this breaks:** ❌ Can't process payments, ✅ free tier still works

---

### 2.4 External APIs

| Package | Version | Purpose | What It Does |
|---------|---------|---------|--------------|
| **openai** | 6.6.0 | OpenAI API client | Calls GPT-3.5 for ad analysis (paid users) |
| **google-ads-api** | 14.2.0 | Google Ads API client | Fetches ads and performance data |
| **google-auth-library** | 9.15.1 | Google OAuth | Handles OAuth token exchange and refresh |
| **axios** | 1.7.7 | HTTP client | Makes HTTP requests (used by Google client) |

**If these break:**
- OpenAI: ❌ Paid users can't analyze ads
- Google Ads: ❌ Can't import ads from Google
- axios: ❌ Google API calls fail

---

### 2.5 UI & Styling

| Package | Version | Purpose | What It Does |
|---------|---------|---------|--------------|
| **tailwindcss** | 3.4.12 | CSS framework | All styling in the app |
| **lucide-react** | 0.441.0 | Icon library | All icons (Search, ChevronRight, etc.) |
| **recharts** | 2.12.7 | Chart library | Performance charts (not heavily used) |
| **clsx** | 2.1.1 | Conditional CSS classes | Merges className strings |

**If these break:**
- Tailwind: ❌ App looks broken (no styles)
- Lucide: ⚠️ Missing icons, but functional
- Recharts: ⚠️ Charts don't render
- clsx: ⚠️ Some dynamic styles broken

---

### 2.6 Development Tools (Not in Production)

| Package | Version | Purpose | When Used |
|---------|---------|---------|-----------|
| **vitest** | 4.0.6 | Unit testing | Development & CI |
| **@playwright/test** | 1.56.1 | E2E testing | Testing user flows |
| **eslint** | 8.57.1 | Code linting | Development |
| **prettier** | 3.6.2 | Code formatting | Development |

**If these break:** ⚠️ Development experience suffers, but production unaffected

---

## 3. Backend API Endpoints

All API routes are in `app/api/` directory.

### 3.1 Analysis

#### POST `/api/analyze`

**File:** `app/api/analyze/route.ts`

**Purpose:** Analyze an ad creative with AI

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "creative_id": "uuid",
  "image_url": "https://...",
  "ad_copy": "Your ad text...",
  "cta": "Shop Now"
}
```

**What it does:**
1. Verifies JWT token
2. Gets user's payment status from database
3. Checks freemium limit (5 analyses for free users)
4. Runs AI analysis (mock for free, OpenAI for paid)
5. Saves analysis to database
6. Increments user's analysis count
7. Returns analysis result

**Response:**
```json
{
  "analysis": {
    "id": "uuid",
    "creative_id": "uuid",
    "analysis_result": { /* AI insights */ }
  },
  "remaining_analyses": 4
}
```

**Error responses:**
- 401: Unauthorized (invalid token)
- 403: Analysis limit reached (requires upgrade)
- 500: Internal error

**Database operations:**
- SELECT from `users` (payment status)
- INSERT into `analysis`
- UPDATE `users` (increment counter)

**What breaks if this endpoint fails:**
- ❌ Core feature completely broken
- ❌ Users can't analyze any ads
- **Severity:** CRITICAL

---

### 3.2 Payment - Checkout

#### POST `/api/stripe/checkout`

**File:** `app/api/stripe/checkout/route.ts`

**Purpose:** Create Stripe checkout session for Pro upgrade

**Authentication:** Required (JWT token)

**Request Body:** None

**What it does:**
1. Verifies JWT token
2. Gets or creates Stripe customer ID
3. Creates checkout session ($29/month subscription)
4. Records payment as 'pending' in database
5. Returns checkout URL

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/pay/..."
}
```

**Database operations:**
- SELECT from `users` (get Stripe customer ID)
- UPDATE `users` (store new customer ID)
- INSERT into `payments` (record as pending)

**What breaks if this endpoint fails:**
- ❌ Users can't upgrade to Pro
- ❌ No revenue
- ✅ Existing Pro users unaffected
- **Severity:** HIGH (revenue impact)

---

### 3.3 Payment - Webhook

#### POST `/api/stripe/webhook`

**File:** `app/api/stripe/webhook/route.ts`

**Purpose:** Handle Stripe webhook events

**Authentication:** Webhook signature verification

**Events handled:**
- `checkout.session.completed` - Payment successful
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_failed` - Payment failed

**What it does for `checkout.session.completed`:**
1. Verifies webhook signature (security)
2. Extracts user ID from metadata
3. Updates user's `payment_status` to 'paid'
4. Updates payment record to 'succeeded'

**Special note:** Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)

**Database operations:**
- UPDATE `users` (set payment_status = 'paid')
- UPDATE `payments` (set status = 'succeeded')

**What breaks if this endpoint fails:**
- ❌ Users pay but don't get upgraded
- ❌ Manual intervention required
- ❌ Customer support nightmare
- **Severity:** CRITICAL (payment confirmation)

---

### 3.4 Google Ads - Connect

#### GET `/api/google/connect?code=...`

**File:** `app/api/google/connect/route.ts`

**Purpose:** OAuth callback - exchange code for tokens

**Authentication:** Session cookie

**Query Parameters:**
- `code`: OAuth authorization code from Google
- `error`: OAuth error (if user denied)

**What it does:**
1. Exchanges authorization code for tokens
2. Gets user's session from cookies
3. Fetches accessible Google Ads customer accounts
4. Stores refresh token, access token, customer ID in database
5. Redirects to dashboard with success message

**Response:** HTTP redirect to `/dashboard?google_connected=true`

**Database operations:**
- UPDATE `users` (store Google credentials)

**What breaks if this endpoint fails:**
- ❌ Can't connect Google Ads account
- ❌ Can't import ads
- ✅ Manual ad entry still works
- **Severity:** HIGH (major feature)

---

### 3.5 Google Ads - Import

#### POST `/api/google/import-ads`

**File:** `app/api/google/import-ads/route.ts`

**Purpose:** Import ads from Google Ads account

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "campaignStatus": "ENABLED",
  "dateRangeStart": "2024-01-01",
  "dateRangeEnd": "2024-12-31"
}
```

**What it does:**
1. Verifies JWT token
2. Gets user's Google credentials from database
3. Checks if Google account is connected
4. Initializes Google Ads API client
5. Fetches ads with GAQL query (Google Ads Query Language)
6. Maps Google ad format to our creative format
7. Upserts creatives to database (update if exists, insert if new)
8. Returns import summary

**Response:**
```json
{
  "success": true,
  "totalAds": 100,
  "importedAds": 45,
  "updatedAds": 25,
  "skippedAds": 30,
  "errors": []
}
```

**Database operations:**
- SELECT from `users` (get Google credentials)
- SELECT from `creatives` (check if ad exists)
- INSERT or UPDATE `creatives` (upsert ads)

**What breaks if this endpoint fails:**
- ❌ Can't import ads from Google
- ✅ Manual import still works
- ✅ Previously imported ads still accessible
- **Severity:** MEDIUM

---

### 3.6 Google Ads - Disconnect

#### POST `/api/google/disconnect`

**File:** `app/api/google/disconnect/route.ts`

**Purpose:** Remove Google Ads connection

**Authentication:** Required (JWT token)

**What it does:**
1. Verifies JWT token
2. Clears all Google-related fields in user record
3. Returns success message

**Response:**
```json
{
  "success": true,
  "message": "Google Ads account disconnected successfully"
}
```

**Database operations:**
- UPDATE `users` (clear Google fields)

**What breaks if this endpoint fails:**
- ⚠️ User can't disconnect (minor issue)
- ⚠️ Could manually clear in database
- **Severity:** LOW

---

## 4. Database Tables & Relationships

### 4.1 Schema Overview

```
auth.users (Supabase managed)
    ↓ 1:1
public.users (our profile extension)
    ├─ 1:M → creatives
    │         ├─ 1:1 → analysis
    │         └─ (ad_id links to Google Ads)
    │
    └─ 1:M → payments
```

---

### 4.2 Table: `auth.users`

**Managed by:** Supabase Auth service

**Purpose:** Core authentication

**Key fields:**
- `id` (UUID, PK) - User's unique identifier
- `email` (TEXT) - Email address
- `encrypted_password` (TEXT) - Hashed password
- `email_confirmed_at` (TIMESTAMP) - When email verified

**Created by:** `supabase.auth.signUp()`

**Why it exists:** Required for authentication

**What breaks if it fails:** ❌ No login/signup possible

---

### 4.3 Table: `public.users`

**File:** `lib/supabase/schema.sql` (lines 5-19)

**Purpose:** User profile and subscription data

**Schema:**
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,

  -- Stripe integration
  stripe_customer_id TEXT,
  payment_status TEXT DEFAULT 'free' CHECK (payment_status IN ('free', 'paid')),
  analysis_count INTEGER DEFAULT 0,

  -- Google Ads integration
  google_refresh_token TEXT,
  google_access_token TEXT,
  google_token_expires_at TIMESTAMP WITH TIME ZONE,
  google_customer_id TEXT,
  google_account_name TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Key fields explained:**

| Field | Type | Purpose | Why Needed |
|-------|------|---------|------------|
| `id` | UUID | Links to auth.users | Foreign key relationship |
| `email` | TEXT | User's email | Display, contact |
| `stripe_customer_id` | TEXT | Stripe customer ID | Link to Stripe account |
| `payment_status` | TEXT | 'free' or 'paid' | Enforce freemium limits |
| `analysis_count` | INTEGER | # of analyses used | Track free tier usage |
| `google_refresh_token` | TEXT | OAuth refresh token | Refresh Google access |
| `google_access_token` | TEXT | OAuth access token | Call Google Ads API |
| `google_token_expires_at` | TIMESTAMP | Token expiry time | Know when to refresh |
| `google_customer_id` | TEXT | Google Ads account ID | Which account to query |
| `google_account_name` | TEXT | Account display name | Show user which account |

**Row-Level Security (RLS):**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON public.users FOR SELECT
  USING (auth.uid() = id);
```

**Triggers:**
- `on_auth_user_created` - Auto-creates profile when user signs up
- `on_users_updated` - Auto-updates `updated_at` timestamp

**Indexes:**
- `idx_users_google_customer_id` - Fast lookup by Google account

**What breaks if it fails:**
- ❌ Can't track payment status
- ❌ Freemium limits don't work
- ❌ Google Ads integration broken
- **Severity:** CRITICAL

---

### 4.4 Table: `public.creatives`

**File:** `lib/supabase/schema.sql` (lines 38-49)

**Purpose:** Store ad creatives (ads to be analyzed)

**Schema:**
```sql
CREATE TABLE public.creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('own', 'competitor')),
  brand_name TEXT,
  ad_id TEXT,  -- Google Ads ID
  ad_image_url TEXT,
  ad_copy TEXT,
  cta TEXT,  -- Call-to-action
  performance JSONB DEFAULT '{}',  -- Metrics from Google
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Key fields explained:**

| Field | Type | Purpose | Example Value |
|-------|------|---------|---------------|
| `id` | UUID | Unique creative ID | `550e8400-e29b-41d4-a716-446655440000` |
| `user_id` | UUID | Who owns this creative | Links to users.id |
| `source_type` | TEXT | 'own' or 'competitor' | `'own'` |
| `brand_name` | TEXT | Brand/campaign name | `'Summer Sale Campaign'` |
| `ad_id` | TEXT | Google Ads ID | `'12345678901234567'` |
| `ad_image_url` | TEXT | Image URL | `'https://example.com/ad.jpg'` |
| `ad_copy` | TEXT | Ad headline/body | `'Save 50% on all items!'` |
| `cta` | TEXT | Call-to-action | `'Shop Now'` |
| `performance` | JSONB | Performance metrics | `{"impressions": 1000, "clicks": 50}` |

**Performance JSONB structure:**
```typescript
{
  impressions?: number;    // How many times shown
  clicks?: number;         // How many clicks
  ctr?: number;           // Click-through rate (%)
  cpc?: number;           // Cost per click ($)
  spend?: number;         // Total spend ($)
  conversions?: number;   // Number of conversions
}
```

**RLS Policies:**
```sql
-- Users can only see their own creatives
CREATE POLICY "Users can view own creatives"
  ON public.creatives FOR SELECT
  USING (auth.uid() = user_id);
```

**Indexes:**
- `creatives_user_id_idx` - Fast lookup by user
- `creatives_source_type_idx` - Filter by source type

**What breaks if it fails:**
- ❌ Can't store ads
- ❌ Dashboard is empty
- ❌ Nothing to analyze
- **Severity:** CRITICAL

---

### 4.5 Table: `public.analysis`

**File:** `lib/supabase/schema.sql` (lines 68-73)

**Purpose:** Store AI analysis results

**Schema:**
```sql
CREATE TABLE public.analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID REFERENCES public.creatives(id) ON DELETE CASCADE NOT NULL,
  analysis_result JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Key fields explained:**

| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Unique analysis ID |
| `creative_id` | UUID | Which ad was analyzed |
| `analysis_result` | JSONB | AI insights |
| `created_at` | TIMESTAMP | When analyzed |

**Analysis Result JSONB structure:**
```typescript
{
  headline?: string;              // Detected headline
  headline_length?: 'short' | 'medium' | 'long';
  primary_color?: string;         // Dominant color
  emotion?: string;               // excitement, urgency, trust...
  cta?: string;                   // Call-to-action
  visual_elements?: string[];     // ['product image', 'price tag']
  copy_tone?: string;             // urgent, promotional...
  performance_driver?: string;    // "Clear value proposition"
  recommendations?: string[];     // ["Add social proof", ...]
}
```

**RLS Policy:**
```sql
-- Users can only see analyses of their own creatives
CREATE POLICY "Users can view own analysis"
  ON public.analysis FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.creatives WHERE id = analysis.creative_id
    )
  );
```

**Indexes:**
- `analysis_creative_id_idx` - Fast lookup by creative

**Relationship:** One creative can have one analysis (currently)

**What breaks if it fails:**
- ❌ Can't save analysis results
- ❌ Analysis feature useless
- **Severity:** CRITICAL

---

### 4.6 Table: `public.payments`

**File:** `lib/supabase/schema.sql` (lines 96-105)

**Purpose:** Audit trail of all payment attempts

**Schema:**
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  amount INTEGER,  -- In cents
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Key fields explained:**

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `id` | UUID | Unique payment ID | Auto-generated |
| `user_id` | UUID | Who made payment | Links to users.id |
| `stripe_session_id` | TEXT | Stripe checkout session | `'cs_test_abc123...'` |
| `stripe_payment_intent` | TEXT | Stripe payment ID | `'pi_abc123...'` |
| `status` | TEXT | Payment status | `'pending'`, `'succeeded'`, `'failed'` |
| `amount` | INTEGER | Amount in cents | `2900` ($29.00) |
| `currency` | TEXT | Currency code | `'usd'` |

**Status lifecycle:**
1. `pending` - Checkout session created
2. `succeeded` - Webhook confirms payment
3. `failed` - Payment declined

**RLS Policy:**
```sql
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);
```

**Indexes:**
- `payments_user_id_idx` - Fast lookup by user
- `payments_stripe_session_id_idx` - Fast lookup by session

**Why it exists:**
- Audit trail for accounting
- Troubleshooting payment issues
- Refund tracking
- Customer support

**What breaks if it fails:**
- ⚠️ Payments still work (stored in Stripe)
- ⚠️ Lose audit trail
- ⚠️ Harder to debug payment issues
- **Severity:** LOW (nice to have)

---

## 5. Third-Party Integrations

### 5.1 Integration Summary Table

| Integration | Type | Direction | Frequency | Purpose |
|-------------|------|-----------|-----------|---------|
| **Supabase Auth** | REST API | Bidirectional | Every request | Authentication |
| **Supabase DB** | PostgreSQL | Bidirectional | Every request | Data storage |
| **Stripe Checkout** | REST API | Outbound | On upgrade | Create checkout |
| **Stripe Webhooks** | HTTP POST | Inbound | On payment event | Payment confirmation |
| **OpenAI API** | REST API | Outbound | Per analysis (paid) | AI analysis |
| **Google OAuth** | OAuth 2.0 | Bidirectional | On connect | Authorization |
| **Google Ads API** | REST API | Outbound | On import | Fetch ads |

---

### 5.2 Supabase Integration

**Endpoints used:**
- `POST /auth/v1/signup` - Create account
- `POST /auth/v1/token?grant_type=password` - Login
- `POST /auth/v1/logout` - Logout
- `GET /auth/v1/user` - Get current user
- `POST /rest/v1/users` - Query users table
- `POST /rest/v1/creatives` - Query creatives table
- `POST /rest/v1/analysis` - Query analysis table
- `POST /rest/v1/payments` - Query payments table

**Authentication:**
- Client: Uses anon key + user's JWT token
- Server API routes: Uses anon key + forwarded JWT token
- Webhooks: Uses service role key (bypasses RLS)

**Rate limits:** 500 req/sec on free tier, higher on paid

---

### 5.3 Stripe Integration

**Endpoints used:**
- `POST /v1/customers` - Create customer
- `POST /v1/checkout/sessions` - Create checkout
- `POST /v1/webhooks` - Receive webhooks (inbound)

**Webhook events:**
```
checkout.session.completed    → User paid, upgrade to Pro
customer.subscription.deleted → User cancelled, downgrade to free
invoice.payment_failed       → Payment failed, notify user
```

**Webhook URL:** `https://yourapp.vercel.app/api/stripe/webhook`

**Security:** Webhook signature verification prevents spoofing

**Test vs Production:**
- Currently using test keys: `sk_test_...`
- Need to switch to live keys: `sk_live_...`

---

### 5.4 OpenAI Integration

**Endpoint used:**
- `POST /v1/chat/completions` - GPT-3.5-turbo

**Request format:**
```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a marketing expert..."},
    {"role": "user", "content": "Analyze this ad: ..."}
  ],
  "response_format": {"type": "json_object"},
  "max_tokens": 1000,
  "temperature": 0.7
}
```

**Rate limits:**
- 3,500 requests/min
- 90,000 tokens/min

**Cost:** ~$0.002 per analysis

**Fallback:** Uses mock AI if API key missing or quota exceeded

---

### 5.5 Google Ads Integration

**OAuth flow:**
```
1. User clicks "Connect Google Ads"
2. Redirect to Google OAuth consent screen
3. User grants permission
4. Google redirects back with authorization code
5. Exchange code for refresh token + access token
6. Store tokens in database
7. Fetch accessible customer accounts
8. Store customer ID in database
```

**API endpoint used:**
- `GET /oauth2/v4/token` - Exchange code for tokens
- `POST /v17/customers/{customerId}/googleAds:search` - Query ads

**GAQL Query used:**
```sql
SELECT
  ad_group_ad.ad.id,
  ad_group_ad.ad.name,
  ad_group_ad.ad.responsive_search_ad.headlines,
  ad_group_ad.ad.responsive_search_ad.descriptions,
  campaign.name,
  metrics.impressions,
  metrics.clicks,
  metrics.ctr,
  metrics.cost_micros,
  metrics.conversions
FROM ad_group_ad
WHERE ad_group_ad.status = 'ENABLED'
  AND campaign.status = 'ENABLED'
LIMIT 100
```

**Token refresh:**
- Access token expires in 1 hour
- Automatically refreshed using refresh token
- Refresh token never expires (until user revokes)

**Rate limits:**
- 15,000 operations/day (free developer token)
- Can apply for higher limits

---

## 6. Environment Variables

### 6.1 Required Variables

**File:** `.env.local`

| Variable | Type | Purpose | Example |
|----------|------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key (RLS enforced) | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Service role key (bypasses RLS) | `eyJhbGc...` |
| `STRIPE_SECRET_KEY` | Secret | Stripe API key | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Secret | Webhook signature secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Public | App base URL | `https://app.vercel.app` |
| `GOOGLE_ADS_CLIENT_ID` | Secret | OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_ADS_CLIENT_SECRET` | Secret | OAuth client secret | `GOCSPX-...` |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Secret | Google Ads API token | `xxx-xxx-xxx` |
| `NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID` | Public | OAuth client ID (frontend) | Same as above |
| `OPENAI_API_KEY` | Secret | OpenAI API key | `sk-...` |

### 6.2 Variable Types

**Public (`NEXT_PUBLIC_*`):**
- Embedded in frontend JavaScript
- Visible in browser DevTools
- Safe for anon keys and public IDs
- ✅ OK: Supabase anon key, OAuth client ID
- ❌ NEVER: API secrets, service role keys

**Secret:**
- Only accessible server-side (API routes)
- Never sent to client
- ✅ OK: Stripe secret, service role key, API secrets

---

## 7. Failure Impact Analysis

### 7.1 Catastrophic Failures (App Down)

| Service | Affected Features | Workaround | Recovery Time |
|---------|------------------|------------|---------------|
| **Vercel** | Everything | None | Minutes (check status page) |
| **Supabase** | Auth + all data | None | Minutes (check status page) |
| **Stripe Webhook** | Payment confirmation | Manual upgrade in DB | Manual intervention |

---

### 7.2 Major Feature Failures

| Service | Affected Features | Still Works | Workaround |
|---------|------------------|-------------|------------|
| **Stripe API** | New upgrades | Free tier, existing Pro | Wait or manual process |
| **OpenAI API** | Paid analysis | Free tier (mock AI) | Fallback to mock AI |
| **Google Ads API** | Ad import | Manual entry | CSV import |

---

### 7.3 Minor Failures (Degraded Experience)

| Service | Impact | Severity |
|---------|--------|----------|
| **Recharts** | Charts don't render | Low |
| **Lucide Icons** | Missing icons | Low |
| **Tailwind CSS** | Unstyled UI | Medium |

---

### 7.4 Dependency Health Monitoring

**To monitor in production:**

1. **Vercel:** Check deploy status, function logs
2. **Supabase:** Monitor connection pool, query performance
3. **Stripe:** Check webhook delivery in dashboard
4. **OpenAI:** Track API quota and errors
5. **Google Ads:** Monitor token expiration and refresh errors

**Recommended tools:**
- Sentry (error tracking)
- LogRocket (session replay)
- Vercel Analytics (performance)
- Uptime monitoring (UptimeRobot, Pingdom)

---

## Summary

**Critical dependencies (app breaks):**
1. Vercel (hosting)
2. Supabase (auth + database)
3. Next.js (framework)
4. React (UI library)

**High-impact dependencies (major features break):**
1. Stripe (payments)
2. OpenAI (paid AI analysis)
3. Google Ads API (ad import)

**Low-impact dependencies (degraded experience):**
1. UI libraries (Tailwind, Lucide, Recharts)
2. Development tools (ESLint, Prettier, Vitest)

**Mitigation strategies:**
- Graceful degradation (fallback to mock AI)
- Error boundaries (catch React errors)
- Retry logic (transient failures)
- Status monitoring (detect outages)
- Backup plans (manual processes)
