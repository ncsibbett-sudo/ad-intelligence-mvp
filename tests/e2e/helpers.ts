import { Page, expect } from '@playwright/test';
import { multipleAds } from '../fixtures/google/ads.json';
import { singleAccount } from '../fixtures/google/customers.json';

/**
 * E2E Test Helper Functions
 * Common utilities for Google Ads integration E2E tests
 */

/**
 * Sign up a new test user
 */
export async function signupTestUser(
  page: Page,
  email: string = `test-${Date.now()}@example.com`,
  password: string = 'TestPassword123!'
) {
  await page.goto('/auth/signup');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });

  return { email, password };
}

/**
 * Login with existing credentials
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/auth/login');

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Mock Google OAuth flow
 * Intercepts the OAuth redirect and simulates successful connection
 */
export async function mockGoogleOAuthSuccess(page: Page) {
  // Intercept the Google OAuth URL and redirect back with auth code
  await page.route('https://accounts.google.com/o/oauth2/v2/auth*', async (route) => {
    const url = new URL(route.request().url());
    const redirectUri = url.searchParams.get('redirect_uri');

    // Simulate user granting permissions and Google redirecting back
    const authCode = `test-auth-code-${Date.now()}`;
    await route.fulfill({
      status: 302,
      headers: {
        'Location': `${redirectUri}?code=${authCode}`
      }
    });
  });

  // Mock the token exchange endpoint
  await page.route('https://oauth2.googleapis.com/token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: 'https://www.googleapis.com/auth/adwords'
      })
    });
  });

  // Mock get accessible customers endpoint
  await page.route('https://googleads.googleapis.com/v*/customers:listAccessibleCustomers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        resourceNames: [`customers/${singleAccount.customerId}`]
      })
    });
  });

  // Mock get customer info endpoint
  await page.route('https://googleads.googleapis.com/v*/customers/*/googleAds:search*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [{
          customer: {
            resourceName: `customers/${singleAccount.customerId}`,
            id: singleAccount.customerId,
            descriptiveName: singleAccount.descriptiveName,
            currencyCode: singleAccount.currencyCode,
            timeZone: singleAccount.timeZone
          }
        }]
      })
    });
  });
}

/**
 * Mock Google Ads import API
 * Simulates successful ad import with mock data
 */
export async function mockGoogleAdsImport(page: Page, ads = multipleAds) {
  await page.route('**/api/google/import-ads', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAds: ads.length,
          importedAds: ads.filter((ad: any) => ad.status === 'ENABLED').length,
          updatedAds: 0,
          skippedAds: ads.filter((ad: any) => ad.status !== 'ENABLED').length,
          errors: []
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock Google Ads import with filters
 */
export async function mockGoogleAdsImportWithFilters(
  page: Page,
  expectedFilters: { campaignStatus?: string; dateRangeStart?: string; dateRangeEnd?: string }
) {
  await page.route('**/api/google/import-ads', async (route) => {
    if (route.request().method() === 'POST') {
      const requestBody = JSON.parse(route.request().postData() || '{}');

      // Verify filters were sent
      if (expectedFilters.campaignStatus) {
        expect(requestBody.campaignStatus).toBe(expectedFilters.campaignStatus);
      }

      // Return filtered results
      const filteredAds = multipleAds.filter((ad: any) => {
        if (expectedFilters.campaignStatus === 'ENABLED') {
          return ad.status === 'ENABLED';
        }
        return true;
      });

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAds: filteredAds.length,
          importedAds: filteredAds.length,
          updatedAds: 0,
          skippedAds: 0,
          errors: []
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Mock Google Ads disconnect API
 */
export async function mockGoogleAdsDisconnect(page: Page) {
  await page.route('**/api/google/disconnect', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Google Ads account disconnected successfully'
        })
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Wait for and verify import results are displayed
 */
export async function verifyImportResults(
  page: Page,
  expectedResults: { totalAds?: number; importedAds?: number; updatedAds?: number }
) {
  // Wait for success message
  await expect(page.locator('text=Import Complete!')).toBeVisible({ timeout: 10000 });

  // Verify the counts
  if (expectedResults.totalAds !== undefined) {
    await expect(page.locator(`text=Total ads: ${expectedResults.totalAds}`)).toBeVisible();
  }
  if (expectedResults.importedAds !== undefined) {
    await expect(page.locator(`text=Imported: ${expectedResults.importedAds}`)).toBeVisible();
  }
  if (expectedResults.updatedAds !== undefined) {
    await expect(page.locator(`text=Updated: ${expectedResults.updatedAds}`)).toBeVisible();
  }
}

/**
 * Verify ads appear in dashboard
 */
export async function verifyAdsInDashboard(page: Page, minAdsExpected: number = 1) {
  await page.goto('/dashboard');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Check that creatives are displayed
  const creativeCards = page.locator('[class*="border rounded-lg p-4"]');
  const count = await creativeCards.count();

  expect(count).toBeGreaterThanOrEqual(minAdsExpected);
}

/**
 * Navigate to import page
 */
export async function navigateToImportPage(page: Page) {
  await page.goto('/dashboard');
  await page.click('text=Import Your Ads');
  await expect(page).toHaveURL('/dashboard/import');
}

/**
 * Click "Connect Google Ads" button
 */
export async function clickConnectGoogleAds(page: Page) {
  await page.click('button:has-text("Connect Google Ads")');
}

/**
 * Click "Import Ads from Google" button
 */
export async function clickImportAdsFromGoogle(page: Page) {
  await page.click('button:has-text("Import Ads from Google")');
}

/**
 * Verify Google Ads is connected
 */
export async function verifyGoogleAdsConnected(page: Page) {
  await expect(page.locator('text=Google Ads account connected successfully!')).toBeVisible();
  await expect(page.locator('button:has-text("Import Ads from Google")')).toBeVisible();
}

/**
 * Verify Google Ads is disconnected
 */
export async function verifyGoogleAdsDisconnected(page: Page) {
  await expect(page.locator('button:has-text("Connect Google Ads")')).toBeVisible();
  await expect(page.locator('text=Google Ads account connected successfully!')).not.toBeVisible();
}
