# Data Flow Analysis - Ad Intelligence App

A beginner-friendly guide to understanding how data moves through this application.

---

## Quick Overview

This is a **Next.js SaaS app** that helps marketers analyze their ads using AI. Here's the tech stack:

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 15 + React | User interface |
| Backend | Next.js API Routes | Server-side logic |
| Database | Supabase (PostgreSQL) | Data storage |
| Auth | Supabase Auth | User login/signup |
| Payments | Stripe | Subscriptions ($29/mo) |
| External API | Google Ads API | Import ads |
| AI | OpenAI / Mock | Ad analysis |

---

## 1. What Happens When a User First Loads the App?

### Step-by-Step Flow

```
Browser → app/layout.tsx → app/page.tsx → User sees landing page
```

**Detailed breakdown:**

1. **Browser requests the URL** (e.g., `https://yourapp.vercel.app`)

2. **Next.js serves `app/layout.tsx`** (line 1-25)
   - Sets up HTML structure, fonts, metadata
   - Wraps all pages with common layout

3. **Landing page renders `app/page.tsx`**
   - Static page (no database calls!)
   - Shows hero section, features, CTAs
   - Two buttons: "Login" → `/auth/login`, "Get Started" → `/auth/signup`

4. **No authentication check on landing page**
   - Anyone can view it
   - Fast load time because no API calls

### When User Goes to Dashboard (Protected Route)

```
/dashboard → Check auth → Fetch user data → Fetch creatives → Render
```

**File:** `app/dashboard/page.tsx`

```typescript
// Line 19-24: First thing that runs when page loads
useEffect(() => {
  checkUser();   // Are they logged in?
  fetchData();   // Get their data
}, []);
```

**checkUser() does this:**
1. Calls `supabase.auth.getUser()` - checks JWT token in browser cookies
2. If no valid session → redirect to `/auth/login`
3. If valid → fetch user profile from `users` table

**fetchData() does this:**
1. Gets all user's creatives from `creatives` table
2. Gets all analyses from `analysis` table
3. Sets state to render the dashboard

---

## 2. Main Action: Analyzing an Ad Creative

This is the **core feature** - tracing a button click through the entire system.

### The Complete Flow

```
UI Click → API Route → Check Limits → Run AI → Save to Database → Return to UI
```

### Step 1: User Clicks "Analyze Now"

**File:** `app/dashboard/analyze/[id]/page.tsx` (line 62)

```typescript
async function handleAnalyze() {
  // Get user's auth token
  const { data: { session } } = await supabase.auth.getSession();

  // Call our API with the token
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,  // IMPORTANT!
    },
    body: JSON.stringify({
      creative_id: creative.id,
      image_url: creative.ad_image_url,
      ad_copy: creative.ad_copy,
    }),
  });
}
```

**What's happening:**
- Gets the JWT token from Supabase (proves who the user is)
- Sends it to our API in the `Authorization` header
- Sends the ad data in the request body

### Step 2: API Route Processes Request

**File:** `app/api/analyze/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. Get token from header
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  // 2. Verify the token is real
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // 3. Get user's payment status from database
  const { data: userData } = await supabase
    .from('users')
    .select('payment_status, analysis_count')
    .eq('id', user.id)
    .single();

  // 4. Check freemium limit (5 free analyses)
  if (userData.payment_status === 'free' && userData.analysis_count >= 5) {
    return Response.json({ requiresUpgrade: true }, { status: 403 });
  }

  // 5. Run AI analysis
  const analysisResult = await analyzeCreative(image_url, ad_copy, cta);

  // 6. Save to database
  await supabase.from('analysis').insert({
    creative_id,
    analysis_result: analysisResult,
  });

  // 7. Increment counter
  await supabase
    .from('users')
    .update({ analysis_count: userData.analysis_count + 1 })
    .eq('id', user.id);

  // 8. Return result
  return Response.json({ analysis: analysisResult });
}
```

### Step 3: AI Analysis Runs

**Free users:** `lib/ai/analyze.ts` (mock AI)
```typescript
// Simulates AI analysis with pattern matching
const analysis = {
  headline: extractFirstSentence(adCopy),
  emotion: detectEmotion(adCopy),  // urgency, trust, excitement...
  recommendations: generateTips(),
};
```

**Paid users:** `lib/ai/openai-analyze.ts` (real AI)
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: prompt }],
});
```

### Step 4: Data Returns to UI

```typescript
// Back in the frontend
const data = await response.json();
setAnalysis(data.analysis);  // Updates React state

// Component re-renders with analysis results
<div>Emotion: {analysis.emotion}</div>
<div>Recommendations: {analysis.recommendations.map(...)}</div>
```

### Database Operations in This Flow

| Order | Table | Operation | What |
|-------|-------|-----------|------|
| 1 | users | SELECT | Get payment_status, analysis_count |
| 2 | analysis | INSERT | Save the analysis result |
| 3 | users | UPDATE | Increment analysis_count |

---

## 3. Authentication Flow

### Where It Happens

| Action | File | Function |
|--------|------|----------|
| Signup | `app/auth/signup/page.tsx` | `handleSignup()` |
| Login | `app/auth/login/page.tsx` | `handleLogin()` |
| Logout | `app/dashboard/page.tsx` | `handleLogout()` |
| Token verify | Every API route | Token extraction |

### Signup Flow

```typescript
// app/auth/signup/page.tsx (line 17)
const { data, error } = await supabase.auth.signUp({
  email,
  password,
});
```

**What happens behind the scenes:**

1. Supabase creates record in `auth.users` (managed by Supabase)
2. Database trigger fires: `handle_new_user()`
3. Trigger creates matching record in `public.users` with:
   - `payment_status: 'free'`
   - `analysis_count: 0`
4. JWT token returned and stored in browser cookies
5. User redirected to `/dashboard`

### How API Routes Verify Users

Every protected API route does this:

```typescript
// 1. Get token from Authorization header
const authHeader = request.headers.get('Authorization');
const token = authHeader?.replace('Bearer ', '');

// 2. Create Supabase client WITH the token
const supabase = createClient(url, anonKey, {
  global: {
    headers: { Authorization: `Bearer ${token}` }
  }
});

// 3. Verify token is valid
const { data: { user } } = await supabase.auth.getUser(token);

// 4. Now all database queries respect Row-Level Security
// User can only see their own data!
```

### Row-Level Security (RLS)

The database has policies that check `auth.uid() = user_id`:

```sql
-- Users can only see their own creatives
CREATE POLICY "Users can view own creatives"
ON creatives FOR SELECT
USING (auth.uid() = user_id);
```

This means even if someone tries to query another user's data, the database blocks it.

---

## 4. Payment Processing Flow

### Where It Happens

| Step | File | Purpose |
|------|------|---------|
| Initiate checkout | `app/dashboard/page.tsx` | `handleUpgrade()` |
| Create session | `app/api/stripe/checkout/route.ts` | Create Stripe checkout |
| Handle completion | `app/api/stripe/webhook/route.ts` | Update user status |

### Complete Payment Flow

```
User clicks "Upgrade"
    → API creates Stripe checkout session
    → User redirected to Stripe
    → User pays on Stripe's page
    → Stripe sends webhook to our server
    → We update user to 'paid'
    → User redirected back with Pro access
```

### Step 1: User Clicks Upgrade

**File:** `app/dashboard/page.tsx` (line 82)

```typescript
const response = await fetch('/api/stripe/checkout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${session.access_token}` },
});
const { url } = await response.json();
window.location.href = url;  // Redirect to Stripe!
```

### Step 2: API Creates Checkout Session

**File:** `app/api/stripe/checkout/route.ts`

```typescript
// Create or get Stripe customer
let customerId = userData.stripe_customer_id;
if (!customerId) {
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { supabase_user_id: user.id }
  });
  customerId = customer.id;
  // Save to database
}

// Create checkout session
const session = await stripe.checkout.sessions.create({
  customer: customerId,
  line_items: [{
    price_data: {
      unit_amount: 2900,  // $29.00
      recurring: { interval: 'month' }
    }
  }],
  mode: 'subscription',
  success_url: `${appUrl}/dashboard?payment=success`,
  cancel_url: `${appUrl}/dashboard?payment=cancelled`,
});

return Response.json({ url: session.url });
```

### Step 3: Webhook Confirms Payment

**File:** `app/api/stripe/webhook/route.ts`

```typescript
// Stripe sends this when payment completes
export async function POST(request: Request) {
  // 1. Verify webhook signature (security!)
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

  // 2. Handle successful checkout
  if (event.type === 'checkout.session.completed') {
    const userId = event.data.object.metadata.supabase_user_id;

    // 3. Update user to paid (using service role - bypasses RLS)
    await supabase
      .from('users')
      .update({ payment_status: 'paid' })
      .eq('id', userId);
  }
}
```

**Important:** Webhooks use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) because:
- Webhook requests don't have user's JWT token
- Service role bypasses RLS to update any user's data
- This is the ONLY place we use service role key

---

## 5. Database Schema

### What's Stored and Why

#### Table: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,              -- Links to Supabase auth
  email TEXT,                       -- User's email
  payment_status TEXT DEFAULT 'free', -- 'free' or 'paid'
  analysis_count INTEGER DEFAULT 0,  -- Track free tier usage
  stripe_customer_id TEXT,          -- For payment processing
  google_refresh_token TEXT,        -- For Google Ads connection
  google_customer_id TEXT,          -- Google Ads account ID
);
```

**Why this data?**
- `payment_status`: Controls feature access (freemium model)
- `analysis_count`: Enforces 5 free analyses limit
- `stripe_customer_id`: Links to Stripe for billing
- `google_*` fields: OAuth tokens for Google Ads API

#### Table: `creatives`

```sql
CREATE TABLE creatives (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),  -- Owner
  source_type TEXT,                   -- 'own' or 'competitor'
  brand_name TEXT,
  ad_copy TEXT,                       -- The ad text
  ad_image_url TEXT,                  -- Link to ad image
  cta TEXT,                           -- Call-to-action
  performance JSONB,                  -- Metrics from Google Ads
);
```

**Why this data?**
- Stores ad creatives (either manually entered or imported from Google)
- `performance` is JSONB to flexibly store metrics like clicks, impressions, CTR

#### Table: `analysis`

```sql
CREATE TABLE analysis (
  id UUID PRIMARY KEY,
  creative_id UUID REFERENCES creatives(id),  -- Which ad was analyzed
  analysis_result JSONB,                       -- AI analysis output
);
```

**Why this data?**
- Stores AI analysis results
- Links back to the creative it analyzed
- JSONB allows flexible storage of analysis fields

#### Table: `payments`

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  stripe_session_id TEXT,         -- Stripe checkout session
  stripe_payment_intent TEXT,     -- Stripe payment record
  status TEXT,                    -- 'pending', 'succeeded', 'failed'
  amount INTEGER,                 -- Amount in cents
);
```

**Why this data?**
- Audit trail of all payment attempts
- Can look up payment status if issues arise
- Links Stripe records to our users

### Relationships

```
users (1) ──────< (M) creatives (1) ──────< (1) analysis
  │
  └──────< (M) payments
```

- One user has many creatives
- One creative has one analysis (optional)
- One user has many payments

---

## Key Patterns to Learn

### 1. JWT Token Authentication

Every API request includes the user's token:
```typescript
headers: { 'Authorization': `Bearer ${token}` }
```

### 2. Database-Level Security

RLS policies mean the database itself enforces permissions, not just your code.

### 3. Webhook Pattern for Async Events

Payment confirmation happens asynchronously via webhooks, not synchronously in the checkout flow.

### 4. Service Role vs Anon Key

- **Anon key**: Public, respects RLS, used by clients
- **Service role key**: Secret, bypasses RLS, only for webhooks/admin tasks

### 5. Freemium Enforcement

Check limits in the API route, not the frontend (can't trust the client!):
```typescript
if (userData.payment_status === 'free' && userData.analysis_count >= 5) {
  return Response.json({ requiresUpgrade: true }, { status: 403 });
}
```

---

## File Quick Reference

| Purpose | File Path |
|---------|-----------|
| Landing page | `app/page.tsx` |
| Dashboard | `app/dashboard/page.tsx` |
| Analysis page | `app/dashboard/analyze/[id]/page.tsx` |
| Import page | `app/dashboard/import/page.tsx` |
| Login | `app/auth/login/page.tsx` |
| Signup | `app/auth/signup/page.tsx` |
| Analyze API | `app/api/analyze/route.ts` |
| Checkout API | `app/api/stripe/checkout/route.ts` |
| Webhook API | `app/api/stripe/webhook/route.ts` |
| Google connect | `app/api/google/connect/route.ts` |
| Google import | `app/api/google/import-ads/route.ts` |
| Supabase client | `lib/supabase/client.ts` |
| Mock AI | `lib/ai/analyze.ts` |
| Real AI | `lib/ai/openai-analyze.ts` |
| Google client | `lib/google/client.ts` |
