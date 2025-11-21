/**
 * UNIT TEST: Supabase Server Client Helper
 *
 * This tests the server-side Supabase client creation including:
 * - SSR client initialization with environment variables
 * - Cookie handling (getAll and setAll)
 * - Error handling for Server Component context
 *
 * CRITICAL: Proper cookie handling is essential for auth
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createServerClient } from '@/lib/supabase/server';

// Mock cookie values
const mockCookies = [
  { name: 'sb-access-token', value: 'mock-access-token' },
  { name: 'sb-refresh-token', value: 'mock-refresh-token' },
];

// Create hoisted mocks
const { mockCookieStore, mockCreateSSRClient } = vi.hoisted(() => ({
  mockCookieStore: {
    getAll: vi.fn(),
    set: vi.fn(),
  },
  mockCreateSSRClient: vi.fn(),
}));

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

// Mock Supabase SSR
vi.mock('@supabase/ssr', () => ({
  createServerClient: mockCreateSSRClient,
}));

describe('createServerClient - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

    // Default mock implementation returns a mock client
    mockCreateSSRClient.mockReturnValue({
      auth: { getSession: vi.fn() },
    });

    // Default cookie store behavior
    mockCookieStore.getAll.mockReturnValue(mockCookies);
  });

  /**
   * TEST 1: Creates SSR client with correct URL from env
   */
  test('creates SSR client with NEXT_PUBLIC_SUPABASE_URL from environment', async () => {
    await createServerClient();

    expect(mockCreateSSRClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      expect.any(String),
      expect.any(Object)
    );
  });

  /**
   * TEST 2: Creates SSR client with correct anon key from env
   */
  test('creates SSR client with NEXT_PUBLIC_SUPABASE_ANON_KEY from environment', async () => {
    await createServerClient();

    expect(mockCreateSSRClient).toHaveBeenCalledWith(
      expect.any(String),
      'test-anon-key',
      expect.any(Object)
    );
  });

  /**
   * TEST 3: Returns the client created by createSSRClient
   */
  test('returns the Supabase client instance', async () => {
    const mockClient = { auth: { getSession: vi.fn() } };
    mockCreateSSRClient.mockReturnValue(mockClient);

    const client = await createServerClient();

    expect(client).toBe(mockClient);
  });

  /**
   * TEST 4: Cookie getAll() retrieves all cookies from cookie store
   */
  test('cookie handler getAll() returns all cookies from store', async () => {
    await createServerClient();

    // Get the cookies config passed to createSSRClient
    const callArgs = mockCreateSSRClient.mock.calls[0];
    const cookiesConfig = callArgs[2].cookies;

    const result = cookiesConfig.getAll();

    expect(mockCookieStore.getAll).toHaveBeenCalled();
    expect(result).toEqual(mockCookies);
  });

  /**
   * TEST 5: Cookie setAll() sets cookies correctly
   */
  test('cookie handler setAll() sets cookies in cookie store', async () => {
    await createServerClient();

    // Get the cookies config passed to createSSRClient
    const callArgs = mockCreateSSRClient.mock.calls[0];
    const cookiesConfig = callArgs[2].cookies;

    const cookiesToSet = [
      {
        name: 'new-cookie',
        value: 'new-value',
        options: { path: '/', maxAge: 3600 },
      },
      {
        name: 'another-cookie',
        value: 'another-value',
        options: { path: '/', httpOnly: true },
      },
    ];

    cookiesConfig.setAll(cookiesToSet);

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'new-cookie',
      'new-value',
      { path: '/', maxAge: 3600 }
    );
    expect(mockCookieStore.set).toHaveBeenCalledWith(
      'another-cookie',
      'another-value',
      { path: '/', httpOnly: true }
    );
  });

  /**
   * TEST 6: Cookie setAll() handles errors gracefully
   * CRITICAL: Errors can occur when called from Server Components
   */
  test('cookie handler setAll() catches and ignores errors from Server Component context', async () => {
    // Mock cookie.set to throw error (Server Component context)
    mockCookieStore.set.mockImplementation(() => {
      throw new Error('Cannot set cookies in Server Component');
    });

    await createServerClient();

    // Get the cookies config
    const callArgs = mockCreateSSRClient.mock.calls[0];
    const cookiesConfig = callArgs[2].cookies;

    const cookiesToSet = [
      { name: 'test', value: 'value', options: {} },
    ];

    // Should NOT throw error
    expect(() => cookiesConfig.setAll(cookiesToSet)).not.toThrow();
  });

  /**
   * TEST 7: Cookie setAll() with empty array doesn't call set
   */
  test('cookie handler setAll() with empty array does not call cookie.set', async () => {
    await createServerClient();

    const callArgs = mockCreateSSRClient.mock.calls[0];
    const cookiesConfig = callArgs[2].cookies;

    cookiesConfig.setAll([]);

    expect(mockCookieStore.set).not.toHaveBeenCalled();
  });

  /**
   * TEST 8: Uses cookies() from next/headers
   */
  test('retrieves cookie store using next/headers cookies()', async () => {
    const { cookies } = await import('next/headers');

    await createServerClient();

    expect(cookies).toHaveBeenCalled();
  });

  /**
   * TEST 9: Passes cookies configuration to SSR client
   */
  test('passes cookies configuration object to createSSRClient', async () => {
    await createServerClient();

    const callArgs = mockCreateSSRClient.mock.calls[0];
    const config = callArgs[2];

    expect(config).toHaveProperty('cookies');
    expect(config.cookies).toHaveProperty('getAll');
    expect(config.cookies).toHaveProperty('setAll');
    expect(typeof config.cookies.getAll).toBe('function');
    expect(typeof config.cookies.setAll).toBe('function');
  });

  /**
   * TEST 10: Works with different environment URLs
   */
  test('uses different Supabase URL when environment changes', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://production.supabase.co';

    await createServerClient();

    expect(mockCreateSSRClient).toHaveBeenCalledWith(
      'https://production.supabase.co',
      expect.any(String),
      expect.any(Object)
    );
  });
});

/**
 * TEST SUMMARY
 *
 * What we tested:
 * ✅ Creates SSR client with NEXT_PUBLIC_SUPABASE_URL
 * ✅ Creates SSR client with NEXT_PUBLIC_SUPABASE_ANON_KEY
 * ✅ Returns the correct client instance
 * ✅ Cookie getAll() retrieves cookies from store
 * ✅ Cookie setAll() sets cookies correctly
 * ✅ Cookie setAll() handles Server Component errors gracefully
 * ✅ Cookie setAll() with empty array doesn't call set
 * ✅ Uses Next.js cookies() function
 * ✅ Passes proper cookies config to SSR client
 * ✅ Works with different environment configurations
 *
 * Why this matters:
 * - Proper SSR client setup is critical for auth
 * - Cookie handling enables session persistence
 * - Error handling prevents crashes in Server Components
 * - Environment variables allow different configs per environment
 */
