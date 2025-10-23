import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create user profile and Stripe customer
    let { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    // If user profile doesn't exist, create it (in case trigger failed)
    if (!userData) {
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

    // Explicit check for TypeScript
    if (!userData) {
      return NextResponse.json({ error: 'Failed to load user data' }, { status: 500 });
    }

    let customerId = userData.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update user with customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Ad Intelligence Pro',
              description: 'Unlimited ad analyses and insights',
            },
            unit_amount: 2900, // $29.00
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
      },
    });

    // Record payment in database
    await supabase.from('payments').insert({
      user_id: user.id,
      stripe_session_id: session.id,
      status: 'pending',
      amount: 2900,
      currency: 'usd',
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
