/**
 * Google Ads API Client
 * Handles authentication, customer account management, and ad data retrieval
 */

import axios, { AxiosError } from 'axios';
import {
  GoogleAdsClientConfig,
  GoogleCustomerAccount,
  GoogleAdData,
  GoogleAdMetrics,
  GetAdsOptions,
  GoogleTokenResponse,
} from './types';
import { GOOGLE_CONFIG } from '@/lib/constants';

/**
 * Retry configuration for API calls
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Check if an error is retryable (network issues, rate limits, server errors)
 */
function isRetryableError(error: any): boolean {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const retryableCodes = [429, 500, 502, 503, 504];
    return status ? retryableCodes.includes(status) : false;
  }
  return false;
}

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  let lastError: Error;
  let delay = config.initialDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (!isRetryableError(error) || attempt === config.maxRetries) {
        throw error;
      }

      console.warn(
        `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        error
      );

      await sleep(delay);
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError!;
}

/**
 * Google Ads API Client
 */
export class GoogleAdsClient {
  private config: GoogleAdsClientConfig;
  private accessToken: string | null = null;
  private customerId: string;

  constructor(config: GoogleAdsClientConfig, customerId: string) {
    this.config = config;
    this.customerId = customerId;
  }

  /**
   * Refresh the OAuth access token using the refresh token
   * Google access tokens expire after 1 hour
   */
  async refreshAccessToken(): Promise<string> {
    try {
      const response = await axios.post<GoogleTokenResponse>(
        GOOGLE_CONFIG.TOKEN_ENDPOINT,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.config.refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      return this.accessToken;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Ensure we have a valid access token
   */
  private async ensureAccessToken(): Promise<string> {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }
    return this.accessToken!;
  }

  /**
   * Get list of accessible customer accounts for the authenticated user
   */
  async getAccessibleCustomers(): Promise<GoogleCustomerAccount[]> {
    const accessToken = await this.ensureAccessToken();

    return withRetry(async () => {
      try {
        // First, get the list of accessible customer IDs
        const listResponse = await axios.get(
          `${GOOGLE_CONFIG.ADS_API_ENDPOINT}/v17/customers:listAccessibleCustomers`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'developer-token': this.config.developerToken,
            },
          }
        );

        const customerIds = listResponse.data.resourceNames || [];

        if (customerIds.length === 0) {
          return [];
        }

        // Fetch details for each customer
        const customers: GoogleCustomerAccount[] = [];

        for (const resourceName of customerIds) {
          // Extract customer ID from resource name (format: "customers/1234567890")
          const customerId = resourceName.split('/')[1];

          try {
            const customerInfo = await this.getCustomerInfo(customerId);
            customers.push(customerInfo);
          } catch (error) {
            console.warn(`Failed to fetch customer ${customerId}:`, error);
            // Continue with other customers
          }
        }

        return customers;
      } catch (error) {
        console.error('Error fetching accessible customers:', error);
        throw error;
      }
    });
  }

  /**
   * Get detailed information about a specific customer account
   */
  async getCustomerInfo(customerId: string): Promise<GoogleCustomerAccount> {
    const accessToken = await this.ensureAccessToken();

    return withRetry(async () => {
      try {
        const query = `
          SELECT
            customer.id,
            customer.descriptive_name,
            customer.currency_code,
            customer.time_zone
          FROM customer
          WHERE customer.id = ${customerId}
        `;

        const response = await this.executeGaqlQuery(query, customerId);

        if (!response.results || response.results.length === 0) {
          throw new Error(`Customer ${customerId} not found`);
        }

        const customer = response.results[0].customer;

        return {
          customerId: customer.id,
          descriptiveName: customer.descriptiveName || 'Unnamed Account',
          currencyCode: customer.currencyCode || 'USD',
          timeZone: customer.timeZone || 'UTC',
        };
      } catch (error) {
        console.error(`Error fetching customer info for ${customerId}:`, error);
        throw error;
      }
    });
  }

  /**
   * Get ads from Google Ads account with optional filtering
   */
  async getAds(options: GetAdsOptions = {}): Promise<GoogleAdData[]> {
    const accessToken = await this.ensureAccessToken();

    return withRetry(async () => {
      try {
        const query = this.buildAdsQuery(options);
        const response = await this.executeGaqlQuery(query, this.customerId);

        return this.mapResponseToAdData(response.results || []);
      } catch (error) {
        console.error('Error fetching ads:', error);
        throw error;
      }
    });
  }

  /**
   * Get a specific ad by ID
   */
  async getAdById(adId: string): Promise<GoogleAdData> {
    const ads = await this.getAds({ limit: 1 });
    const ad = ads.find((a) => a.id === adId);

    if (!ad) {
      throw new Error(`Ad with ID ${adId} not found`);
    }

    return ad;
  }

  /**
   * Build GAQL query for fetching ads with filters
   */
  private buildAdsQuery(options: GetAdsOptions): string {
    const {
      campaignStatus = 'ENABLED',
      dateRangeStart,
      dateRangeEnd,
      limit = 100,
    } = options;

    let query = `
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.status,
        campaign.id,
        campaign.name,
        campaign.status,
        ad_group.id,
        ad_group.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.ctr,
        metrics.average_cpc
      FROM ad_group_ad
      WHERE ad_group_ad.status = 'ENABLED'
    `;

    // Add campaign status filter
    if (campaignStatus !== 'ALL') {
      query += ` AND campaign.status = '${campaignStatus}'`;
    }

    // Add date range filter if provided
    if (dateRangeStart && dateRangeEnd) {
      query += ` AND segments.date BETWEEN '${dateRangeStart}' AND '${dateRangeEnd}'`;
    }

    query += ` LIMIT ${limit}`;

    return query;
  }

  /**
   * Execute a GAQL query against the Google Ads API
   */
  private async executeGaqlQuery(
    query: string,
    customerId?: string
  ): Promise<any> {
    const accessToken = await this.ensureAccessToken();
    const targetCustomerId = customerId || this.customerId;

    try {
      const response = await axios.post(
        `${GOOGLE_CONFIG.ADS_API_ENDPOINT}/v17/customers/${targetCustomerId}/googleAds:search`,
        { query },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'developer-token': this.config.developerToken,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('GAQL Query Error:', {
          query,
          status: error.response?.status,
          data: error.response?.data,
        });
      }
      throw error;
    }
  }

  /**
   * Map Google Ads API response to GoogleAdData interface
   */
  private mapResponseToAdData(results: any[]): GoogleAdData[] {
    return results.map((result) => {
      const ad = result.adGroupAd?.ad || {};
      const campaign = result.campaign || {};
      const adGroup = result.adGroup || {};
      const metrics = result.metrics || {};

      // Extract headlines and descriptions from responsive search ads
      const headlines =
        ad.responsiveSearchAd?.headlines?.map((h: any) => h.text) || [];
      const descriptions =
        ad.responsiveSearchAd?.descriptions?.map((d: any) => d.text) || [];

      // Get final URLs (default to empty array if not available)
      const finalUrls = ad.finalUrls || [];
      const displayUrl = finalUrls.length > 0 ? finalUrls[0] : '';

      return {
        id: ad.id?.toString() || '',
        name: ad.name || 'Unnamed Ad',
        campaignId: campaign.id?.toString() || '',
        campaignName: campaign.name || 'Unnamed Campaign',
        adGroupId: adGroup.id?.toString() || '',
        adGroupName: adGroup.name || 'Unnamed Ad Group',
        status: result.adGroupAd?.status || 'UNKNOWN',
        type: ad.type || 'UNKNOWN',
        finalUrls,
        displayUrl,
        headlines,
        descriptions,
        metrics: {
          impressions: parseInt(metrics.impressions) || 0,
          clicks: parseInt(metrics.clicks) || 0,
          cost: parseInt(metrics.costMicros) || 0,
          conversions: parseFloat(metrics.conversions) || 0,
          ctr: parseFloat(metrics.ctr) || 0,
          averageCpc: parseInt(metrics.averageCpc) || 0,
        },
      };
    });
  }
}

/**
 * Exchange authorization code for tokens (OAuth callback)
 * This is used in the OAuth flow, not part of the GoogleAdsClient class
 */
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  try {
    const response = await axios.post<GoogleTokenResponse>(
      GOOGLE_CONFIG.TOKEN_ENDPOINT,
      {
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to exchange authorization code');
  }
}
