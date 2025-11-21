# Google Ads Test Fixtures

This directory contains mock data for testing Google Ads integration without making real API calls.

## Files

### `customers.json`
Contains sample Google Ads customer account data for testing various scenarios:

- **singleAccount**: Standard single account for basic tests
- **multipleAccounts**: Array of 3 accounts for testing multi-account scenarios
- **managerAccount**: Manager account for testing hierarchy
- **emptyAccount**: Account with minimal data for edge case testing

**Usage:**
```typescript
import { singleAccount } from '@/tests/fixtures/google/customers.json';

test('should handle single account', () => {
  const result = processCustomerAccount(singleAccount);
  expect(result.customerId).toBe('1234567890');
});
```

### `ads.json`
Contains sample Google Ads ad data with various performance levels:

- **responsiveSearchAd**: Standard ad with moderate performance
- **highPerformanceAd**: Ad with excellent metrics (high CTR, conversions)
- **lowPerformanceAd**: Ad with poor metrics (low CTR, conversions)
- **pausedAd**: Ad with PAUSED status
- **adWithoutMetrics**: New ad with zero metrics (just launched)
- **multipleAds**: Array of 3 ads for batch import testing

**Usage:**
```typescript
import { responsiveSearchAd } from '@/tests/fixtures/google/ads.json';

test('should import responsive search ad', () => {
  const creative = mapGoogleAdToCreative(responsiveSearchAd);
  expect(creative.ad_copy).toContain('50% Off Summer Sale');
});
```

### `metrics.json`
Contains isolated performance metrics for testing metric calculations:

- **excellentPerformance**: Very high performing metrics (8.5% CTR)
- **goodPerformance**: Above average metrics (5% CTR)
- **averagePerformance**: Average metrics (3% CTR)
- **poorPerformance**: Below average metrics (1% CTR)
- **noSpend**: Impressions but no spend
- **highCostLowConversion**: High CPC, low conversion rate
- **lowCostHighConversion**: Low CPC, high conversion rate
- **zeroMetrics**: All zeros for new/inactive ads
- **microConversion**: Partial conversions (0.5)
- **highImpressionLowClick**: Very low CTR scenario

**Usage:**
```typescript
import { excellentPerformance } from '@/tests/fixtures/google/metrics.json';

test('should calculate correct CPC from micros', () => {
  const cpc = excellentPerformance.averageCpc / 1_000_000;
  expect(cpc).toBe(1.50); // $1.50
});
```

### `errors.json`
Contains Google Ads API error responses for testing error handling:

- **authenticationError** (401): Invalid/expired access token
- **invalidRefreshToken** (400): Expired refresh token
- **rateLimitError** (429): API quota exceeded
- **permissionDeniedError** (403): No access to customer account
- **invalidCustomerIdError** (400): Invalid customer ID
- **invalidOAuthCode** (400): Invalid OAuth authorization code
- **developerTokenError** (403): Developer token not approved
- **serviceUnavailableError** (503): API temporarily down
- **internalServerError** (500): Unexpected server error
- **badGatewayError** (502): Connection error
- **timeoutError** (504): Request timeout
- **invalidDateRangeError** (400): Invalid date range
- **queryTooComplexError** (400): GAQL query too complex
- **customerNotFoundError** (404): Customer doesn't exist
- **missingRequiredScopesError** (403): Missing OAuth scopes
- **accountSuspendedError** (403): Account suspended

**Usage:**
```typescript
import { rateLimitError } from '@/tests/fixtures/google/errors.json';

test('should retry on rate limit error', async () => {
  mockGoogleAdsApi.mockRejectedValueOnce(rateLimitError);

  const result = await withRetry(() => fetchAds());
  expect(result).toBeDefined(); // Should succeed after retry
});
```

## Important Notes

### Metric Conversions
Google Ads returns costs in **micros** (1/1,000,000 of currency unit):
- To get dollars: `cost / 1_000_000`
- Example: `1245670000 micros = $1,245.67`

### Test Data Characteristics

**Good Test Data:**
- responsiveSearchAd: ~$1,245 spend, 5.78% CTR, $1.40 CPC
- highPerformanceAd: ~$4,568 spend, 7.01% CTR, $1.42 CPC

**Poor Test Data:**
- lowPerformanceAd: ~$128 spend, 1% CTR, $1.50 CPC

**Edge Cases:**
- adWithoutMetrics: All zeros (new ad)
- pausedAd: PAUSED status

## Testing Strategy

### Unit Tests
Use individual fixtures for isolated component testing:
```typescript
import { responsiveSearchAd } from '@/tests/fixtures/google/ads.json';

test('GoogleAdsClient.mapResponseToAdData', () => {
  const mapped = client.mapResponseToAdData([responsiveSearchAd]);
  expect(mapped[0].id).toBe('123456789');
});
```

### Integration Tests
Use multiple fixtures together for API route testing:
```typescript
import { singleAccount } from '@/tests/fixtures/google/customers.json';
import { multipleAds } from '@/tests/fixtures/google/ads.json';

test('POST /api/google/import-ads', async () => {
  mockGetCustomer.mockResolvedValue(singleAccount);
  mockGetAds.mockResolvedValue(multipleAds);

  const response = await POST('/api/google/import-ads', { body: {} });
  expect(response.importedAds).toBe(3);
});
```

### Error Handling Tests
Use error fixtures to test retry logic and error handling:
```typescript
import { rateLimitError, authenticationError } from '@/tests/fixtures/google/errors.json';

test('should retry on retryable errors', async () => {
  mockApi
    .mockRejectedValueOnce(rateLimitError)  // First attempt fails
    .mockResolvedValueOnce(ads);            // Second attempt succeeds

  const result = await importAds();
  expect(result.success).toBe(true);
});

test('should not retry on authentication errors', async () => {
  mockApi.mockRejectedValueOnce(authenticationError);

  await expect(importAds()).rejects.toThrow('UNAUTHENTICATED');
});
```

## Environment Variables

For running tests, use the values in `.env.test`:
```bash
GOOGLE_ADS_CLIENT_ID=test-client-id.apps.googleusercontent.com
GOOGLE_ADS_CLIENT_SECRET=test-client-secret
GOOGLE_ADS_DEVELOPER_TOKEN=test-developer-token
GOOGLE_TEST_REFRESH_TOKEN=test-refresh-token-1234567890
GOOGLE_TEST_CUSTOMER_ID=1234567890
```

## Mocking Google APIs

Use MSW (Mock Service Worker) to intercept API calls in tests:

```typescript
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { responsiveSearchAd } from '@/tests/fixtures/google/ads.json';

const server = setupServer(
  rest.post('https://googleads.googleapis.com/v17/*', (req, res, ctx) => {
    return res(ctx.json({ results: [responsiveSearchAd] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Adding New Fixtures

When adding new test scenarios:

1. Follow existing structure and naming conventions
2. Use realistic data that matches Google Ads API response format
3. Include both success and error cases
4. Document the fixture purpose in this README
5. Ensure costs are in micros (multiply dollars by 1,000,000)

## Reference

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [Google Ads Query Language (GAQL)](https://developers.google.com/google-ads/api/docs/query/overview)
- [Metrics Reference](https://developers.google.com/google-ads/api/reference/rpc/latest/Metrics)
