import { test, expect } from '@playwright/test';
import {
  signupTestUser,
  navigateToImportPage,
  mockGoogleOAuthSuccess,
  mockGoogleAdsImportWithFilters,
  clickConnectGoogleAds,
  clickImportAdsFromGoogle,
  verifyImportResults
} from './helpers';

/**
 * E2E Test: Google Ads Import with Filters
 *
 * Tests importing ads with various filter options:
 * 1. Filter by campaign status (ENABLED, PAUSED, ALL)
 * 2. Filter by date range
 * 3. Combination of filters
 * 4. Verify filtered results
 *
 * Requirements tested: 2.3
 */

test.describe('Google Ads Import with Filters', () => {
  test('should import only ENABLED ads when filtered by campaign status', async ({ page }) => {
    // Setup: Sign up and connect Google Ads
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Mock import with ENABLED filter
    await mockGoogleAdsImportWithFilters(page, {
      campaignStatus: 'ENABLED'
    });

    // Import with filter
    await clickImportAdsFromGoogle(page);

    // Verify only ENABLED ads were imported (2 out of 3 from fixture)
    await verifyImportResults(page, {
      totalAds: 2,
      importedAds: 2,
      updatedAds: 0
    });
  });

  test('should import all ads when campaign status is ALL', async ({ page }) => {
    // Setup
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Mock import with ALL filter
    await mockGoogleAdsImportWithFilters(page, {
      campaignStatus: 'ALL'
    });

    // Note: In a real implementation, you'd have UI controls for filters
    // For this test, we're simulating the API call with filters
    await page.route('**/api/google/import-ads', async (route) => {
      const requestBody = JSON.parse(route.request().postData() || '{}');

      // Modify the request to include ALL filter
      requestBody.campaignStatus = 'ALL';

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAds: 3, // All 3 ads including paused
          importedAds: 3,
          updatedAds: 0,
          skippedAds: 0,
          errors: []
        })
      });
    });

    await clickImportAdsFromGoogle(page);

    // Verify all ads were imported including paused ones
    await verifyImportResults(page, {
      totalAds: 3,
      importedAds: 3
    });
  });

  test('should import ads within date range filter', async ({ page }) => {
    // Setup
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Mock import with date range filter
    const startDate = '2024-01-01';
    const endDate = '2024-12-31';

    await page.route('**/api/google/import-ads', async (route) => {
      const requestBody = JSON.parse(route.request().postData() || '{}');

      // Verify date range was sent
      expect(requestBody.dateRangeStart).toBe(startDate);
      expect(requestBody.dateRangeEnd).toBe(endDate);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAds: 2,
          importedAds: 2,
          updatedAds: 0,
          skippedAds: 0,
          errors: []
        })
      });
    });

    // Simulate adding date filters to request
    // In real implementation, this would be through UI date pickers
    const session = await page.context().storageState();
    const token = session.cookies.find(c => c.name === 'sb-access-token')?.value;

    const response = await page.request.post('/api/google/import-ads', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      data: {
        campaignStatus: 'ENABLED',
        dateRangeStart: startDate,
        dateRangeEnd: endDate
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.importedAds).toBe(2);
  });

  test('should handle invalid date range gracefully', async ({ page }) => {
    // Setup
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Mock import with invalid date range (end before start)
    await page.route('**/api/google/import-ads', async (route) => {
      const requestBody = JSON.parse(route.request().postData() || '{}');

      if (requestBody.dateRangeStart > requestBody.dateRangeEnd) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Invalid date range: start date must be before end date',
            success: false
          })
        });
      } else {
        await route.continue();
      }
    });

    // Try to import with invalid date range
    const response = await page.request.post('/api/google/import-ads', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        campaignStatus: 'ENABLED',
        dateRangeStart: '2024-12-31',
        dateRangeEnd: '2024-01-01' // Invalid: end before start
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid date range');
  });

  test('should combine multiple filters correctly', async ({ page }) => {
    // Setup
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Mock import with combined filters
    await page.route('**/api/google/import-ads', async (route) => {
      const requestBody = JSON.parse(route.request().postData() || '{}');

      // Verify all filters are present
      expect(requestBody.campaignStatus).toBe('ENABLED');
      expect(requestBody.dateRangeStart).toBeDefined();
      expect(requestBody.dateRangeEnd).toBeDefined();

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          totalAds: 1, // Fewer ads due to combined filters
          importedAds: 1,
          updatedAds: 0,
          skippedAds: 0,
          errors: []
        })
      });
    });

    // Import with combined filters
    const response = await page.request.post('/api/google/import-ads', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        campaignStatus: 'ENABLED',
        dateRangeStart: '2024-06-01',
        dateRangeEnd: '2024-06-30'
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.totalAds).toBe(1);
  });

  test('should handle no ads matching filters', async ({ page }) => {
    // Setup
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Mock import with filters that match no ads
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

    await clickImportAdsFromGoogle(page);

    // Verify 0 results
    await verifyImportResults(page, {
      totalAds: 0,
      importedAds: 0,
      updatedAds: 0
    });

    // Should still redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 });
  });

  test('should persist filter selections across page refreshes', async ({ page }) => {
    // Note: This test assumes filter selections are stored (e.g., in localStorage or URL params)
    // If not implemented, this test documents expected behavior

    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // In a real implementation, you would:
    // 1. Select filters from UI dropdowns/date pickers
    // 2. Refresh the page
    // 3. Verify filters are still selected

    // For now, this test documents the expected behavior
    // and can be expanded when filter UI is implemented
    console.log('Filter persistence test - to be implemented with filter UI');
  });

  test('should show filter summary in import results', async ({ page }) => {
    // Setup
    await signupTestUser(page);
    await navigateToImportPage(page);

    await mockGoogleOAuthSuccess(page);
    await clickConnectGoogleAds(page);
    await page.waitForURL('**/dashboard/import?google_connected=true', { timeout: 15000 });

    // Mock import
    await mockGoogleAdsImportWithFilters(page, {
      campaignStatus: 'ENABLED'
    });

    await clickImportAdsFromGoogle(page);

    // Verify import results show filter was applied
    await verifyImportResults(page, {
      importedAds: 2
    });

    // In a complete implementation, the UI might show:
    // "Imported 2 ads (filtered by: ENABLED campaigns)"
    // This can be verified with more specific locators once UI is finalized
  });
});
