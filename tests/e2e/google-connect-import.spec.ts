import { test, expect } from '@playwright/test';
import {
  signupTestUser,
  navigateToImportPage,
  mockGoogleOAuthSuccess,
  mockGoogleAdsImport,
  clickConnectGoogleAds,
  verifyGoogleAdsConnected,
  clickImportAdsFromGoogle,
  verifyImportResults,
  verifyAdsInDashboard
} from './helpers';

/**
 * E2E Test: Google Ads Connect → Import → View Flow
 *
 * Tests the complete user journey:
 * 1. User signs up
 * 2. Navigates to import page
 * 3. Connects Google Ads account via OAuth
 * 4. Imports ads from Google
 * 5. Views imported ads in dashboard
 *
 * Requirements tested: 1.1, 2.1, 4.1, 4.2
 */

test.describe('Google Ads Connect and Import Flow', () => {
  test('should connect Google Ads, import ads, and display them in dashboard', async ({ page }) => {
    // Step 1: Sign up new test user
    const { email } = await signupTestUser(page);
    console.log(`Test user created: ${email}`);

    // Verify we're on the dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1:has-text("Ad Intelligence")')).toBeVisible();

    // Step 2: Navigate to import page
    await navigateToImportPage(page);

    // Verify import page loaded
    await expect(page.locator('h1:has-text("Import Your Ads")')).toBeVisible();
    await expect(page.locator('button:has-text("Connect Google Ads")')).toBeVisible();

    // Step 3: Set up Google OAuth and API mocks
    await mockGoogleOAuthSuccess(page);
    await mockGoogleAdsImport(page);

    // Step 4: Connect Google Ads account
    await clickConnectGoogleAds(page);

    // Wait for OAuth redirect and connection success
    // The mock will automatically handle the OAuth flow
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Step 5: Verify connection success message
    await verifyGoogleAdsConnected(page);

    // Step 6: Import ads from Google
    await clickImportAdsFromGoogle(page);

    // Wait for import to start
    await expect(page.locator('button:has-text("Importing...")')).toBeVisible();

    // Step 7: Verify import results
    await verifyImportResults(page, {
      totalAds: 3,
      importedAds: 2, // 2 ENABLED ads
      updatedAds: 0
    });

    // Step 8: Wait for automatic redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Step 9: Verify ads appear in dashboard
    await verifyAdsInDashboard(page, 2);

    // Verify that ads are visible with correct content
    await expect(page.locator('text=My Ad')).toBeVisible();
    await expect(page.locator('text=Analyze Now')).toBeVisible();
  });

  test('should show error when connecting Google Ads without proper OAuth flow', async ({ page }) => {
    // Sign up
    await signupTestUser(page);

    // Navigate to import page
    await navigateToImportPage(page);

    // Try to import without connecting first (no OAuth mock)
    await page.route('**/api/google/import-ads', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Google Ads account not connected',
          requiresConnection: true
        })
      });
    });

    // Try to import without connecting
    // Note: The UI should prevent this, but let's test the API response
    const response = await page.request.post('/api/google/import-ads', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {}
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.requiresConnection).toBe(true);
  });

  test('should handle empty ad accounts gracefully', async ({ page }) => {
    // Sign up
    await signupTestUser(page);

    // Navigate to import page
    await navigateToImportPage(page);

    // Mock OAuth success
    await mockGoogleOAuthSuccess(page);

    // Mock import with no ads
    await page.route('**/api/google/import-ads', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAds: 0,
          importedAds: 0,
          updatedAds: 0,
          skippedAds: 0,
          errors: []
        })
      });
    });

    // Connect and import
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });
    await clickImportAdsFromGoogle(page);

    // Verify results show 0 ads
    await verifyImportResults(page, {
      totalAds: 0,
      importedAds: 0,
      updatedAds: 0
    });

    // Should still redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Dashboard should show "No creatives yet" message
    await expect(page.locator('text=No creatives yet')).toBeVisible();
  });

  test('should update existing ads on re-import', async ({ page }) => {
    // Sign up
    await signupTestUser(page);

    // Navigate to import page
    await navigateToImportPage(page);

    // Mock OAuth and first import
    await mockGoogleOAuthSuccess(page);
    await mockGoogleAdsImport(page);

    // First import
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });
    await clickImportAdsFromGoogle(page);

    // Wait for first import to complete
    await verifyImportResults(page, { importedAds: 2 });
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Go back to import and import again
    await navigateToImportPage(page);

    // Mock second import with updates
    await page.route('**/api/google/import-ads', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAds: 3,
          importedAds: 0,
          updatedAds: 2, // Ads were updated instead of imported
          skippedAds: 1,
          errors: []
        })
      });
    });

    await clickImportAdsFromGoogle(page);

    // Verify update results
    await verifyImportResults(page, {
      totalAds: 3,
      importedAds: 0,
      updatedAds: 2
    });
  });
});
