/**
 * INTEGRATION TEST: Stripe Webhook API Route
 *
 * This tests webhook event processing including:
 * - Signature verification
 * - checkout.session.completed (user upgrade)
 * - customer.subscription.deleted (user downgrade)
 * - invoice.payment_failed (payment failure handling)
 *
 * CRITICAL: If webhook fails, users pay but don't get upgraded
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';
import type Stripe from 'stripe';

// Use vi.hoisted to create mocks that can be used in both the factory and tests
const { mockConstructEvent, defaultHeadersImpl } = vi.hoisted(() => ({
  mockConstructEvent: vi.fn(),
  defaultHeadersImpl: () => ({
    get: vi.fn((name: string) => {
      if (name === 'stripe-signature') {
        return 'valid-signature';
      }
      return null;
    }),
  }),
}));

// Mock Stripe
vi.mock('stripe', () => {
  const MockStripe = function(this: any) {
    this.webhooks = {
      constructEvent: mockConstructEvent,
    };
  };

  return {
    default: MockStripe,
  };
});

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock Next.js headers with default implementation
vi.mock('next/headers', () => ({
  headers: vi.fn(defaultHeadersImpl),
}));

describe('POST /api/stripe/webhook - Integration Tests', () => {
  beforeEach(async () => {
    // Use mockReset to clear both call history AND implementation
    mockConstructEvent.mockReset();
    vi.clearAllMocks();

    // Restore default headers mock implementation
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockImplementation(defaultHeadersImpl);

    // Set environment variables
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  /**
   * HELPER: Create mock request
   */
  function createMockRequest(body: string, signature?: string): Request {
    const headers = new Headers();
    if (signature) {
      headers.set('stripe-signature', signature);
    }
    headers.set('Content-Type', 'application/json');

    return new Request('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers,
      body,
    });
  }

  /**
   * HELPER: Mock database query builder
   */
  function createMockQueryBuilder(returnData: any, error: any = null) {
    return {
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: returnData, error }),
    };
  }

  /**
   * TEST 1: Invalid webhook signature returns 400
   * CRITICAL: Security - reject unauthorized webhooks
   */
  test('returns 400 when webhook signature is invalid', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = createMockRequest('{}', 'invalid-signature');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid signature');
  });

  /**
   * TEST 2: Missing signature returns 400
   */
  test('returns 400 when signature header is missing', async () => {
    // Mock headers to return null for signature
    const { headers } = await import('next/headers');
    vi.mocked(headers).mockReturnValue({
      get: vi.fn(() => null),
    } as any);

    const request = createMockRequest('{}');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('No signature');
  });

  /**
   * TEST 3: checkout.session.completed updates user to 'paid'
   * CRITICAL: This is how users get upgraded after payment
   */
  test('checkout.session.completed updates user payment_status to paid', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test123',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test123',
          metadata: {
            supabase_user_id: 'user-upgrade',
          },
          payment_intent: 'pi_test123',
        } as Stripe.Checkout.Session,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    const userUpdateMock = vi.fn().mockReturnThis();
    const userSelectMock = vi.fn().mockResolvedValue({
      data: [{ id: 'user-upgrade', payment_status: 'paid' }],
      error: null,
    });

    const paymentUpdateMock = vi.fn().mockReturnThis();
    const paymentSelectMock = vi.fn().mockResolvedValue({
      data: [{ status: 'succeeded' }],
      error: null,
    });

    let userEqMock: any;
    let paymentEqMock: any;

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        userEqMock = vi.fn().mockReturnValue({
          select: userSelectMock,
        });
        return {
          update: userUpdateMock,
          eq: userEqMock,
        };
      }
      if (table === 'payments') {
        paymentEqMock = vi.fn().mockReturnValue({
          select: paymentSelectMock,
        });
        return {
          update: paymentUpdateMock,
          eq: paymentEqMock,
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);

    // Verify user was updated to 'paid'
    expect(userUpdateMock).toHaveBeenCalledWith({ payment_status: 'paid' });
    expect(userEqMock).toHaveBeenCalledWith('id', 'user-upgrade');
  });

  /**
   * TEST 4: checkout.session.completed updates payment record to 'succeeded'
   */
  test('checkout.session.completed updates payment status to succeeded', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_payment',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_payment123',
          metadata: {
            supabase_user_id: 'user-payment',
          },
          payment_intent: 'pi_payment123',
        } as Stripe.Checkout.Session,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    const paymentUpdateMock = vi.fn().mockReturnThis();
    const paymentEqMock = vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === 'payments') {
        return {
          update: paymentUpdateMock,
          eq: paymentEqMock,
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    await POST(request);

    // Verify payment was updated
    expect(paymentUpdateMock).toHaveBeenCalledWith({
      status: 'succeeded',
      stripe_payment_intent: 'pi_payment123',
    });
    expect(paymentEqMock).toHaveBeenCalledWith(
      'stripe_session_id',
      'cs_payment123'
    );
  });

  /**
   * TEST 5: customer.subscription.deleted downgrades user to 'free'
   * CRITICAL: When subscription ends, remove premium access
   */
  test('customer.subscription.deleted downgrades user to free', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_cancel',
      object: 'event',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_cancel123',
          customer: 'cus_cancel123',
        } as Stripe.Subscription,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    const updateMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    let selectCalled = false;

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users' && !selectCalled) {
        // First call: select to find user
        selectCalled = true;
        return createMockQueryBuilder({
          id: 'user-cancel',
        });
      } else if (table === 'users') {
        // Second call: update payment_status
        return {
          update: updateMock,
          eq: eqMock,
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify user was downgraded to 'free'
    expect(updateMock).toHaveBeenCalledWith({ payment_status: 'free' });
    expect(eqMock).toHaveBeenCalledWith('id', 'user-cancel');
  });

  /**
   * TEST 6: invoice.payment_failed leaves user as 'paid' (grace period)
   */
  test('invoice.payment_failed does not immediately downgrade user', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_failed',
      object: 'event',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_failed123',
          customer: 'cus_failed123',
        } as Stripe.Invoice,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    const updateMock = vi.fn();

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          ...createMockQueryBuilder({ id: 'user-failed' }),
          update: updateMock,
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    const response = await POST(request);

    expect(response.status).toBe(200);

    // Verify user was NOT downgraded (grace period)
    expect(updateMock).not.toHaveBeenCalled();
  });

  /**
   * TEST 7: Missing metadata doesn't crash webhook
   */
  test('handles missing metadata gracefully', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_no_meta',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_no_meta',
          metadata: {}, // No supabase_user_id
          payment_intent: 'pi_no_meta',
        } as Stripe.Checkout.Session,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    mockSupabaseClient.from.mockReturnValue(createMockQueryBuilder(null));

    const request = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    const response = await POST(request);
    const data = await response.json();

    // Should not crash, should return success
    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  /**
   * TEST 8: Handles duplicate webhook events (idempotency)
   */
  test('handles duplicate webhook events safely', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_duplicate',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_duplicate',
          metadata: {
            supabase_user_id: 'user-dup',
          },
          payment_intent: 'pi_duplicate',
        } as Stripe.Checkout.Session,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ id: 'user-dup', payment_status: 'paid' }],
              error: null,
            }),
          }),
        };
      }
      if (table === 'payments') {
        return {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({
              data: [{ status: 'succeeded' }],
              error: null,
            }),
          }),
        };
      }
      return createMockQueryBuilder(null);
    });

    // Send same webhook twice
    const request1 = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    const response1 = await POST(request1);

    const request2 = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    const response2 = await POST(request2);

    // Both should succeed (idempotent)
    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  /**
   * TEST 9: Returns 200 for unknown event types
   */
  test('handles unknown event types gracefully', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_unknown',
      object: 'event',
      type: 'customer.created' as any, // Unknown event type
      data: {
        object: {} as any,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    const request = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  /**
   * TEST 10: Uses service role key for database access
   * CRITICAL: Webhooks bypass RLS, need service role
   */
  test('creates Supabase client with service role key', async () => {
    const { createClient } = await import('@supabase/supabase-js');

    const mockEvent: Stripe.Event = {
      id: 'evt_service',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_service',
          metadata: {
            supabase_user_id: 'user-service',
          },
          payment_intent: 'pi_service',
        } as Stripe.Checkout.Session,
      },
    } as any;

    mockConstructEvent.mockReturnValue(mockEvent);

    mockSupabaseClient.from.mockImplementation(() => ({
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }));

    const request = createMockRequest(JSON.stringify(mockEvent), 'valid-sig');
    await POST(request);

    // Verify service role key was used
    expect(createClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  });
});

/**
 * TEST SUMMARY
 *
 * What we tested:
 * ✅ Invalid webhook signature returns 400 (security)
 * ✅ Missing signature returns 400
 * ✅ checkout.session.completed updates user to 'paid' (CRITICAL)
 * ✅ checkout.session.completed updates payment to 'succeeded'
 * ✅ customer.subscription.deleted downgrades to 'free' (CRITICAL)
 * ✅ invoice.payment_failed doesn't immediately downgrade (grace period)
 * ✅ Missing metadata doesn't crash
 * ✅ Handles duplicate events (idempotency)
 * ✅ Unknown event types handled gracefully
 * ✅ Uses service role key (bypasses RLS)
 *
 * Why this matters:
 * - If webhook fails, users pay but don't get upgraded
 * - Security: only accept verified Stripe webhooks
 * - Grace period: don't immediately downgrade on payment failure
 * - Idempotency: handle Stripe retries safely
 * - Service role: webhooks need to bypass user RLS
 */
