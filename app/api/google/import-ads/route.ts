/**
 * Google Ads Import Handler
 * Imports ads from Google Ads account and stores them in the creatives table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { GoogleAdsClient } from '@/lib/google/client';
import { GoogleAdData, ImportAdsRequest, ImportAdsResponse } from '@/lib/google/types';
import { Creative, PerformanceMetrics } from '@/lib/types';
import { HTTP_STATUS } from '@/lib/constants';

/**
 * Map Google Ad data to Creative schema
 */
function mapGoogleAdToCreative(
  ad: GoogleAdData,
  userId: string
): Omit<Creative, 'id' | 'created_at'> {
  // Concatenate headlines and descriptions to create ad_copy
  const adCopyParts: string[] = [];

  if (ad.headlines.length > 0) {
    adCopyParts.push('Headlines:');
    adCopyParts.push(...ad.headlines.map((h, i) => `${i + 1}. ${h}`));
  }

  if (ad.descriptions.length > 0) {
    adCopyParts.push('');
    adCopyParts.push('Descriptions:');
    adCopyParts.push(...ad.descriptions.map((d, i) => `${i + 1}. ${d}`));
  }

  const adCopy = adCopyParts.join('\n') || 'No ad copy available';

  // Build performance metrics JSON
  const performance: PerformanceMetrics = {
    impressions: ad.metrics.impressions,
    clicks: ad.metrics.clicks,
    ctr: ad.metrics.ctr * 100, // Convert to percentage
    cpc: ad.metrics.averageCpc / 1000000, // Convert from micros
    spend: ad.metrics.cost / 1000000, // Convert from micros
    conversions: ad.metrics.conversions,
  };

  return {
    user_id: userId,
    source_type: 'own',
    brand_name: ad.campaignName,
    ad_id: ad.id,
    ad_image_url: null, // Most Google search ads don't have images
    ad_copy: adCopy,
    cta: ad.displayUrl || ad.finalUrls[0] || null,
    performance,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      );
    }

    // Step 2: Get user's Google credentials from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        'google_refresh_token, google_access_token, google_token_expires_at, google_customer_id, google_account_name'
      )
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    if (!userData.google_refresh_token) {
      return NextResponse.json(
        {
          error: 'Google Ads account not connected',
          requiresConnection: true,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    if (!userData.google_customer_id) {
      return NextResponse.json(
        {
          error: 'No Google Ads customer account found',
          requiresConnection: true,
        },
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Step 3: Parse filter parameters from request body
    const body: ImportAdsRequest = await request.json().catch(() => ({}));
    const {
      dateRangeStart,
      dateRangeEnd,
      campaignStatus = 'ENABLED',
    } = body;

    // Step 4: Initialize GoogleAdsClient
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET!;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;

    if (!clientId || !clientSecret || !developerToken) {
      return NextResponse.json(
        { error: 'Google Ads API credentials not configured' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    const googleAdsClient = new GoogleAdsClient(
      {
        clientId,
        clientSecret,
        developerToken,
        refreshToken: userData.google_refresh_token,
      },
      userData.google_customer_id
    );

    // Step 5: Fetch ads with filters
    console.log('Fetching ads from Google Ads with filters:', {
      customerId: userData.google_customer_id,
      campaignStatus,
      dateRangeStart,
      dateRangeEnd,
    });

    const ads = await googleAdsClient.getAds({
      campaignStatus: campaignStatus as any,
      dateRangeStart,
      dateRangeEnd,
      limit: 100,
    });

    console.log(`Fetched ${ads.length} ads from Google Ads`);

    // Step 6: Map and upsert ads to database
    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const ad of ads) {
      try {
        // Validate that ad has minimum required data
        if (!ad.id) {
          skippedCount++;
          errors.push(`Ad skipped: Missing ad ID`);
          continue;
        }

        const creativeData = mapGoogleAdToCreative(ad, user.id);

        // Upsert: Update if ad_id exists, insert if not
        const { data: existingCreative } = await supabase
          .from('creatives')
          .select('id')
          .eq('user_id', user.id)
          .eq('ad_id', ad.id)
          .maybeSingle();

        if (existingCreative) {
          // Update existing creative
          const { error: updateError } = await supabase
            .from('creatives')
            .update(creativeData)
            .eq('id', existingCreative.id);

          if (updateError) {
            throw updateError;
          }

          updatedCount++;
        } else {
          // Insert new creative
          const { error: insertError } = await supabase
            .from('creatives')
            .insert(creativeData);

          if (insertError) {
            throw insertError;
          }

          importedCount++;
        }
      } catch (err) {
        console.error(`Error importing ad ${ad.id}:`, err);
        skippedCount++;
        errors.push(
          `Ad ${ad.id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    // Step 7: Return import summary
    const response: ImportAdsResponse = {
      success: true,
      totalAds: ads.length,
      importedAds: importedCount,
      updatedAds: updatedCount,
      skippedAds: skippedCount,
      errors: errors.slice(0, 10), // Limit to first 10 errors
    };

    return NextResponse.json(response, { status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Google Ads import error:', error);

    // Provide helpful error messages
    let errorMessage = 'Failed to import ads';
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

    if (error instanceof Error) {
      // Check for common error patterns
      if (error.message.includes('refresh')) {
        errorMessage = 'Failed to refresh access token. Please reconnect your Google Ads account.';
        statusCode = HTTP_STATUS.UNAUTHORIZED;
      } else if (error.message.includes('developer token')) {
        errorMessage = 'Google Ads developer token is invalid or not approved.';
        statusCode = HTTP_STATUS.FORBIDDEN;
      } else if (error.message.includes('customer')) {
        errorMessage = 'Invalid Google Ads customer account.';
        statusCode = HTTP_STATUS.BAD_REQUEST;
      }
    }

    return NextResponse.json(
      {
        success: false,
        totalAds: 0,
        importedAds: 0,
        updatedAds: 0,
        skippedAds: 0,
        errors: [errorMessage],
      } as ImportAdsResponse,
      { status: statusCode }
    );
  }
}
