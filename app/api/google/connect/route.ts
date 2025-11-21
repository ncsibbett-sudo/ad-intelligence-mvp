/**
 * Google Ads OAuth Callback Handler
 * Handles the OAuth redirect, exchanges code for tokens, and stores credentials
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { exchangeCodeForTokens } from '@/lib/google/client';
import { GoogleAdsClient } from '@/lib/google/client';
import { GoogleCustomerAccount } from '@/lib/google/types';
import { GOOGLE_CONFIG } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle OAuth errors (user denied access, etc.)
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_denied`
    );
  }

  // Validate authorization code
  if (!code) {
    console.error('No authorization code provided');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`
    );
  }

  try {
    // Step 1: Exchange authorization code for tokens
    const clientId = process.env.GOOGLE_ADS_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET!;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN!;
    const redirectUri = GOOGLE_CONFIG.REDIRECT_URI;

    if (!clientId || !clientSecret || !developerToken) {
      throw new Error('Missing Google Ads API credentials in environment variables');
    }

    const tokenData = await exchangeCodeForTokens(
      code,
      clientId,
      clientSecret,
      redirectUri
    );

    if (!tokenData.refresh_token) {
      throw new Error('No refresh token received from Google');
    }

    // Step 2: Get authenticated user from Supabase
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sb-access-token');

    if (!sessionCookie) {
      throw new Error('No session found - user not authenticated');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${sessionCookie.value}`,
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser(sessionCookie.value);

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Step 3: Fetch accessible customer accounts
    const googleAdsClient = new GoogleAdsClient(
      {
        clientId,
        clientSecret,
        developerToken,
        refreshToken: tokenData.refresh_token,
      },
      '' // We don't have a customer ID yet
    );

    let customers: GoogleCustomerAccount[] = [];
    try {
      customers = await googleAdsClient.getAccessibleCustomers();
    } catch (error) {
      console.error('Error fetching accessible customers:', error);
      // Continue anyway - user might not have any ad accounts yet
      customers = [];
    }

    // Use the first customer account as default (or null if none)
    const defaultCustomer = customers.length > 0 ? customers[0] : null;

    // Step 4: Calculate token expiration (1 hour from now)
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setSeconds(
      tokenExpiresAt.getSeconds() + tokenData.expires_in
    );

    // Step 5: Store credentials in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_refresh_token: tokenData.refresh_token,
        google_access_token: tokenData.access_token,
        google_token_expires_at: tokenExpiresAt.toISOString(),
        google_customer_id: defaultCustomer?.customerId || null,
        google_account_name: defaultCustomer?.descriptiveName || null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error storing Google credentials:', updateError);
      throw new Error('Failed to store Google Ads credentials');
    }

    // Step 6: Redirect to dashboard with success
    const redirectUrl = new URL(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    );
    redirectUrl.searchParams.set('google_connected', 'true');

    if (customers.length === 0) {
      // Warn user they have no ad accounts
      redirectUrl.searchParams.set('warning', 'no_ad_accounts');
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth connection error:', error);

    // Log detailed error for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_auth_failed`
    );
  }
}
