/**
 * UNIT TEST: Supabase Client-Side Client Helper
 *
 * This tests the client-side Supabase client creation including:
 * - Client initialization with hardcoded credentials
 * - Singleton pattern (same instance)
 * - Client has expected Supabase methods
 *
 * CRITICAL: Client-side auth and data access depends on this
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Create hoisted mock
const { mockCreateClient, mockClientInstance } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockClientInstance: {
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

describe('Supabase Client - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockReturnValue(mockClientInstance);

    // Clear the module cache to get fresh imports
    vi.resetModules();
  });

  /**
   * TEST 1: Exports a Supabase client instance
   */
  test('exports a supabase client instance', async () => {
    const { supabase } = await import('@/lib/supabase/client');

    expect(supabase).toBeDefined();
    expect(supabase).toBe(mockClientInstance);
  });

  /**
   * TEST 2: Creates client with correct Supabase URL
   */
  test('creates client with correct Supabase URL', async () => {
    await import('@/lib/supabase/client');

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://utmnwtxtwxfymrcyrgqr.supabase.co',
      expect.any(String)
    );
  });

  /**
   * TEST 3: Creates client with correct anon key
   */
  test('creates client with correct anon key', async () => {
    await import('@/lib/supabase/client');

    expect(mockCreateClient).toHaveBeenCalledWith(
      expect.any(String),
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0bW53dHh0d3hmeW1yY3lyZ3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwOTg5MTksImV4cCI6MjA3NTY3NDkxOX0.k_veXnDKq5vWZC32OZkuf7-A2fGqDuJMYezZnaav3m8'
    );
  });

  /**
   * TEST 4: Client has auth methods
   */
  test('client has auth methods (signUp, signIn, signOut, getSession)', async () => {
    const { supabase } = await import('@/lib/supabase/client');

    expect(supabase.auth).toBeDefined();
    expect(supabase.auth.signUp).toBeDefined();
    expect(supabase.auth.signIn).toBeDefined();
    expect(supabase.auth.signOut).toBeDefined();
    expect(supabase.auth.getSession).toBeDefined();
  });

  /**
   * TEST 5: Client has database query methods
   */
  test('client has from() method for database queries', async () => {
    const { supabase } = await import('@/lib/supabase/client');

    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');

    const table = supabase.from('users');
    expect(table.select).toBeDefined();
    expect(table.insert).toBeDefined();
    expect(table.update).toBeDefined();
    expect(table.delete).toBeDefined();
  });

  /**
   * TEST 6: Client is singleton (same instance on multiple imports)
   */
  test('returns same client instance on multiple imports (singleton)', async () => {
    // First import
    const { supabase: supabase1 } = await import('@/lib/supabase/client');

    // Second import
    const { supabase: supabase2 } = await import('@/lib/supabase/client');

    // Should be the same instance
    expect(supabase1).toBe(supabase2);
  });

  /**
   * TEST 7: createClient is called only once
   */
  test('createClient is called only once for singleton pattern', async () => {
    await import('@/lib/supabase/client');
    await import('@/lib/supabase/client');
    await import('@/lib/supabase/client');

    // Should only create client once
    expect(mockCreateClient).toHaveBeenCalledTimes(1);
  });

  /**
   * TEST 8: Anon key is valid JWT format
   */
  test('anon key is a valid JWT token format', async () => {
    await import('@/lib/supabase/client');

    const callArgs = mockCreateClient.mock.calls[0];
    const anonKey = callArgs[1];

    // JWT has 3 parts separated by dots
    const parts = anonKey.split('.');
    expect(parts).toHaveLength(3);

    // Each part should be base64-encoded
    parts.forEach((part) => {
      expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  /**
   * TEST 9: URL is valid HTTPS Supabase URL
   */
  test('URL is a valid HTTPS Supabase URL', async () => {
    await import('@/lib/supabase/client');

    const callArgs = mockCreateClient.mock.calls[0];
    const url = callArgs[0];

    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  /**
   * TEST 10: Module exports only the client
   */
  test('module exports only supabase client (no other exports)', async () => {
    const module = await import('@/lib/supabase/client');

    const exports = Object.keys(module);
    expect(exports).toEqual(['supabase']);
  });
});

/**
 * TEST SUMMARY
 *
 * What we tested:
 * ✅ Exports a Supabase client instance
 * ✅ Creates client with correct hardcoded URL
 * ✅ Creates client with correct hardcoded anon key
 * ✅ Client has auth methods (signUp, signIn, signOut, getSession)
 * ✅ Client has database query methods (from)
 * ✅ Client is singleton (same instance on multiple imports)
 * ✅ createClient called only once (singleton pattern)
 * ✅ Anon key is valid JWT format
 * ✅ URL is valid HTTPS Supabase URL
 * ✅ Module exports only the client
 *
 * Why this matters:
 * - Client-side auth depends on correct credentials
 * - Singleton pattern prevents multiple connections
 * - Proper URL/key format ensures connection works
 * - Auth and query methods enable full Supabase functionality
 */
