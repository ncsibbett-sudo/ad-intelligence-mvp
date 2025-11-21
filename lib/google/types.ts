/**
 * Google Ads API Type Definitions
 * Types for Google Ads integration, OAuth, and API responses
 */

/**
 * Configuration for GoogleAdsClient
 */
export interface GoogleAdsClientConfig {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
}

/**
 * Google Ads Customer Account
 */
export interface GoogleCustomerAccount {
  customerId: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
}

/**
 * Google Ad Data (mapped from API response)
 */
export interface GoogleAdData {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  adGroupId: string;
  adGroupName: string;
  status: string;
  type: string;
  finalUrls: string[];
  displayUrl: string;
  headlines: string[];
  descriptions: string[];
  metrics: GoogleAdMetrics;
}

/**
 * Google Ads Performance Metrics
 */
export interface GoogleAdMetrics {
  impressions: number;
  clicks: number;
  cost: number; // in micros (divide by 1,000,000 to get currency units)
  conversions: number;
  ctr: number;
  averageCpc: number; // in micros (divide by 1,000,000 to get currency units)
}

/**
 * Options for retrieving ads
 */
export interface GetAdsOptions {
  campaignStatus?: 'ENABLED' | 'PAUSED' | 'REMOVED' | 'ALL';
  dateRangeStart?: string; // YYYY-MM-DD format
  dateRangeEnd?: string; // YYYY-MM-DD format
  limit?: number;
}

/**
 * Google OAuth credentials stored in database
 */
export interface GoogleCredentials {
  refreshToken: string;
  accessToken?: string;
  tokenExpiresAt?: Date;
  customerId: string;
  accountName?: string;
}

/**
 * Google OAuth token response
 */
export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Request body for ad import endpoint
 */
export interface ImportAdsRequest {
  dateRangeStart?: string;
  dateRangeEnd?: string;
  campaignStatus?: string;
}

/**
 * Response from ad import endpoint
 */
export interface ImportAdsResponse {
  success: boolean;
  totalAds: number;
  importedAds: number;
  updatedAds: number;
  skippedAds: number;
  errors: string[];
}
