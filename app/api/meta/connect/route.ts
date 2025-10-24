import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // User ID passed in state

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.META_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL + '/api/meta/connect')}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&code=${code}`
    );

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    // Get long-lived token (60 days instead of 2 hours)
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${process.env.META_APP_ID}` +
      `&client_secret=${process.env.META_APP_SECRET}` +
      `&fb_exchange_token=${tokenData.access_token}`
    );

    const longLivedTokenData = await longLivedTokenResponse.json();

    // Get user's ad accounts to store the default one
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${longLivedTokenData.access_token}&fields=id,name`
    );
    const adAccountsData = await adAccountsResponse.json();
    const firstAdAccount = adAccountsData.data?.[0];

    // Store token in database
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://utmnwtxtwxfymrcyrgqr.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW53dHh0d3hmeW1yY3lyZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTg5MTksImV4cCI6MjA3NTY3NDkxOX0.k_veXnDKq5vWZC32OZkuf7-A2fGqDuJMYezZnaav3m8';

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('sb-access-token');

    if (!sessionCookie) {
      throw new Error('No session found');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${sessionCookie.value}` } }
    });

    const { data: { user } } = await supabase.auth.getUser(sessionCookie.value);

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Calculate token expiration (60 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    await supabase
      .from('users')
      .update({
        meta_access_token: longLivedTokenData.access_token,
        meta_token_expires_at: expiresAt.toISOString(),
        meta_ad_account_id: firstAdAccount?.id || null,
      })
      .eq('id', user.id);

    // Redirect to dashboard with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?meta_connected=true`
    );
  } catch (error) {
    console.error('Meta OAuth error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=meta_auth_failed`
    );
  }
}
