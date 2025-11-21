# Architecture Documentation

This document provides a high-level overview of the Ad Intelligence application architecture, design decisions, and data flow.

## System Overview

Ad Intelligence is a full-stack SaaS application that allows marketers to analyze ad creatives using AI-powered insights. The platform operates on a freemium model with Stripe-powered payments.

### Core Features
- User authentication and account management
- Manual ad creative import
- AI-powered ad analysis (emotional tone, copy analysis, recommendations)
- Freemium tier with upgrade capability
- Stripe payment integration with webhooks
- Competitor ad search (Meta Ad Library integration - in progress)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: TailwindCSS 3.4
- **UI Components**: Lucide React icons
- **Charts**: Recharts
- **State Management**: React hooks + Supabase client

### Backend
- **Runtime**: Node.js 20
- **API**: Next.js API Routes (App Router)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4 (currently mocked)
- **Payments**: Stripe (test mode)

### Infrastructure
- **Hosting**: Vercel (auto-deployment from GitHub)
- **Database**: Supabase (managed PostgreSQL)
- **File Storage**: Supabase Storage (for future use)
- **Version Control**: GitHub

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Next.js App (React)                        │  │
│  │                                                        │  │
│  │  Pages:                                               │  │
│  │  • / (Landing)                                        │  │
│  │  • /auth/* (Login/Signup)                            │  │
│  │  • /dashboard (Protected)                            │  │
│  │    - /import (Manual ad import)                      │  │
│  │    - /competitor (Meta search)                       │  │
│  │    - /analyze/[id] (AI analysis)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    NEXT.JS API ROUTES                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/analyze          - AI analysis                  │  │
│  │  /api/stripe/checkout  - Create payment session       │  │
│  │  /api/stripe/webhook   - Handle Stripe events         │  │
│  │  /api/meta/connect     - OAuth callback               │  │
│  │  /api/meta/import-ads  - Import user ads              │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────┬──────────────────────┬──────────────────┬─────┘
              │                      │                  │
              │                      │                  │
    ┌─────────▼─────────┐  ┌─────────▼────────┐  ┌────▼─────┐
    │   SUPABASE        │  │     STRIPE        │  │  OpenAI  │
    │   (PostgreSQL)    │  │   (Payments)      │  │  (AI)    │
    │                   │  │                   │  │          │
    │  • auth.users     │  │  • Customers      │  │  • GPT-4 │
    │  • public.users   │  │  • Subscriptions  │  │          │
    │  • creatives      │  │  • Invoices       │  │          │
    │  • analysis       │  │  • Webhooks       │  │          │
    │  • payments       │  │                   │  │          │
    └───────────────────┘  └───────────────────┘  └──────────┘
```

---

## Data Flow

### 1. User Authentication Flow

```
User → Next.js Page → Supabase Auth
  ↓
Supabase returns JWT token
  ↓
Token stored in client session
  ↓
All API requests include: Authorization: Bearer {token}
  ↓
API routes verify token → RLS policies enforce data isolation
```

**Key Pattern:**
```typescript
// Client-side
const { data: { session } } = await supabase.auth.getSession();

// API route
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const { data: { user } } = await supabase.auth.getUser(token);
```

### 2. Ad Analysis Flow

```
User uploads ad creative
  ↓
Client: POST /api/analyze with creative data
  ↓
API: Check freemium tier limit (5 for free users)
  ↓
If limit not reached:
  ↓
API: Call AI service (OpenAI or mock)
  ↓
AI: Returns analysis (emotion, tone, recommendations)
  ↓
API: Store analysis in database
  ↓
API: Increment user's analysis_count
  ↓
Client: Display analysis results

If limit reached:
  ↓
API: Return 403 with requiresUpgrade flag
  ↓
Client: Show "Upgrade to Pro" button
```

### 3. Payment Flow

```
User clicks "Upgrade to Pro"
  ↓
Client: POST /api/stripe/checkout
  ↓
API: Create/retrieve Stripe customer
  ↓
API: Create checkout session ($29/month)
  ↓
API: Store payment record (status: pending)
  ↓
API: Return checkout URL
  ↓
Client: Redirect to Stripe Checkout
  ↓
User completes payment
  ↓
Stripe: Sends webhook to /api/stripe/webhook
  ↓
API: Verify webhook signature
  ↓
API: Update user.payment_status = 'paid'
  ↓
API: Update payment.status = 'succeeded'
  ↓
User redirected to dashboard (unlimited analyses)
```

---

## Database Schema

### Row-Level Security (RLS)

All tables have RLS enabled to enforce data isolation:

```sql
-- Example policy
create policy "Users can view own data"
  on public.users for select
  using (auth.uid() = id);
```

### Tables

#### `auth.users` (Supabase managed)
- Stores authentication credentials
- Managed by Supabase Auth

#### `public.users`
```sql
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  payment_status text not null default 'free', -- 'free' | 'paid'
  analysis_count integer not null default 0,
  stripe_customer_id text,
  google_refresh_token text,
  google_access_token text,
  google_token_expires_at timestamptz,
  google_customer_id text,
  google_account_name text,
  created_at timestamptz default now()
);
```

#### `creatives`
```sql
create table creatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  brand_name text,
  ad_copy text,
  ad_image_url text,
  cta text,
  source_type text not null, -- 'own' | 'competitor'
  ad_id text,
  created_at timestamptz default now()
);
```

#### `analysis`
```sql
create table analysis (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references creatives(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  analysis_result jsonb not null,
  created_at timestamptz default now()
);
```

#### `payments`
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  stripe_session_id text not null,
  stripe_customer_id text not null,
  stripe_payment_intent text,
  amount integer not null,
  status text not null, -- 'pending' | 'succeeded' | 'failed'
  created_at timestamptz default now()
);
```

### Indexes

```sql
-- Performance optimization
create index idx_creatives_user_id on creatives(user_id);
create index idx_analysis_user_id on analysis(user_id);
create index idx_analysis_creative_id on analysis(creative_id);
create index idx_payments_user_id on payments(user_id);
create index idx_payments_stripe_session_id on payments(stripe_session_id);
```

---

## Authentication & Authorization

### Client-Side Authentication

Uses Supabase client library:
```typescript
import { supabase } from '@/lib/supabase/client';

// Sign up
await supabase.auth.signUp({ email, password });

// Sign in
await supabase.auth.signInWithPassword({ email, password });

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Sign out
await supabase.auth.signOut();
```

### Server-Side Authentication

API routes use token verification:
```typescript
const token = request.headers.get('Authorization')?.replace('Bearer ', '');
const supabase = createClient(url, key, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});

const { data: { user } } = await supabase.auth.getUser(token);
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Row-Level Security (RLS)

Database policies automatically enforce user isolation:
- Users can only see/modify their own data
- No manual filtering required in application code
- Policies checked at database level

**Critical Pattern for Webhooks:**
```typescript
// Webhooks use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Not anon key!
);
```

---

## Payment Integration

### Freemium Model

- **Free Tier**: 5 analyses per user
- **Pro Tier**: $29/month, unlimited analyses

Enforcement:
```typescript
if (user.payment_status === 'free' && user.analysis_count >= 5) {
  return NextResponse.json({
    error: 'Analysis limit reached',
    requiresUpgrade: true
  }, { status: 403 });
}
```

### Stripe Integration

**Checkout Flow:**
1. Create Stripe customer (if new)
2. Create checkout session with metadata: `{ supabase_user_id }`
3. User completes payment on Stripe
4. Webhook updates database

**Webhook Events:**
- `checkout.session.completed` → Upgrade user to paid
- `customer.subscription.deleted` → Downgrade to free
- `invoice.payment_failed` → Handle failed payment

---

## AI Analysis

### Current Implementation (Mock)

Located in `lib/ai/analyze.ts`:
- Returns pre-defined analysis results
- No API calls or costs
- Instant response
- Good for demo/development

### Production Implementation (OpenAI)

Located in `lib/ai/openai-analyze.ts`:
- Uses GPT-4 Vision API
- Analyzes image + copy
- Returns structured JSON
- Requires `OPENAI_API_KEY`

**To switch to real AI:**
```typescript
// In app/api/analyze/route.ts
import { analyzeCreative } from '@/lib/ai/openai-analyze'; // Change import
```

---

## Security Considerations

### Authentication
✅ JWT-based authentication
✅ Row-Level Security (RLS)
✅ Token verification on all API routes
❌ Missing rate limiting
❌ No session timeout enforcement

### API Security
✅ Stripe webhook signature verification
✅ Environment variables for secrets
✅ HTTPS enforced in production
❌ Missing input validation (should add Zod)
❌ No request size limits

### Data Security
✅ RLS enforces data isolation
✅ Cascade deletes maintain referential integrity
✅ No sensitive data in client code
❌ Service role key used only in webhooks (correct pattern)

---

## Performance Considerations

### Optimizations
- ✅ Database indexes on foreign keys
- ✅ Next.js automatic code splitting
- ✅ Static page generation where possible
- ❌ No caching layer
- ❌ No image optimization
- ❌ No query result caching

### Scalability
- **Current**: Handles 1000s of users
- **Bottleneck**: Database queries (no caching)
- **Solution**: Add Redis for caching + rate limiting

---

## Deployment Architecture

### Vercel (Frontend + API)
- Auto-deploys from GitHub `main` branch
- Edge Functions for API routes
- Global CDN for static assets
- Automatic HTTPS
- Preview deployments for PRs

### Supabase (Database)
- Managed PostgreSQL instance
- Automatic backups
- Connection pooling
- Built-in auth service

### Stripe (Payments)
- Hosted checkout pages
- Webhook delivery
- Customer portal (future)

---

## Future Enhancements

### Near-term
- [ ] Add input validation with Zod
- [ ] Implement rate limiting
- [ ] Add error monitoring (Sentry)
- [ ] Complete Meta API integration
- [ ] Add email notifications

### Long-term
- [ ] Add testing (Jest + Playwright)
- [ ] Implement caching layer
- [ ] Add admin dashboard
- [ ] Build mobile app
- [ ] Add team collaboration features

---

## Troubleshooting Common Issues

### "Unauthorized" on API calls
- **Cause**: Missing or invalid Authorization header
- **Fix**: Ensure session token is passed correctly

### Webhook not updating payment status
- **Cause**: Using anon key instead of service role key
- **Fix**: Use `SUPABASE_SERVICE_ROLE_KEY` in webhook handler

### Analysis limit not enforced
- **Cause**: Counter not incrementing
- **Fix**: Check analysis_count update in /api/analyze

### TypeScript build errors
- **Cause**: strictNullChecks issues
- **Fix**: Disabled in tsconfig.json for Vercel compatibility

---

## Related Documentation

- [API Documentation](./API.md) - Endpoint details
- [Claude Code Guide](./CLAUDE.md) - AI assistant instructions
- [Meta OAuth Setup](./META_OAUTH_SETUP.md) - Integration guide
- [Sprint 3 Code Review](./SPRINT3_CODE_REVIEW.md) - Quality assessment
- [Contributing Guide](../CONTRIBUTING.md) - Development workflow
