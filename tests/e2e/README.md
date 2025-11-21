# E2E Tests for Google Ads Integration

End-to-end tests for the complete Google Ads integration user flows using Playwright.

## Overview

These tests validate the complete user journey from account connection through ad import and viewing. All tests use mocked Google APIs to avoid real API calls during testing.

## Test Files

### 1. `google-connect-import.spec.ts`
Tests the complete connection and import flow:
- ✅ User signup
- ✅ Navigate to import page
- ✅ Connect Google Ads via OAuth
- ✅ Import ads from Google
- ✅ View imported ads in dashboard
- ✅ Handle empty ad accounts
- ✅ Update existing ads on re-import

**Coverage:** Requirements 1.1, 2.1, 4.1, 4.2

### 2. `google-disconnect-reconnect.spec.ts`
Tests disconnect and reconnect functionality:
- ✅ Disconnect Google Ads account
- ✅ Verify credentials are cleared
- ✅ Reconnect Google Ads account
- ✅ Verify reconnection works
- ✅ Preserve imported ads after disconnect
- ✅ Handle multiple disconnect-reconnect cycles

**Coverage:** Requirements 1.2, 6.1

### 3. `google-import-filters.spec.ts`
Tests import filtering options:
- ✅ Filter by campaign status (ENABLED, PAUSED, ALL)
- ✅ Filter by date range
- ✅ Combine multiple filters
- ✅ Handle invalid date ranges
- ✅ Handle no ads matching filters

**Coverage:** Requirement 2.3

## ⚠️ IMPORTANT: Prerequisites

**These E2E tests require a configured Supabase instance for authentication.**

The tests will **fail** if Supabase is not configured because they:
- Create test users via Supabase Auth
- Perform real signup/login operations
- Store data in Supabase database

### Options to Run Tests:

1. **Local Supabase (Recommended)**
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Initialize and start local Supabase
   supabase init
   supabase start
   ```

2. **Test Supabase Project**
   - Create a dedicated test project on [Supabase Cloud](https://supabase.com)
   - Use test project credentials in `.env.test`

3. **Mock Authentication** (Future Enhancement)
   - Add Supabase auth mocking to helpers
   - Run tests without real backend

## Setup

### 1. Install Playwright browsers
```bash
npm run playwright:install
```

### 2. Configure Supabase (REQUIRED)
Set up either local or cloud Supabase instance and configure `.env.test`:
```bash
# Update these with your actual Supabase instance
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321  # Or your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key      # Real anon key required
SUPABASE_SERVICE_ROLE_KEY=your-service-key       # Real service key required

# Google Ads test config
GOOGLE_ADS_CLIENT_ID=test-client-id
GOOGLE_ADS_CLIENT_SECRET=test-client-secret
GOOGLE_TEST_CUSTOMER_ID=1234567890
```

### 3. Start your development server
The tests will automatically start the dev server, or you can run it manually:
```bash
npm run dev
```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests with UI mode (recommended for development)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test google-connect-import.spec.ts
```

### Run specific test by name
```bash
npx playwright test -g "should connect Google Ads"
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Architecture

### Mocking Strategy

All E2E tests use **mocked external APIs** to ensure:
- ✅ Tests run without real Google credentials
- ✅ Tests are fast and reliable
- ✅ No external dependencies
- ✅ No API rate limits

### Mocked APIs

1. **Google OAuth**
   - `https://accounts.google.com/o/oauth2/v2/auth` - OAuth consent screen
   - `https://oauth2.googleapis.com/token` - Token exchange

2. **Google Ads API**
   - `https://googleads.googleapis.com/v*/customers:listAccessibleCustomers`
   - `https://googleads.googleapis.com/v*/customers/*/googleAds:search`

3. **Application APIs**
   - `/api/google/connect` - OAuth callback
   - `/api/google/import-ads` - Ad import
   - `/api/google/disconnect` - Disconnect account

### Helper Functions

Located in `tests/e2e/helpers.ts`:

- `signupTestUser()` - Create test user account
- `loginUser()` - Login with credentials
- `mockGoogleOAuthSuccess()` - Mock successful OAuth flow
- `mockGoogleAdsImport()` - Mock ad import
- `mockGoogleAdsImportWithFilters()` - Mock filtered import
- `mockGoogleAdsDisconnect()` - Mock account disconnect
- `verifyImportResults()` - Verify import success message
- `verifyAdsInDashboard()` - Verify ads appear in UI
- `navigateToImportPage()` - Navigate to import page
- `clickConnectGoogleAds()` - Click connect button
- `clickImportAdsFromGoogle()` - Click import button

### Test Fixtures

Tests use fixtures from `tests/fixtures/google/`:
- `customers.json` - Mock customer account data
- `ads.json` - Mock ad data with various performance levels
- `metrics.json` - Mock performance metrics
- `errors.json` - Mock error responses

## Best Practices

### Writing New Tests

1. **Use helper functions** for common operations:
   ```typescript
   await signupTestUser(page);
   await navigateToImportPage(page);
   await mockGoogleOAuthSuccess(page);
   ```

2. **Mock external APIs** before testing:
   ```typescript
   await mockGoogleOAuthSuccess(page);
   await mockGoogleAdsImport(page);
   ```

3. **Verify state changes** after actions:
   ```typescript
   await clickConnectGoogleAds(page);
   await verifyGoogleAdsConnected(page);
   ```

4. **Use appropriate timeouts** for async operations:
   ```typescript
   await page.waitForURL('/dashboard', { timeout: 10000 });
   ```

5. **Clean up test data** (if using real database):
   ```typescript
   test.afterEach(async () => {
     // Clean up test user data
   });
   ```

### Debugging Failing Tests

1. **Run in headed mode** to see what's happening:
   ```bash
   npm run test:e2e:headed
   ```

2. **Use debug mode** for step-by-step debugging:
   ```bash
   npm run test:e2e:debug
   ```

3. **Check screenshots** in `test-results/` folder after failures

4. **Check videos** in `test-results/` for failed tests

5. **Use page.pause()** to pause test execution:
   ```typescript
   await page.pause(); // Opens Playwright Inspector
   ```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Coverage

Current test scenarios:

| Scenario | Test File | Status |
|----------|-----------|--------|
| Connect Google Ads | google-connect-import.spec.ts | ✅ |
| Import ads successfully | google-connect-import.spec.ts | ✅ |
| View imported ads in dashboard | google-connect-import.spec.ts | ✅ |
| Handle empty ad accounts | google-connect-import.spec.ts | ✅ |
| Update existing ads | google-connect-import.spec.ts | ✅ |
| Disconnect account | google-disconnect-reconnect.spec.ts | ✅ |
| Reconnect account | google-disconnect-reconnect.spec.ts | ✅ |
| Preserve ads after disconnect | google-disconnect-reconnect.spec.ts | ✅ |
| Multiple disconnect cycles | google-disconnect-reconnect.spec.ts | ✅ |
| Filter by campaign status | google-import-filters.spec.ts | ✅ |
| Filter by date range | google-import-filters.spec.ts | ✅ |
| Combine filters | google-import-filters.spec.ts | ✅ |
| Handle invalid filters | google-import-filters.spec.ts | ✅ |
| No ads matching filters | google-import-filters.spec.ts | ✅ |

## Known Issues

### ⚠️ All Tests Failing with Authentication Timeout

**Status:** Expected behavior without Supabase configured

**Symptoms:**
```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
waiting for navigation to "/dashboard" until "load"
```

**Cause:** Tests require a real Supabase instance for user authentication. Without it, signup/login operations fail and tests timeout.

**Resolution:** Configure Supabase as described in the Setup section above.

## Future Improvements

1. Add tests for multiple account selection
2. Add tests for manager account hierarchy
3. Add tests for API error scenarios (rate limits, timeouts)
4. Add tests for concurrent imports
5. Add visual regression testing
6. Add accessibility testing

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test Fixtures](https://playwright.dev/docs/test-fixtures)
- [Playwright Debugging](https://playwright.dev/docs/debug)
