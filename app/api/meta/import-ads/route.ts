import { NextResponse } from 'next/server';
import { MetaAdsClient } from '@/lib/meta/client';

export async function POST(request: Request) {
  try {
    // Get auth token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://utmnwtxtwxfymrcyrgqr.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW53dHh0d3hmeW1yY3lyZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTg5MTksImV4cCI6MjA3NTY3NDkxOX0.k_veXnDKq5vWZC32OZkuf7-A2fGqDuJMYezZnaav3m8';

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's Meta token
    const { data: userData } = await supabase
      .from('users')
      .select('meta_access_token, meta_ad_account_id, meta_token_expires_at')
      .eq('id', user.id)
      .single();

    if (!userData?.meta_access_token) {
      return NextResponse.json({
        error: 'Meta account not connected',
        requiresConnection: true
      }, { status: 400 });
    }

    // Check if token is expired
    if (userData.meta_token_expires_at) {
      const expiresAt = new Date(userData.meta_token_expires_at);
      if (expiresAt < new Date()) {
        return NextResponse.json({
          error: 'Meta token expired',
          requiresReconnection: true
        }, { status: 401 });
      }
    }

    // Fetch ads from Meta
    const metaClient = new MetaAdsClient(userData.meta_access_token);
    const ads = await metaClient.getAds(userData.meta_ad_account_id!);

    console.log(`Fetched ${ads.length} ads from Meta`);

    // Import ads into database
    const importedAds = [];
    for (const ad of ads) {
      try {
        const creative = ad.creative || {};
        const insights = ad.insights?.data?.[0] || {};

        const { data: insertedCreative, error } = await supabase
          .from('creatives')
          .insert({
            user_id: user.id,
            source_type: 'own',
            brand_name: ad.name || 'Imported Ad',
            ad_id: ad.id,
            ad_image_url: creative.image_url || null,
            ad_copy: creative.body || creative.title || null,
            cta: creative.call_to_action_type || null,
            performance: {
              impressions: insights.impressions || 0,
              clicks: insights.clicks || 0,
              ctr: insights.ctr || 0,
              cpc: insights.cpc || 0,
              spend: insights.spend || 0,
            }
          })
          .select()
          .single();

        if (!error && insertedCreative) {
          importedAds.push(insertedCreative);
        }
      } catch (err) {
        console.error(`Error importing ad ${ad.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedAds.length,
      total: ads.length,
      ads: importedAds,
    });

  } catch (error) {
    console.error('Meta import error:', error);
    return NextResponse.json({
      error: 'Failed to import ads',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
