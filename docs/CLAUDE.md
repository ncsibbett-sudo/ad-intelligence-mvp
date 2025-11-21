# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

Development server runs on `http://localhost:3000` by default.

## Architecture Overview

### Tech Stack
- **Next.js 15** with App Router (not Pages Router)
- **TypeScript** with `strictNullChecks: false` (required for Vercel deployment)
- **Supabase** for authentication and PostgreSQL database
- **Stripe** for payment processing (test mode)
- **Mock AI** analysis (production-ready structure exists for OpenAI integration)

### Critical Deployment Pattern

**Hardcoded Credentials in API Routes**: Due to Next.js 15 environment variable handling issues on Vercel, Supabase credentials are **intentionally hardcoded** in:
- `lib/supabase/client.ts` - Browser client
- `app/api/analyze/route.ts` - Analysis API (lines 18-19)
- `app/api/stripe/checkout/route.ts` - Stripe checkout API (lines 21-22)

These are **anon keys** (public-safe) but should NOT be changed to environment variables as it breaks Vercel deployments.

### Authentication Flow

1. **Client-side**: Uses `lib/supabase/client.ts` with hardcoded credentials
2. **API routes**: Accept `Authorization: Bearer {token}` header from client
3. **Token validation**: Each API route creates a Supabase client with the user's token for RLS enforcement:
   ```typescript
   const supabase = createClient(supabaseUrl, supabaseAnonKey, {
     global: { headers: { Authorization: `Bearer ${token}` } }
   });
   ```
4. **User profile auto-creation**: API routes automatically create user profiles in `public.users` if the database trigger fails

### Database Architecture

**Schema**: `lib/supabase/schema.sql` defines:
- `users` - Extends auth.users with payment status and analysis count
- `creatives` - Stores ad creative data (user's own ads or competitor ads)
- `analysis` - Stores AI analysis results (1:1 with creatives)
- `payments` - Tracks Stripe transactions

**Row-Level Security (RLS)**:
- All tables have RLS enabled
- Policies enforce user_id = auth.uid() for data isolation
- Special INSERT policy on users table allows service role auto-creation

**Critical Pattern**: API routes may encounter missing user profiles if the `handle_new_user()` trigger fails. All API routes include fallback logic to create profiles:
```typescript
if (!userData) {
  const { data: newUser } = await supabase.from('users').insert({
    id: user.id,
    email: user.email,
    payment_status: 'free',
    analysis_count: 0,
  }).select().single();
  userData = newUser;
}
```

### Payment Integration (Freemium Model)

- **Free tier**: 5 analyses per user (enforced in `/api/analyze`)
- **Pro tier**: $29/month unlimited (via Stripe Checkout)
- **Test cards**: Use `4242 4242 4242 4242` for successful test payments
- **Webhooks**: `/api/stripe/webhook` handles `checkout.session.completed` events
- **Important**: Stripe is in test mode; webhook secret must match `.env.local`

### AI Analysis Architecture

Uses **hybrid AI approach** based on payment tier:

- **Free users**: Mock AI (`lib/ai/analyze.ts`) - Zero cost
- **Paid users**: Real AI (`lib/ai/openai-analyze.ts`) - GPT-3.5 Turbo (~$0.002 per analysis)

**Cost Structure:**
- Free tier: $0 cost (mock AI)
- Pro tier: ~$0.002 per analysis (99% profit margin on $29/month subscription)
- Example: 1,000 analyses/month = $2 cost, $27 profit per user

**Implementation:**
```typescript
// In /api/analyze/route.ts
const analysisResult = userData.payment_status === 'paid'
  ? await openaiAnalyze(image_url, ad_copy, cta)
  : await mockAnalyze(image_url, ad_copy, cta);
```

**Required Environment Variable:**
- `OPENAI_API_KEY` - Required for paid tier analysis (add to Vercel for production)

## File Structure Patterns

```
app/
├── api/                    # API routes (all POST except meta/connect)
│   ├── analyze/           # AI analysis endpoint
│   ├── meta/connect/      # Meta OAuth callback (GET)
│   ├── stripe/checkout/   # Create Stripe session (POST)
│   └── stripe/webhook/    # Handle Stripe events (POST)
├── auth/                  # Authentication pages (client components)
├── dashboard/             # Protected routes (require auth)
│   ├── analyze/[id]/     # Dynamic route for analyzing single creative
│   ├── competitor/        # Meta Ad Library search
│   ├── import/            # Manual ad import form
│   └── page.tsx          # Dashboard home with stats
└── page.tsx              # Public landing page

lib/
├── ai/                    # AI analysis modules
│   ├── analyze.ts        # Mock AI (currently active)
│   └── openai-analyze.ts # Real OpenAI integration (commented out)
├── supabase/
│   ├── client.ts         # Browser client (hardcoded credentials)
│   ├── server.ts         # Server client (SSR with cookies)
│   └── schema.sql        # Database schema
└── types.ts              # Shared TypeScript types
```

## Common Patterns

### API Route Structure
```typescript
export async function POST(request: Request) {
  // 1. Extract auth token
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');

  // 2. Create Supabase client with user's token (hardcoded credentials)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });

  // 3. Verify user
  const { data: { user } } = await supabase.auth.getUser(token);

  // 4. Get/create user profile with fallback
  // 5. Business logic
  // 6. Return NextResponse.json()
}
```

### Client-Side Data Fetching
```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  },
  body: JSON.stringify(data),
});
```

## Deployment Considerations

### Vercel-Specific Issues Resolved

1. **TypeScript strict null checks**: Disabled `strictNullChecks` in `tsconfig.json` to prevent build failures
2. **Environment variables**: Hardcoded Supabase credentials instead of relying on `process.env.NEXT_PUBLIC_*`
3. **Build cache**: Clear `.next` folder if encountering module resolution errors
4. **Standalone output**: Configured in `next.config.js` for optimized deployments

### Environment Variables (for reference, but credentials are hardcoded)

Required in Vercel environment (even though hardcoded in code):
- `STRIPE_SECRET_KEY` - Actual secret used by server
- `STRIPE_WEBHOOK_SECRET` - For webhook signature verification
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `META_APP_ID`, `META_APP_SECRET` (if using Meta integration)
- `OPENAI_API_KEY` (if switching to real AI)

### Known Working State

The codebase is deployed and functional at `https://ad-intelligence-mvp.vercel.app` with:
- ✅ User signup/login
- ✅ Manual ad import
- ✅ AI analysis (mock)
- ✅ Freemium tier enforcement
- ✅ Stripe checkout flow
- ⚠️ Meta OAuth UI exists but not fully implemented

## Troubleshooting

### "Unauthorized" errors on API routes
- Ensure client is passing `Authorization: Bearer {token}` header
- Check that Supabase credentials match in both client and API routes
- Verify user exists in `public.users` table (auto-created by API routes)

### Build failures on Vercel
- Confirm `strictNullChecks: false` in `tsconfig.json`
- Check that Supabase credentials are hardcoded (not env vars) in API routes
- Review Vercel build logs for specific TypeScript errors

### Database trigger not creating users
- API routes have fallback logic to auto-create profiles
- Check RLS INSERT policy exists: `"Allow service role to insert users"`
- Verify trigger function exists: `handle_new_user()`

### Stripe webhooks not working locally
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Update `STRIPE_WEBHOOK_SECRET` with CLI-provided secret
- Verify webhook route returns 200 status

## Google Ads API Integration

The application integrates with Google Ads API to import user's ad campaigns:
- OAuth 2.0 flow in `/api/google/connect` for secure authorization
- Ad import functionality in `/api/google/import-ads`
- Support for filtering by campaign status and date range
- Performance metrics sync (impressions, clicks, CTR, CPC, conversions)

Required environment variables:
- `GOOGLE_ADS_CLIENT_ID` - OAuth client ID
- `GOOGLE_ADS_CLIENT_SECRET` - OAuth client secret
- `GOOGLE_ADS_DEVELOPER_TOKEN` - Google Ads API developer token

## TypeScript Configuration

- **Path aliases**: `@/*` maps to root directory
- **Strict mode**: Enabled except `strictNullChecks: false` (required for Vercel)
- **Target**: ES2017 for broad compatibility
- **Module**: esnext with bundler resolution (Next.js 15)

## Testing the Application

1. **Signup**: Create account at `/auth/signup`
2. **Import ad**: Go to `/dashboard/import`, fill form with test data
3. **Analyze**: Click "Analyze Now" on created creative
4. **Freemium**: Create 5 analyses to trigger upgrade prompt
5. **Stripe**: Use test card `4242 4242 4242 4242` for checkout
6. **View analysis**: Results display on `/dashboard/analyze/[id]`
