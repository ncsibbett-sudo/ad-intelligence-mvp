import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
// Hybrid AI approach: Mock for free tier ($0 cost), Real AI for paid tier (~$0.002/analysis)
import { analyzeCreative as mockAnalyze } from '@/lib/ai/analyze';
import { analyzeCreative as openaiAnalyze } from '@/lib/ai/openai-analyze';

export async function POST(request: Request) {
  try {
    // Get the auth token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    // Create a Supabase client with the user's token for RLS
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://utmnwtxtwxfymrcyrgqr.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW53dHh0d3hmeW1yY3lyZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTg5MTksImV4cCI6MjA3NTY3NDkxOX0.k_veXnDKq5vWZC32OZkuf7-A2fGqDuJMYezZnaav3m8';

    const supabase = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's payment status and analysis count
    const { data: userDataResult, error: userError } = await supabase
      .from('users')
      .select('payment_status, analysis_count')
      .eq('id', user.id)
      .single();

    let userData = userDataResult;

    // If user profile doesn't exist, create it (in case trigger failed)
    if (userError || !userData) {
      console.log('User profile not found, creating...', user.id);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          payment_status: 'free',
          analysis_count: 0,
        })
        .select()
        .single();

      if (createError || !newUser) {
        console.error('Failed to create user profile:', createError);
        return NextResponse.json({
          error: 'Failed to create user profile. Please try again.'
        }, { status: 500 });
      }

      userData = newUser;
    }

    // At this point userData is guaranteed to be non-null
    // TypeScript still needs help understanding this, so we assert it's not null
    if (!userData) {
      return NextResponse.json({ error: 'Failed to load user data' }, { status: 500 });
    }

    // Check if user has reached free tier limit
    if (userData.payment_status === 'free' && userData.analysis_count >= 5) {
      return NextResponse.json({
        error: 'Analysis limit reached',
        message: 'Upgrade to premium for unlimited analyses',
        requiresUpgrade: true,
      }, { status: 403 });
    }

    const body = await request.json();
    const { creative_id, image_url, ad_copy, cta } = body;

    // Run AI analysis: Mock for free users ($0), Real AI for paid users (~$0.002)
    // This ensures zero cost until users pay $29/month, then maintains 99% profit margin
    const analysisResult = userData.payment_status === 'paid'
      ? await openaiAnalyze(image_url, ad_copy, cta)
      : await mockAnalyze(image_url, ad_copy, cta);

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis')
      .insert({
        creative_id,
        analysis_result: analysisResult,
      })
      .select()
      .single();

    if (analysisError) {
      console.error('Error saving analysis:', analysisError);
      return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    }

    // Increment analysis count
    await supabase
      .from('users')
      .update({ analysis_count: userData.analysis_count + 1 })
      .eq('id', user.id);

    return NextResponse.json({
      analysis,
      remaining_analyses: userData.payment_status === 'free'
        ? 5 - (userData.analysis_count + 1)
        : null,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
