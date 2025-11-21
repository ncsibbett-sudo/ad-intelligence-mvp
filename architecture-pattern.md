# Architecture Pattern Analysis

## Quick Summary for Product Managers

Your app follows a **Serverless Monolith** pattern using **Next.js Full-Stack** architecture. Think of it like a restaurant where the kitchen (backend) and dining room (frontend) are in the same building, but can scale independently when needed.

---

## 1. Architectural Pattern

### Primary Pattern: **Serverless Monolith**

| Term | What It Means |
|------|---------------|
| **Serverless** | You don't manage servers. Vercel/cloud handles scaling automatically. |
| **Monolith** | All code lives in one repository (not split into microservices). |
| **Full-Stack** | Frontend AND backend in the same codebase. |

```
┌─────────────────────────────────────────────────────────┐
│                    Your Next.js App                      │
│  ┌──────────────────┐    ┌────────────────────────────┐ │
│  │   Frontend (UI)  │    │   Backend (API Routes)     │ │
│  │   React Pages    │◄──►│   /api/analyze             │ │
│  │   Components     │    │   /api/google/*            │ │
│  │                  │    │   /api/stripe/*            │ │
│  └──────────────────┘    └────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌─────────┐    ┌──────────┐    ┌─────────┐
         │ Supabase│    │  OpenAI  │    │ Stripe  │
         │   (DB)  │    │   (AI)   │    │(Payment)│
         └─────────┘    └──────────┘    └─────────┘
                              │
                              ▼
                        ┌──────────┐
                        │Google Ads│
                        │   API    │
                        └──────────┘
```

### Why This Pattern?

| Benefit | Explanation |
|---------|-------------|
| **Fast to build** | One codebase = fewer decisions, faster shipping |
| **Easy deployment** | Push to GitHub → Vercel deploys automatically |
| **Cost effective** | Pay only for actual usage (serverless) |
| **Scales automatically** | Vercel handles traffic spikes |

---

## 2. Code Organization: **Hybrid (Layer + Feature)**

Your code uses a **layered approach** at the top level, with **feature grouping** inside:

```
📁 app/           ← LAYER: Presentation (UI + API)
  📁 api/         ← Feature: Backend endpoints
    📁 google/    ← Sub-feature: Google Ads
    📁 stripe/    ← Sub-feature: Payments
    📁 analyze/   ← Sub-feature: AI Analysis
  📁 dashboard/   ← Feature: Main user interface
  📁 auth/        ← Feature: Login/Signup

📁 lib/           ← LAYER: Business Logic & Data Access
  📁 ai/          ← Feature: AI services
  📁 google/      ← Feature: Google integration
  📁 supabase/    ← Feature: Database access

📁 tests/         ← LAYER: Quality Assurance
  📁 unit/        ← Test type
  📁 integration/ ← Test type
  📁 e2e/         ← Test type
```

---

## 3. Main Components & How They Interact

### Component Map

| Component | Location | Responsibility | Talks To |
|-----------|----------|----------------|----------|
| **UI Pages** | `app/*.tsx` | Display data, handle user actions | API Routes |
| **API Routes** | `app/api/*/route.ts` | Process requests, enforce rules | Lib modules, External APIs |
| **AI Module** | `lib/ai/` | Analyze ads using AI | OpenAI API |
| **Google Module** | `lib/google/` | Fetch ad data | Google Ads API |
| **Database Module** | `lib/supabase/` | Store/retrieve data | Supabase |
| **Auth** | Supabase Auth | Login, sessions | Supabase |
| **Payments** | `app/api/stripe/` | Handle subscriptions | Stripe |

### Data Flow Example: "User Analyzes an Ad"

```
1. User clicks "Analyze" button
           │
           ▼
2. Dashboard (frontend) sends POST to /api/analyze
           │
           ▼
3. API Route checks: Is user logged in? (Supabase Auth)
           │
           ▼
4. API Route checks: Is user paid or free tier? (Database)
           │
           ▼
5. API Route calls AI module (lib/ai/)
           │
           ▼
6. AI module calls OpenAI (paid) or returns mock (free)
           │
           ▼
7. API Route saves analysis to database
           │
           ▼
8. Response sent back to Dashboard
           │
           ▼
9. User sees analysis results
```

---

## 4. Responsibility Mapping

### Who Handles What?

| Responsibility | Files | Pattern Used |
|----------------|-------|--------------|
| **UI Rendering** | `app/**/page.tsx` | React components with hooks |
| **Routing** | `app/` folder structure | File-based routing (Next.js convention) |
| **Authentication** | `lib/supabase/client.ts`, API routes | Supabase Auth + JWT tokens |
| **Authorization** | API route handlers | Manual checks in each route |
| **Business Logic** | `lib/ai/`, `lib/google/`, API routes | Service modules |
| **Data Access** | `lib/supabase/`, inline in pages | Direct Supabase SDK calls |
| **Payments** | `app/api/stripe/` | Stripe SDK + webhooks |
| **External APIs** | `lib/google/`, `lib/ai/` | Wrapper modules |

### Tier System (Business Logic)

```
Free Users:
  └─► Mock AI analysis (no cost)
  └─► Limited features

Paid Users:
  └─► Real OpenAI analysis (~$0.002/analysis)
  └─► Full features
```

---

## 5. Potential Issues & Recommendations

### ⚠️ Issues Found

| Issue | Location | Risk Level | Explanation |
|-------|----------|------------|-------------|
| **Hardcoded secrets** | `app/api/analyze/route.ts:19-20` | 🔴 HIGH | Supabase URL and key visible in code. Should use environment variables. |
| **Mixed data access** | Dashboard pages | 🟡 MEDIUM | Pages directly call Supabase instead of going through API routes. Makes testing harder. |
| **No repository pattern** | Throughout | 🟢 LOW | Database queries scattered in components. OK for small apps, harder to maintain as you grow. |
| **Duplicated auth checks** | API routes | 🟡 MEDIUM | Same auth code repeated in multiple routes. Could use middleware. |

### 🔴 Critical: Hardcoded Credentials

In `app/api/analyze/route.ts`, lines 19-20:
```typescript
const supabaseUrl = 'https://utmnwtxtwxfymrcyrgqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJI...';  // This should be in .env
```

**Fix:** Move to environment variables (`.env.local`):
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
```

### Recommendations by Priority

| Priority | Action | Effort | Impact |
|----------|--------|--------|--------|
| 1 | Remove hardcoded credentials | 30 min | Security |
| 2 | Add auth middleware | 2-3 hrs | Maintainability |
| 3 | Create API layer for data access | 1-2 days | Testability |
| 4 | Add error boundary components | 2-3 hrs | User experience |

---

## Architecture Scorecard

| Criteria | Score | Notes |
|----------|-------|-------|
| **Simplicity** | ⭐⭐⭐⭐⭐ | Easy to understand and navigate |
| **Scalability** | ⭐⭐⭐⭐ | Serverless scales well |
| **Testability** | ⭐⭐⭐ | Mixed - some areas hard to test |
| **Security** | ⭐⭐ | Hardcoded credentials need fixing |
| **Maintainability** | ⭐⭐⭐⭐ | Good separation, some duplication |

### Overall: **Good foundation, needs security fix**

Your architecture is appropriate for a product at this stage. The main concern is the hardcoded credentials which should be fixed immediately.

---

## Glossary for Product Managers

| Term | Simple Definition |
|------|-------------------|
| **API Route** | A URL that your frontend calls to do something (like `/api/analyze`) |
| **Serverless** | Cloud runs your code only when needed, you don't manage servers |
| **Monolith** | All code in one place (opposite of microservices) |
| **Middleware** | Code that runs before every request (like a security checkpoint) |
| **JWT Token** | A secure "pass" that proves a user is logged in |
| **Webhook** | A URL that external services call to notify you of events (like "payment succeeded") |
| **RLS** | Row Level Security - database rules that restrict who can see what data |

---

*Generated for architecture review. Last updated: 2025-11-21*
