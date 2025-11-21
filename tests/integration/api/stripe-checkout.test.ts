/**
 * INTEGRATION TEST: Stripe Checkout API Route
 *
 * This tests the checkout session creation including:
 * - Authentication
 * - Stripe customer creation/reuse
 * - Checkout session creation
 * - Payment record creation
 *
 * CRITICAL: Broken checkout = no revenue
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/stripe/checkout/route';

// Use vi.hoisted to create mocks that can be used in both the factory and tests
const { mockStripeCustomerCreate, mockStripeSessionCreate } = vi.hoisted(() => ({
  mockStripeCustomerCreate: vi.fn(),
  mockStripeSessionCreate: vi.fn(),
}));

// Mock Stripe
vi.mock('stripe', () => {
  const MockStripe = function(this: any) {
    this.customers = {
      create: mockStripeCustomerCreate,
    };
    this.checkout = {
      sessions: {
        create: mockStripeSessionCreate,
      },
    };
  };

  return {
    default: MockStripe,
  };
});

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

describe('POST /api/stripe/checkout - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set default environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  /**
   * HELPER: Create mock request
   */
  function createMockRequest(token?: string): Request {
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    return new Request('http://localhost:3000/api/stripe/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });
  }

  /**
   * HELPER: Mock database query builder
   */
  function createMockQueryBuilder(returnData: any, error: any = null) {
    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: returnData, error }),
    };
  }

  /**
   * TEST 1: Missing auth token returns 401
   */
  test('returns 401 when Authorization header is missing', async () => {
    const request = createMockRequest();
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  /**
   * TEST 2: Creates Stripe customer if doesn't exist
   * CRITICAL: First-time users need customer creation
   */
  test('creates new Stripe customer if user has no customer ID', async () => {
    const mockUser = { id: 'user-new', email: 'new@test.com' };
    const mockUserData = {
      id: 'user-new',
      stripe_customer_id: null, // No customer yet
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock Stripe customer creation
    mockStripeCustomerCreate.mockResolvedValue({
      id: 'cus_new123',
      email: 'new@test.com',
    });

    // Mock checkout session creation
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test123',
      url: 'https://checkout.stripe.com/test',
    });

    let updateCalled = false;
    let insertCalled = false;

    // Mock database queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          update: vi.fn().mockImplementation((data: any) => {
            if (data.stripe_customer_id) {
              updateCalled = true;
            }
            return {
              eq: vi.fn().mockResolvedValue({ data: {}, error: null }),
            };
          }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockUserData,
            error: null,
          }),
        };
      }
      if (table === 'payments') {
        return {
          insert: vi.fn().mockImplementation(() => {
            insertCalled = true;
            return { data: {}, error: null };
          }),
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest('valid-token');
    const response = await POST(request);

    // Verify Stripe customer was created
    expect(mockStripeCustomerCreate).toHaveBeenCalledWith({
      email: 'new@test.com',
      metadata: {
        supabase_user_id: 'user-new',
      },
    });

    // Verify customer ID was saved to database
    expect(updateCalled).toBe(true);

    expect(response.status).toBe(200);
  });

  /**
   * TEST 3: Reuses existing Stripe customer if exists
   * CRITICAL: Don't create duplicate customers
   */
  test('reuses existing Stripe customer ID', async () => {
    const mockUser = { id: 'user-existing', email: 'existing@test.com' };
    const mockUserData = {
      id: 'user-existing',
      stripe_customer_id: 'cus_existing123', // Already has customer
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock checkout session creation
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test456',
      url: 'https://checkout.stripe.com/test',
    });

    // Mock database queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'payments') {
        return {
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest('valid-token');
    await POST(request);

    // Verify Stripe customer was NOT created (reused existing)
    expect(mockStripeCustomerCreate).not.toHaveBeenCalled();

    // Verify checkout session used existing customer ID
    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing123',
      })
    );
  });

  /**
   * TEST 4: Returns valid checkout session URL
   */
  test('returns valid checkout session ID and URL', async () => {
    const mockUser = { id: 'user-123', email: 'test@test.com' };
    const mockUserData = {
      id: 'user-123',
      stripe_customer_id: 'cus_123',
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock Stripe session creation
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test_session123',
      url: 'https://checkout.stripe.com/pay/cs_test_session123',
    });

    // Mock database
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'payments') {
        return {
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest('valid-token');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.sessionId).toBe('cs_test_session123');
    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_session123');
  });

  /**
   * TEST 5: Includes supabase_user_id in metadata
   * CRITICAL: Webhook needs this to identify the user
   */
  test('includes supabase_user_id in session metadata', async () => {
    const mockUser = { id: 'user-metadata-test', email: 'metadata@test.com' };
    const mockUserData = {
      id: 'user-metadata-test',
      stripe_customer_id: 'cus_meta',
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock Stripe
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_meta',
      url: 'https://checkout.stripe.com/meta',
    });

    // Mock database
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'payments') {
        return {
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest('valid-token');
    await POST(request);

    // Verify metadata was included
    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          supabase_user_id: 'user-metadata-test',
        },
      })
    );
  });

  /**
   * TEST 6: Creates payment record with 'pending' status
   * CRITICAL: Track payment attempts
   */
  test('creates payment record with pending status', async () => {
    const mockUser = { id: 'user-payment', email: 'payment@test.com' };
    const mockUserData = {
      id: 'user-payment',
      stripe_customer_id: 'cus_pay',
    };

    const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock Stripe
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_payment123',
      url: 'https://checkout.stripe.com/payment',
    });

    // Mock database
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'payments') {
        return {
          insert: insertMock,
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest('valid-token');
    await POST(request);

    // Verify payment record was created
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-payment',
      stripe_session_id: 'cs_payment123',
      status: 'pending',
      amount: 2900, // $29.00
      currency: 'usd',
    });
  });

  /**
   * TEST 7: Handles Stripe API errors gracefully
   */
  test('handles Stripe API errors gracefully', async () => {
    const mockUser = { id: 'user-error', email: 'error@test.com' };
    const mockUserData = {
      id: 'user-error',
      stripe_customer_id: 'cus_error',
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock database
    mockSupabaseClient.from.mockReturnValue(
      createMockQueryBuilder(mockUserData)
    );

    // Mock Stripe error
    mockStripeSessionCreate.mockRejectedValue(
      new Error('Stripe API error: Rate limited')
    );

    const request = createMockRequest('valid-token');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain('Failed to create checkout session');
  });

  /**
   * TEST 8: Creates checkout session with correct product details
   */
  test('creates checkout session with correct subscription details', async () => {
    const mockUser = { id: 'user-product', email: 'product@test.com' };
    const mockUserData = {
      id: 'user-product',
      stripe_customer_id: 'cus_product',
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock Stripe
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_product',
      url: 'https://checkout.stripe.com/product',
    });

    // Mock database
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'payments') {
        return {
          insert: vi.fn().mockResolvedValue({ data: {}, error: null }),
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest('valid-token');
    await POST(request);

    // Verify checkout session details
    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
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
        success_url: expect.stringContaining('/dashboard?payment=success'),
        cancel_url: expect.stringContaining('/dashboard?payment=cancelled'),
      })
    );
  });
});

/**
 * TEST SUMMARY
 *
 * What we tested:
 * ✅ Missing auth token returns 401
 * ✅ Creates new Stripe customer if none exists
 * ✅ Reuses existing Stripe customer (no duplicates)
 * ✅ Returns valid checkout session URL
 * ✅ Includes supabase_user_id in metadata (CRITICAL for webhooks)
 * ✅ Creates payment record with 'pending' status
 * ✅ Handles Stripe API errors gracefully
 * ✅ Creates checkout session with correct product/price
 *
 * Why this matters:
 * - Broken checkout = no revenue
 * - Duplicate customers create billing confusion
 * - Missing metadata = webhook can't upgrade user
 * - Payment tracking ensures audit trail
 */
