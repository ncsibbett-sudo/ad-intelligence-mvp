# MarketingApp Codebase Analysis

## What This App Does

This is an **Ad Intelligence** web application that helps users:
- Connect their Google Ads account
- Import ad campaign data
- Get AI-powered analysis of their ads using OpenAI
- Pay for premium features via Stripe

---

## Project Stats

| Metric | Value |
|--------|-------|
| Total Lines of Code | ~7,335 |
| Framework | Next.js 15 (React 18) |
| Language | TypeScript |
| Styling | Tailwind CSS |

---

## Directory Structure

```
MarketingApp/
├── app/                    # 🖥️ FRONTEND + API (Next.js App Router)
│   ├── api/               # Backend API routes
│   ├── auth/              # Login/signup pages
│   ├── dashboard/         # Main user interface
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout wrapper
│   └── page.tsx           # Homepage
│
├── lib/                   # 📚 SHARED LOGIC (reusable code)
│   ├── ai/               # AI analysis functions
│   ├── google/           # Google Ads API client
│   ├── supabase/         # Database client
│   ├── constants.ts      # App-wide constants
│   └── types.ts          # TypeScript type definitions
│
├── tests/                 # 🧪 TESTING
│   ├── e2e/              # End-to-end browser tests
│   ├── integration/      # API integration tests
│   ├── unit/             # Unit tests
│   └── fixtures/         # Test data
│
├── docs/                  # 📖 Documentation
├── .claude/specs/         # Feature specifications
└── [config files]         # Project configuration
```

---

## File Breakdown by Category

### 🖥️ FRONTEND FILES (What users see)

| File | Purpose |
|------|---------|
| `app/page.tsx` | **Homepage** - Landing page users first see |
| `app/layout.tsx` | **Layout wrapper** - Wraps every page (like a template) |
| `app/globals.css` | **Global styles** - CSS that applies everywhere |
| `app/auth/login/page.tsx` | **Login page** - Where users sign in |
| `app/auth/signup/page.tsx` | **Signup page** - Where users create accounts |
| `app/dashboard/page.tsx` | **Dashboard** - Main user interface after login |
| `app/dashboard/import/page.tsx` | **Import page** - Import ads from Google |
| `app/dashboard/analyze/[id]/page.tsx` | **Analysis page** - View AI analysis of an ad |

### 🔧 BACKEND API FILES (Server logic)

| File | Purpose |
|------|---------|
| `app/api/analyze/route.ts` | Handles AI analysis requests |
| `app/api/google/connect/route.ts` | Connects user's Google Ads account |
| `app/api/google/disconnect/route.ts` | Disconnects Google Ads account |
| `app/api/google/import-ads/route.ts` | Imports ads from Google Ads |
| `app/api/stripe/checkout/route.ts` | Creates Stripe payment sessions |
| `app/api/stripe/webhook/route.ts` | Handles Stripe payment notifications |

### 📚 LIBRARY/UTILITY FILES (Shared code)

| File | Purpose |
|------|---------|
| `lib/ai/analyze.ts` | Core AI analysis logic |
| `lib/ai/openai-analyze.ts` | OpenAI API integration |
| `lib/google/client.ts` | Google Ads API client |
| `lib/google/types.ts` | Google-related TypeScript types |
| `lib/supabase/client.ts` | Browser-side database client |
| `lib/supabase/server.ts` | Server-side database client |
| `lib/constants.ts` | App constants (URLs, limits, etc.) |
| `lib/types.ts` | Shared TypeScript type definitions |

### ⚙️ CONFIGURATION FILES (Project setup)

| File | Purpose |
|------|---------|
| `package.json` | **Dependencies & scripts** - Lists all npm packages and commands |
| `tsconfig.json` | **TypeScript config** - How TypeScript compiles code |
| `tailwind.config.ts` | **Tailwind config** - Custom styling options |
| `postcss.config.js` | **PostCSS config** - CSS processing |
| `.eslintrc.json` | **Linter config** - Code quality rules |
| `vitest.config.ts` | **Unit test config** - How Vitest runs tests |
| `playwright.config.ts` | **E2E test config** - How Playwright runs browser tests |

### 🧪 TEST FILES

| File | Purpose |
|------|---------|
| `tests/unit/ai/*.test.ts` | Tests for AI analysis functions |
| `tests/unit/supabase/*.test.ts` | Tests for database functions |
| `tests/integration/api/*.test.ts` | Tests for API endpoints |
| `tests/e2e/*.spec.ts` | Full browser tests simulating user actions |
| `tests/fixtures/google/*.json` | Mock data for testing |

---

## Technology Stack Explained

| Technology | What It Does | Category |
|------------|--------------|----------|
| **Next.js** | React framework with built-in routing & API routes | Frontend + Backend |
| **React** | UI component library | Frontend |
| **TypeScript** | JavaScript with types (catches bugs early) | Language |
| **Tailwind CSS** | Utility-first CSS framework | Styling |
| **Supabase** | Database + Authentication (like Firebase) | Backend Service |
| **Stripe** | Payment processing | Backend Service |
| **OpenAI** | AI/GPT for ad analysis | Backend Service |
| **Google Ads API** | Fetches user's ad data | Backend Service |
| **Vitest** | Fast unit test runner | Testing |
| **Playwright** | Browser automation for E2E tests | Testing |

---

## How the App Flows

```
User visits site
       ↓
   Login/Signup (Supabase Auth)
       ↓
   Dashboard (app/dashboard/page.tsx)
       ↓
   Connect Google Ads (api/google/connect)
       ↓
   Import Ads (api/google/import-ads)
       ↓
   Analyze Ads with AI (api/analyze → lib/ai/)
       ↓
   View Results (dashboard/analyze/[id])
       ↓
   Pay for Premium (api/stripe/checkout)
```

---

## Key Concepts for Beginners

### What is Next.js App Router?
Files in the `app/` folder automatically become pages:
- `app/page.tsx` → `yoursite.com/`
- `app/dashboard/page.tsx` → `yoursite.com/dashboard`
- `app/api/analyze/route.ts` → `yoursite.com/api/analyze`

### What is `[id]` in folder names?
It's a **dynamic route**. `app/dashboard/analyze/[id]/page.tsx` means:
- `yoursite.com/dashboard/analyze/123` works
- `yoursite.com/dashboard/analyze/abc` works
- The `id` value (123, abc) is passed to the page

### Frontend vs Backend in Next.js
- Files named `page.tsx` = Frontend (runs in browser)
- Files named `route.ts` in `api/` folder = Backend (runs on server)

---

## Commands to Know

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:e2e     # Run browser tests
npm run lint         # Check code quality
```

---

*Generated for codebase orientation. Last updated: 2025-11-21*
