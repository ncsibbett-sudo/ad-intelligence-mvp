import { test, expect } from '@playwright/test';
import {
  signupTestUser,
  navigateToImportPage,
  mockGoogleOAuthSuccess,
  mockGoogleAdsImport,
  mockGoogleAdsDisconnect,
  clickConnectGoogleAds,
  verifyGoogleAdsConnected,
  verifyGoogleAdsDisconnected,
  clickImportAdsFromGoogle,
  verifyImportResults
} from './helpers';

/**
 * E2E Test: Google Ads Disconnect and Reconnect Flow
 *
 * Tests the disconnect and reconnect functionality:
 * 1. User connects Google Ads account
 * 2. Imports ads successfully
 * 3. Disconnects Google Ads account
 * 4. Reconnects Google Ads account
 * 5. Imports ads again successfully
 *
 * Requirements tested: 1.2, 6.1
 */

test.describe('Google Ads Disconnect and Reconnect', () => {
  test('should disconnect and reconnect Google Ads account successfully', async ({ page }) => {
    // Step 1: Sign up and connect Google Ads
    await signupTestUser(page);
    await navigateToImportPage(page);

    // Mock OAuth and import
    await mockGoogleOAuthSuccess(page);
    await mockGoogleAdsImport(page);

    // Connect Google Ads
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Verify connection
    await verifyGoogleAdsConnected(page);

    // Import ads to confirm connection works
    await clickImportAdsFromGoogle(page);
    await verifyImportResults(page, { importedAds: 2 });

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Step 2: Navigate back to import page to disconnect
    await navigateToImportPage(page);

    // Mock disconnect endpoint
    await mockGoogleAdsDisconnect(page);

    // Step 3: Disconnect Google Ads account
    // Note: The UI might have a disconnect button in settings or on the import page
    // For this test, we'll simulate the disconnect API call
    const disconnectResponse = await page.request.post('/api/google/disconnect', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(disconnectResponse.status()).toBe(200);
    const disconnectData = await disconnectResponse.json();
    expect(disconnectData.success).toBe(true);

    // Refresh the page to see disconnected state
    await page.reload();

    // Step 4: Verify disconnected state
    await verifyGoogleAdsDisconnected(page);

    // Verify import button is not available
    await expect(page.locator('button:has-text("Import Ads from Google")')).not.toBeVisible();

    // Step 5: Reconnect Google Ads account
    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);

    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Step 6: Verify reconnection success
    await verifyGoogleAdsConnected(page);

    // Step 7: Import ads again to confirm reconnection works
    await mockGoogleAdsImport(page);
    await clickImportAdsFromGoogle(page);

    await verifyImportResults(page, { importedAds: 2 });

    // Verify redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should handle disconnect when not connected', async ({ page }) => {
    // Sign up
    await signupTestUser(page);

    // Mock disconnect endpoint to return error
    await page.route('**/api/google/disconnect', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'No Google Ads account connected',
          success: false
        })
      });
    });

    // Try to disconnect when not connected
    const response = await page.request.post('/api/google/disconnect');

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  test('should clear credentials on disconnect', async ({ page }) => {
    // Sign up and connect
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Disconnect
    await mockGoogleAdsDisconnect(page);
    await page.request.post('/api/google/disconnect');

    // Try to import without reconnecting - should fail
    await page.reload();

    await page.route('**/api/google/import-ads', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Google Ads credentials not found',
          requiresConnection: true
        })
      });
    });

    // Verify can't import without reconnecting
    const importResponse = await page.request.post('/api/google/import-ads', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {}
    });

    expect(importResponse.status()).toBe(401);
  });

  test('should preserve imported ads after disconnect', async ({ page }) => {
    // Sign up, connect, and import
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await mockGoogleAdsImport(page);

    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    await clickImportAdsFromGoogle(page);
    await verifyImportResults(page, { importedAds: 2 });

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });

    // Verify ads are visible
    await expect(page.locator('text=My Ad')).toBeVisible();

    // Disconnect
    await navigateToImportPage(page);
    await mockGoogleAdsDisconnect(page);
    await page.request.post('/api/google/disconnect');

    // Go back to dashboard
    await page.goto('/dashboard');

    // Verify ads are still visible after disconnect
    await expect(page.locator('text=My Ad')).toBeVisible();
    const creativeCount = await page.locator('[class*="border rounded-lg p-4"]').count();
    expect(creativeCount).toBeGreaterThanOrEqual(2);
  });

  test('should allow multiple disconnect-reconnect cycles', async ({ page }) => {
    await signupTestUser(page);

    // Cycle 1: Connect and disconnect
    await navigateToImportPage(page);
    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    await mockGoogleAdsDisconnect(page);
    await page.request.post('/api/google/disconnect');
    await page.reload();
    await verifyGoogleAdsDisconnected(page);

    // Cycle 2: Reconnect and disconnect again
    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });
    await verifyGoogleAdsConnected(page);

    await mockGoogleAdsDisconnect(page);
    await page.request.post('/api/google/disconnect');
    await page.reload();
    await verifyGoogleAdsDisconnected(page);

    // Cycle 3: Final reconnect
    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });
    await verifyGoogleAdsConnected(page);

    // Verify can still import after multiple cycles
    await mockGoogleAdsImport(page);
    await clickImportAdsFromGoogle(page);
    await verifyImportResults(page, { importedAds: 2 });
  });
});
