/**
 * INTEGRATION TEST: Analyze API Route
 *
 * This tests the complete API route including:
 * - Authentication
 * - Freemium logic (5 analysis limit for free users)
 * - Database operations
 * - AI routing (mock for free, real for paid)
 *
 * CRITICAL: These tests enforce your business model
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/analyze/route';
import type { AnalysisResult } from '@/lib/types';

// Mock the AI analysis modules
vi.mock('@/lib/ai/analyze', () => ({
  analyzeCreative: vi.fn().mockResolvedValue({
    headline: 'Mock Analysis',
    headline_length: 'short',
    emotion: 'neutral',
    copy_tone: 'informative',
    performance_driver: 'Mock performance driver',
    recommendations: ['Test recommendation'],
  }),
}));

vi.mock('@/lib/ai/openai-analyze', () => ({
  analyzeCreative: vi.fn().mockResolvedValue({
    headline: 'OpenAI Analysis',
    headline_length: 'medium',
    emotion: 'excitement',
    copy_tone: 'promotional',
    performance_driver: 'Real AI performance driver',
    recommendations: ['Real AI recommendation'],
  }),
}));

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

describe('POST /api/analyze - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * HELPER: Create mock request
   */
  function createMockRequest(body: any, token?: string): Request {
    const headers = new Headers();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    return new Request('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
   * TEST 1: Missing Authorization header returns 401
   */
  test('returns 401 when Authorization header is missing', async () => {
    const request = createMockRequest({
      creative_id: '123',
      ad_copy: 'Test ad',
      cta: 'Click',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toContain('Unauthorized');
  });

  /**
   * TEST 2: Invalid auth token returns 401
   */
  test('returns 401 when auth token is invalid', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    const request = createMockRequest(
      {
        creative_id: '123',
        ad_copy: 'Test ad',
        cta: 'Click',
      },
      'invalid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  /**
   * TEST 3: Free user can create 5 analyses
   */
  test('free user can create analyses when under limit (4/5)', async () => {
    const mockUser = { id: 'user-123', email: 'free@test.com' };
    const mockUserData = {
      payment_status: 'free',
      analysis_count: 4,
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock user data query
    const userQueryBuilder = createMockQueryBuilder(mockUserData);
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return userQueryBuilder;
      }
      if (table === 'analysis') {
        return createMockQueryBuilder({
          id: 'analysis-123',
          creative_id: '123',
          analysis_result: { headline: 'Test' },
        });
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(
      {
        creative_id: '123',
        ad_copy: 'Test ad copy',
        cta: 'Shop Now',
      },
      'valid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toBeDefined();
    expect(data.remaining_analyses).toBe(0); // 5 - (4 + 1) = 0
  });

  /**
   * TEST 4: 6th analysis attempt returns 403 with requiresUpgrade flag
   * CRITICAL: This enforces your business model
   */
  test('free user cannot create 6th analysis - returns 403 with requiresUpgrade', async () => {
    const mockUser = { id: 'user-123', email: 'free@test.com' };
    const mockUserData = {
      payment_status: 'free',
      analysis_count: 5, // Already at limit
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock user data query
    mockSupabaseClient.from.mockReturnValue(
      createMockQueryBuilder(mockUserData)
    );

    const request = createMockRequest(
      {
        creative_id: '123',
        ad_copy: 'Test ad',
        cta: 'Click',
      },
      'valid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.requiresUpgrade).toBe(true);
    expect(data.error).toContain('limit reached');
    expect(data.message).toContain('Upgrade');
  });

  /**
   * TEST 5: Paid user can create unlimited analyses
   * CRITICAL: Paid users must have unlimited access
   */
  test('paid user can create unlimited analyses (>5)', async () => {
    const mockUser = { id: 'user-456', email: 'paid@test.com' };
    const mockUserData = {
      payment_status: 'paid',
      analysis_count: 10, // Already created 10
    };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock user data and analysis queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'analysis') {
        return createMockQueryBuilder({
          id: 'analysis-456',
          creative_id: '456',
          analysis_result: { headline: 'Paid User Analysis' },
        });
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(
      {
        creative_id: '456',
        ad_copy: 'Premium ad',
        cta: 'Buy Now',
      },
      'valid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.analysis).toBeDefined();
    expect(data.remaining_analyses).toBeNull(); // Unlimited for paid users
  });

  /**
   * TEST 6: Analysis count increments correctly
   */
  test('increments analysis_count after successful analysis', async () => {
    const mockUser = { id: 'user-789', email: 'test@test.com' };
    const mockUserData = {
      payment_status: 'free',
      analysis_count: 2,
    };

    const updateMock = vi.fn().mockReturnThis();
    const eqMock = vi.fn().mockResolvedValue({ data: {}, error: null });

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    let callCount = 0;

    // Mock queries - need to handle multiple calls to from('users')
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        callCount++;
        if (callCount === 1) {
          // First call: select query for user data
          return createMockQueryBuilder(mockUserData);
        } else {
          // Second call: update query
          return {
            update: updateMock,
            eq: eqMock,
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn(),
          };
        }
      }
      if (table === 'analysis') {
        return createMockQueryBuilder({
          id: 'analysis-789',
          creative_id: '789',
          analysis_result: {},
        });
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(
      {
        creative_id: '789',
        ad_copy: 'Test',
        cta: 'Test',
      },
      'valid-token'
    );

    await POST(request);

    // Verify update was called with incremented count
    expect(updateMock).toHaveBeenCalledWith({ analysis_count: 3 }); // 2 + 1
    expect(eqMock).toHaveBeenCalledWith('id', 'user-789');
  });

  /**
   * TEST 7: Creates analysis record in database
   */
  test('creates analysis record in database with correct data', async () => {
    const mockUser = { id: 'user-999', email: 'test@test.com' };
    const mockUserData = {
      payment_status: 'free',
      analysis_count: 0,
    };

    const insertMock = vi.fn().mockReturnThis();
    const selectMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: 'analysis-999',
        creative_id: '999',
        analysis_result: { headline: 'Test' },
      },
      error: null,
    });

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'analysis') {
        return {
          insert: insertMock,
          select: selectMock,
          single: singleMock,
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(
      {
        creative_id: '999',
        ad_copy: 'Test ad',
        cta: 'Test CTA',
      },
      'valid-token'
    );

    await POST(request);

    // Verify analysis insert was called
    expect(insertMock).toHaveBeenCalledWith({
      creative_id: '999',
      analysis_result: expect.any(Object),
    });
  });

  /**
   * TEST 8: Free user gets mock AI, paid user gets real AI
   * CRITICAL: This controls your OpenAI costs
   */
  test('routes free users to mock AI and paid users to OpenAI', async () => {
    const { analyzeCreative: mockAnalyze } = await import('@/lib/ai/analyze');
    const { analyzeCreative: openaiAnalyze } = await import(
      '@/lib/ai/openai-analyze'
    );

    // Test free user gets mock AI
    const freeUser = { id: 'free-user', email: 'free@test.com' };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: freeUser },
      error: null,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder({
          payment_status: 'free',
          analysis_count: 0,
        });
      }
      return createMockQueryBuilder({ id: 'test', analysis_result: {} });
    });

    const freeRequest = createMockRequest(
      { creative_id: '1', ad_copy: 'Test', cta: 'Test' },
      'token'
    );
    await POST(freeRequest);

    expect(mockAnalyze).toHaveBeenCalled();
    expect(openaiAnalyze).not.toHaveBeenCalled();

    // Clear mocks
    vi.clearAllMocks();

    // Test paid user gets OpenAI
    const paidUser = { id: 'paid-user', email: 'paid@test.com' };
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: paidUser },
      error: null,
    });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder({
          payment_status: 'paid',
          analysis_count: 10,
        });
      }
      return createMockQueryBuilder({ id: 'test', analysis_result: {} });
    });

    const paidRequest = createMockRequest(
      { creative_id: '2', ad_copy: 'Test', cta: 'Test' },
      'token'
    );
    await POST(paidRequest);

    expect(openaiAnalyze).toHaveBeenCalled();
  });

  /**
   * TEST 9: User profile auto-creation works if missing
   */
  test('creates user profile if missing', async () => {
    const mockUser = { id: 'new-user', email: 'new@test.com' };

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    const insertMock = vi.fn().mockReturnThis();
    const selectMock = vi.fn().mockReturnThis();
    const singleMock = vi.fn();

    // First call: user doesn't exist (error)
    // Second call: return created user
    singleMock
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' },
      })
      .mockResolvedValueOnce({
        data: {
          id: 'new-user',
          email: 'new@test.com',
          payment_status: 'free',
          analysis_count: 0,
        },
        error: null,
      })
      .mockResolvedValue({
        data: { id: 'analysis-new', analysis_result: {} },
        error: null,
      });

    // Mock queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      return {
        select: selectMock,
        insert: insertMock,
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: singleMock,
      };
    });

    const request = createMockRequest(
      {
        creative_id: '123',
        ad_copy: 'Test',
        cta: 'Test',
      },
      'valid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    // Verify user creation was called
    expect(insertMock).toHaveBeenCalledWith({
      id: 'new-user',
      email: 'new@test.com',
      payment_status: 'free',
      analysis_count: 0,
    });

    expect(response.status).toBe(200);
  });

  /**
   * TEST 10: Links analysis to creative via creative_id
   */
  test('links analysis to creative using creative_id', async () => {
    const mockUser = { id: 'user-link', email: 'link@test.com' };
    const mockUserData = {
      payment_status: 'free',
      analysis_count: 1,
    };

    const insertMock = vi.fn().mockReturnThis();

    // Mock auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Mock queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQueryBuilder(mockUserData);
      }
      if (table === 'analysis') {
        return {
          insert: insertMock,
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: 'test', creative_id: 'creative-456' },
            error: null,
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        };
      }
      return createMockQueryBuilder(null);
    });

    const request = createMockRequest(
      {
        creative_id: 'creative-456',
        ad_copy: 'Test ad',
        cta: 'Click',
      },
      'valid-token'
    );

    await POST(request);

    // Verify creative_id was included in the insert
    expect(insertMock).toHaveBeenCalledWith({
      creative_id: 'creative-456',
      analysis_result: expect.any(Object),
    });
  });
});

/**
 * TEST SUMMARY
 *
 * What we tested:
 * ✅ Missing Authorization header returns 401
 * ✅ Invalid auth token returns 401
 * ✅ Free user can create analyses (under 5 limit)
 * ✅ 6th analysis returns 403 with requiresUpgrade flag (CRITICAL)
 * ✅ Paid user can create unlimited analyses (CRITICAL)
 * ✅ Analysis count increments correctly
 * ✅ Creates analysis record in database
 * ✅ Routes free → mock AI, paid → OpenAI (CRITICAL for costs)
 * ✅ User profile auto-creation works
 * ✅ Links analysis to creative via creative_id
 *
 * Why this matters:
 * - Enforces your freemium business model
 * - Prevents revenue loss from unlimited free access
 * - Controls OpenAI costs ($0 for free, $0.002 for paid)
 * - Ensures proper database relationships
 * - Validates authentication security
 */
