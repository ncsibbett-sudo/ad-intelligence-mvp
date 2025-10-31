# Ad Intelligence - Marketing Analytics Platform

A production-ready MVP for analyzing ad creatives and discovering what drives performance. Built with Next.js, Supabase, and Stripe.

🚀 **[Live Demo](https://ad-intelligence-mvp.vercel.app)** | 📚 **[Documentation](./docs)** | 🤝 **[Contributing](./CONTRIBUTING.md)**

## Quick Links

- [API Documentation](./docs/API.md) - Complete API reference
- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and data flow
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow
- [Meta OAuth Setup](./docs/META_OAUTH_SETUP.md) - Meta integration guide
- [Code Review](./docs/SPRINT3_CODE_REVIEW.md) - Quality assessment

## Features

- **User Authentication** - Secure signup/login with Supabase Auth
- **Meta Ads Integration** - Connect Meta ad accounts and import ad creatives
- **Competitor Analysis** - Search and analyze competitor ads via Meta Ad Library
- **AI-Powered Analysis** - Extract insights from ad copy, images, CTAs, and emotional tone
- **Performance Insights** - Link creative elements to performance metrics
- **Freemium Model** - Free tier (5 analyses) + Pro subscription via Stripe
- **Dashboard** - View, manage, and analyze ad creatives
- **Responsive Design** - Mobile-first UI with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL + Auth)
- **Payments**: Stripe (Checkout + Webhooks)
- **APIs**: Meta Marketing API, Meta Ad Library API
- **AI**: Mock analysis (production-ready structure for OpenAI/Claude)
- **Hosting**: Vercel-ready

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Stripe account
- Meta Developer account (for Meta Ads integration)

## Setup Instructions

### 1. Clone and Install

```bash
cd MarketingApp
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `lib/supabase/schema.sql`
3. Get your project URL and anon key from Settings > API

### 3. Stripe Setup

1. Create account at [stripe.com](https://stripe.com)
2. Get your test API keys from Developers > API keys
3. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`
4. Copy webhook signing secret

### 4. Meta Setup (Optional)

1. Create app at [developers.facebook.com](https://developers.facebook.com)
2. Add "Marketing API" product
3. Configure OAuth redirect: `https://your-domain.com/api/meta/connect`
4. Get App ID and App Secret

### 5. Environment Variables

Create `.env.local` file (copy from `.env.local.example`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Meta/Facebook
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_ACCESS_TOKEN=your_meta_access_token

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ad-intelligence/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── analyze/              # AI analysis endpoint
│   │   ├── meta/                 # Meta OAuth & data fetching
│   │   └── stripe/               # Stripe checkout & webhooks
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/                # Main application
│   │   ├── analyze/[id]/         # Analysis page
│   │   ├── competitor/           # Competitor search
│   │   ├── import/               # Import ads
│   │   └── page.tsx              # Dashboard home
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── docs/                         # Documentation
│   ├── API.md                    # API endpoint reference
│   ├── ARCHITECTURE.md           # System design guide
│   ├── CLAUDE.md                 # AI assistant instructions
│   ├── META_OAUTH_SETUP.md       # Meta integration guide
│   └── SPRINT3_CODE_REVIEW.md    # Code quality assessment
├── lib/                          # Core utilities
│   ├── ai/                       # AI analysis logic
│   │   ├── analyze.ts            # Mock AI (currently active)
│   │   └── openai-analyze.ts     # Real OpenAI integration (ready)
│   ├── meta/                     # Meta API clients
│   │   └── client.ts             # Meta Ads & Ad Library clients
│   ├── supabase/                 # Supabase configuration
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── schema.sql            # Database schema
│   └── types.ts                  # TypeScript type definitions
├── Configuration files
│   ├── .editorconfig             # Editor consistency
│   ├── .eslintrc.json            # Linting rules
│   ├── .gitignore                # Git exclusions
│   ├── .nvmrc                    # Node version
│   ├── .prettierrc               # Code formatting
│   ├── .prettierignore           # Format exclusions
│   ├── next.config.js            # Next.js config
│   ├── package.json              # Dependencies & scripts
│   ├── tailwind.config.ts        # Tailwind config
│   └── tsconfig.json             # TypeScript config
├── CONTRIBUTING.md               # Development guidelines
└── README.md                     # This file
```

## Key Features Explained

### Authentication Flow

- Users sign up with email/password via Supabase Auth
- Sessions managed with HTTP-only cookies
- Row-level security enforces data access control

### Ad Import Workflow

1. **Meta OAuth**: Connect ad account → fetch ads with performance data
2. **Manual Import**: Enter ad details directly
3. **Competitor Search**: Search Meta Ad Library by brand name

### AI Analysis

Currently uses mock analysis with heuristics. Replace `lib/ai/analyze.ts` with:
- OpenAI GPT-4 Vision API
- Anthropic Claude API
- Custom ML model

Analysis returns:
- Headline length and tone
- Emotional triggers
- Visual elements
- Color palette
- Performance drivers
- Actionable recommendations

### Payment Integration

- **Free Tier**: 5 analyses per user
- **Pro Tier**: $29/month for unlimited analyses
- Stripe Checkout handles subscriptions
- Webhooks update user status in real-time

### Database Schema

- `users` - User profiles + payment status
- `creatives` - Ad creative data (own + competitor)
- `analysis` - AI analysis results
- `payments` - Payment transaction history

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

```bash
npm run build  # Test production build locally
```

### Environment Setup

For production, update:
- `NEXT_PUBLIC_APP_URL` to your domain
- All API keys to production values
- Stripe webhook URL to production endpoint

### Post-Deployment

1. Test authentication flow
2. Verify Stripe webhooks receiving events
3. Test Meta OAuth (if configured)
4. Create test account and run analysis

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/analyze` | POST | Run AI analysis on creative |
| `/api/meta/connect` | GET | Meta OAuth callback |
| `/api/stripe/checkout` | POST | Create Stripe session |
| `/api/stripe/webhook` | POST | Handle Stripe events |

## Development Notes

### Testing Payments

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

### Mock vs Real AI

Current implementation uses mock AI. To integrate real AI:

```typescript
// lib/ai/analyze.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeCreative(imageUrl, adCopy, cta) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this ad creative..." },
          { type: "image_url", image_url: imageUrl }
        ]
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}
```

### Rate Limiting

Add rate limiting to protect APIs:

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

export async function middleware(request: NextRequest) {
  const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '10 s'),
  });

  await ratelimit.limit(request.ip);
}
```

## Troubleshooting

### Supabase Connection Issues

- Verify URL and keys in `.env.local`
- Check RLS policies in Supabase dashboard
- Ensure schema.sql ran successfully

### Stripe Webhooks Not Working

- Verify webhook secret matches
- Check webhook endpoint is publicly accessible
- Review webhook logs in Stripe dashboard

### Meta API Errors

- Confirm app is in Live mode (not Development)
- Verify access token has correct permissions
- Check API version compatibility

## Future Enhancements

- [ ] Real AI integration (OpenAI/Claude)
- [ ] Batch analysis for multiple ads
- [ ] Custom insight reports (PDF export)
- [ ] Team collaboration features
- [ ] Advanced performance metrics
- [ ] A/B test recommendations
- [ ] Email notifications
- [ ] Multi-language support

## License

MIT

## Support

For issues or questions:
1. Check troubleshooting section
2. Review Supabase/Stripe documentation
3. Open GitHub issue

---

**Built with**: Next.js, Supabase, Stripe, and Tailwind CSS

**Status**: Production-ready MVP
