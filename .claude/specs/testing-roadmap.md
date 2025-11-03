# Testing Roadmap

This document outlines all tests we need to implement for the Ad Intelligence application.

## Why Testing Matters

This is a production SaaS app handling:
- 💳 Real payments ($29/month via Stripe)
- 🔐 User authentication and data isolation
- 💰 Freemium tier limits (5 analyses for free users)
- 🤖 AI costs (OpenAI charges per API call)

**Without tests, bugs could:**
- Charge users incorrectly
- Give free users unlimited analyses (losing money)
- Let users access each other's data (security breach)
- Break payment upgrades (losing revenue)

## Testing Stack

| Tool | Purpose | Why |
|------|---------|-----|
| **Vitest** | Unit & Integration tests | Fast, TypeScript-friendly, ESM support |
| **Playwright** | End-to-end tests | Multi-browser, reliable, great for Next.js |
| **MSW** | Mock external APIs | Test without real Stripe/Supabase/OpenAI calls |

## Project Structure

```
MarketingApp/
├── tests/
│   ├── unit/              # Individual function tests
│   │   ├── ai/
│   │   │   ├── analyze.test.ts
│   │   │   └── openai-analyze.test.ts
│   │   └── lib/
│   │       └── constants.test.ts
│   ├── integration/       # API route tests
│   │   └── api/
│   │       ├── analyze.test.ts
│   │       ├── stripe-checkout.test.ts
│   │       └── stripe-webhook.test.ts
│   └── e2e/              # Complete user journey tests
│       ├── auth.spec.ts
│       ├── freemium-flow.spec.ts
│       ├── upgrade-flow.spec.ts
│       └── data-isolation.spec.ts
├── vitest.config.ts
├── playwright.config.ts
└── package.json
```

---

## Priority 1: Unit Tests (Start Here) 🎯

### File: `tests/unit/ai/analyze.test.ts`
**What it tests:** Mock AI analysis function
**File being tested:** `lib/ai/analyze.ts`

**Tests to write:**
- [ ] ✅ Extracts headline from ad copy correctly
- [ ] ✅ Detects urgency emotion from keywords
- [ ] ✅ Detects trust emotion from keywords
- [ ] ✅ Identifies professional tone
- [ ] ✅ Identifies friendly tone
- [ ] ✅ Handles empty ad copy gracefully
- [ ] ✅ Handles missing CTA gracefully
- [ ] ✅ Returns all required fields in AnalysisResult
- [ ] ✅ Generates at least one recommendation
- [ ] ✅ Handles very long ad copy (5000+ characters)

**Why important:** Ensures mock AI always returns valid results for free users.

**Example test:**
```typescript
test('extracts headline from ad copy', () => {
  const result = analyzeCreative(null, 'Get 50% Off Today! Free Shipping.', 'Shop Now');

  expect(result.headline).toBe('Get 50% Off Today!');
  expect(result.emotion).toBe('urgency');
});
```

---

### File: `tests/unit/ai/openai-analyze.test.ts`
**What it tests:** Real OpenAI integration
**File being tested:** `lib/ai/openai-analyze.ts`

**Tests to write:**
- [ ] Calls OpenAI API with correct model (gpt-3.5-turbo)
- [ ] Passes ad copy and CTA to API
- [ ] Parses JSON response correctly
- [ ] Handles OpenAI API errors gracefully
- [ ] Falls back to mock analysis on error
- [ ] Handles rate limit errors (429)
- [ ] Handles invalid API key errors (401)
- [ ] Returns valid AnalysisResult structure

**Why important:** Ensures paid users get real AI that fails gracefully.

---

## Priority 2: Integration Tests (Critical) 🚨

### File: `tests/integration/api/analyze.test.ts`
**What it tests:** AI analysis API route with freemium logic
**File being tested:** `app/api/analyze/route.ts`

**Tests to write:**
- [ ] 🔥 Free user can create 5 analyses
- [ ] 🔥 6th analysis attempt returns 403 with requiresUpgrade flag
- [ ] 🔥 Paid user can create unlimited analyses
- [ ] 🔥 Missing Authorization header returns 401
- [ ] 🔥 Invalid auth token returns 401
- [ ] Analysis count increments correctly
- [ ] Creates analysis record in database
- [ ] Links analysis to creative via creative_id
- [ ] Free user gets mock AI, paid user gets real AI
- [ ] User profile auto-creation works if missing

**Why critical:** This enforces your entire business model - if these fail, you lose money.

**Example test:**
```typescript
test('free user cannot create 6th analysis', async () => {
  const freeUser = await createTestUser({
    payment_status: 'free',
    analysis_count: 5
  });

  const response = await POST('/api/analyze', {
    headers: { Authorization: `Bearer ${freeUser.token}` },
    body: { creative_id: '123', ad_copy: 'Test ad', cta: 'Click' }
  });

  expect(response.status).toBe(403);
  expect(response.body.requiresUpgrade).toBe(true);
});
```

---

### File: `tests/integration/api/stripe-checkout.test.ts`
**What it tests:** Stripe checkout session creation
**File being tested:** `app/api/stripe/checkout/route.ts`

**Tests to write:**
- [ ] Creates Stripe customer if doesn't exist
- [ ] Reuses existing Stripe customer if exists
- [ ] Returns valid checkout session URL
- [ ] Includes supabase_user_id in metadata
- [ ] Creates payment record with 'pending' status
- [ ] Handles Stripe API errors gracefully
- [ ] Missing auth token returns 401

**Why important:** Broken checkout = no revenue.

---

### File: `tests/integration/api/stripe-webhook.test.ts`
**What it tests:** Stripe webhook payment processing
**File being tested:** `app/api/stripe/webhook/route.ts`

**Tests to write:**
- [ ] 🔥 checkout.session.completed updates user to 'paid'
- [ ] 🔥 Updates payment record status to 'succeeded'
- [ ] customer.subscription.deleted downgrades user to 'free'
- [ ] invoice.payment_failed leaves user as 'paid' (grace period)
- [ ] Invalid webhook signature returns 400
- [ ] Missing metadata doesn't crash webhook
- [ ] Handles duplicate webhook events (idempotency)

**Why critical:** If webhook fails, users pay but don't get upgraded.

---

## Priority 3: End-to-End Tests 🎬

### File: `tests/e2e/freemium-flow.spec.ts`
**What it tests:** Complete free user experience

**Tests to write:**
- [ ] New user can signup with email/password
- [ ] Can import an ad via manual form
- [ ] Can click "Analyze Now" and see results
- [ ] Can create 5 analyses total
- [ ] 6th analysis shows "Upgrade to Pro" button
- [ ] Cannot create 6th analysis without upgrading

**Why important:** Validates entire free tier user journey.

---

### File: `tests/e2e/upgrade-flow.spec.ts`
**What it tests:** Payment upgrade experience

**Tests to write:**
- [ ] 🔥 User hits free limit and sees upgrade prompt
- [ ] 🔥 Clicks "Upgrade to Pro" button
- [ ] 🔥 Redirects to Stripe checkout
- [ ] 🔥 Completes payment with test card (4242...)
- [ ] 🔥 Redirects back to dashboard
- [ ] 🔥 Can now create 6th analysis successfully
- [ ] Dashboard shows "Pro" status

**Why critical:** This is your revenue flow - must work perfectly.

**Example test:**
```typescript
test('user can upgrade and get unlimited analyses', async () => {
  // 1. Signup and create 5 analyses
  await page.goto('/auth/signup');
  await signupUser('test@example.com');

  for (let i = 0; i < 5; i++) {
    await createAnalysis();
  }

  // 2. See upgrade prompt
  await expect(page.locator('text=Upgrade to Pro')).toBeVisible();

  // 3. Complete Stripe checkout
  await page.click('text=Upgrade to Pro');
  await fillStripeTestCard();
  await page.click('text=Pay $29');

  // 4. Verify unlimited access
  await expect(page).toHaveURL('/dashboard?payment=success');
  await createAnalysis(); // 6th analysis works
});
```

---

### File: `tests/e2e/auth.spec.ts`
**What it tests:** Authentication flows

**Tests to write:**
- [ ] User can signup with valid email/password
- [ ] Cannot signup with duplicate email
- [ ] User can login with correct credentials
- [ ] Cannot login with wrong password
- [ ] User stays logged in after page refresh
- [ ] User can logout successfully
- [ ] Dashboard redirects to login if not authenticated

---

### File: `tests/e2e/data-isolation.spec.ts`
**What it tests:** Security - users cannot access each other's data

**Tests to write:**
- [ ] 🔒 User A cannot see User B's creatives
- [ ] 🔒 User A cannot analyze User B's ads
- [ ] 🔒 Direct URL access to other user's data returns 404
- [ ] 🔒 API requests with other user's ID are rejected

**Why critical:** Data isolation bug = security breach.

---

## Test Execution Commands

```bash
# Run all unit tests
npm run test:unit

# Run all integration tests
npm run test:integration

# Run all e2e tests
npm run test:e2e

# Run all tests
npm test

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

---

## Success Criteria

Before considering testing "done":
- [ ] 80%+ code coverage on critical paths (payment, auth, analysis)
- [ ] All Priority 1 & 2 tests passing
- [ ] CI/CD runs tests on every PR
- [ ] Tests run in under 2 minutes
- [ ] Zero flaky tests (intermittent failures)

---

## Estimated Effort

| Phase | Time | Priority |
|-------|------|----------|
| Setup (Vitest, Playwright, MSW) | 2-3 hours | 🔥 |
| Unit tests (AI analysis) | 3-4 hours | ⭐ |
| Integration tests (API routes) | 6-8 hours | 🔥 |
| E2E tests (user journeys) | 6-8 hours | 🔥 |
| CI/CD setup | 2 hours | ⭐ |
| **Total** | **19-25 hours** | - |

---

## Next Steps

1. ✅ **Start with tutorial:** Walk through first unit test for mock AI
2. Install Vitest and create basic config
3. Write and run first test
4. Build confidence with testing pattern
5. Expand to integration and E2E tests

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)
- [MSW Documentation](https://mswjs.io/)
