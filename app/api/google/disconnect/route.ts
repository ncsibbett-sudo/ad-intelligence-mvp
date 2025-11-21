/**
 * Google Ads Disconnect Handler
 * Removes Google Ads credentials from user account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { HTTP_STATUS } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
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

    // Clear all Google Ads credential fields
    const { error: updateError } = await supabase
      .from('users')
      .update({
        google_refresh_token: null,
        google_access_token: null,
        google_token_expires_at: null,
        google_customer_id: null,
        google_account_name: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error disconnecting Google Ads account:', updateError);
      return NextResponse.json(
        { error: 'Failed to disconnect Google Ads account' },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Google Ads account disconnected successfully',
      },
      { status: HTTP_STATUS.OK }
    );
  } catch (error) {
    console.error('Error in disconnect handler:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
