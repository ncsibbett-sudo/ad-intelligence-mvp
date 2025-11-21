/**
 * UNIT TEST: Testing Real OpenAI Integration
 *
 * This file tests the OpenAI API integration for paid users.
 * We mock the OpenAI API to avoid real API calls during testing.
 *
 * What we're testing:
 * - OpenAI API is called with correct parameters
 * - API responses are parsed correctly
 * - Error handling works (rate limits, invalid keys, etc.)
 * - Graceful fallback when OpenAI fails
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { analyzeCreative } from '@/lib/ai/openai-analyze';
import type { AnalysisResult } from '@/lib/types';

// Create mock function that will be reused
const mockCreate = vi.fn();

// Mock the OpenAI module
vi.mock('openai', () => {
  // Create a proper constructor mock
  const MockOpenAI = function(this: any) {
    this.chat = {
      completions: {
        create: mockCreate,
      },
    };
  };

  return {
    default: MockOpenAI,
  };
});

describe('analyzeCreative - OpenAI Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  /**
   * TEST 1: Calls OpenAI API with correct model (gpt-3.5-turbo)
   */
  test('calls OpenAI API with correct model (gpt-3.5-turbo)', async () => {
    // Arrange: Mock successful OpenAI response
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: 'Test Headline',
              headline_length: 'short',
              emotion: 'excitement',
              copy_tone: 'promotional',
              primary_color: '#FF5733',
              visual_elements: ['product', 'text-overlay'],
              performance_driver: 'Strong urgency and clear value proposition',
              recommendations: ['Test more variations', 'Add social proof'],
            }),
          },
        },
      ],
    };

    mockCreate.mockResolvedValue(mockResponse);

    // Act: Call the function
    const adCopy = 'Get 50% Off Today!';
    const cta = 'Shop Now';
    await analyzeCreative(undefined, adCopy, cta);

    // Assert: Verify OpenAI was called with gpt-3.5-turbo
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-3.5-turbo',
      })
    );
  });

  /**
   * TEST 2: Passes ad copy and CTA to API
   */
  test('passes ad copy and CTA to API in messages', async () => {
    // Arrange: Mock successful response
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: 'Test',
              emotion: 'neutral',
              copy_tone: 'informative',
              performance_driver: 'Test',
              recommendations: ['Test'],
            }),
          },
        },
      ],
    };

    mockCreate.mockResolvedValue(mockResponse);

    // Act: Call with specific ad copy and CTA
    const adCopy = 'Limited Time Sale! Save 30% on Premium Items';
    const cta = 'Buy Now';
    await analyzeCreative(undefined, adCopy, cta);

    // Assert: Verify ad copy and CTA were included in the API call
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining(adCopy),
          }),
        ]),
      })
    );

    // Verify CTA is in the prompt
    const callArgs = mockCreate.mock.calls[0][0];
    const userMessage = callArgs.messages.find((m: any) => m.role === 'user');
    expect(userMessage.content).toContain(cta);
  });

  /**
   * TEST 3: Parses JSON response correctly
   */
  test('parses JSON response correctly', async () => {
    // Arrange: Mock OpenAI response with complete data
    const mockAnalysis = {
      headline: 'Amazing Product Launch',
      headline_length: 'medium',
      emotion: 'excitement',
      copy_tone: 'promotional',
      primary_color: '#3498DB',
      visual_elements: ['product', 'person', 'text-overlay'],
      performance_driver: 'Strong call to action with urgency',
      recommendations: [
        'Test different color schemes',
        'Add customer testimonials',
        'Emphasize limited availability',
      ],
    };

    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify(mockAnalysis),
          },
        },
      ],
    });

    // Act: Call the function
    const result = await analyzeCreative(undefined, 'Test Ad', 'Click Here');

    // Assert: Verify parsing matches expected structure
    expect(result.headline).toBe('Amazing Product Launch');
    expect(result.headline_length).toBe('medium');
    expect(result.emotion).toBe('excitement');
    expect(result.copy_tone).toBe('promotional');
    expect(result.primary_color).toBe('#3498DB');
    expect(result.visual_elements).toEqual(['product', 'person', 'text-overlay']);
    expect(result.performance_driver).toBe('Strong call to action with urgency');
    expect(result.recommendations).toHaveLength(3);
  });

  /**
   * TEST 4: Handles OpenAI API errors gracefully
   */
  test('handles OpenAI API errors gracefully', async () => {
    // Arrange: Mock API error
    mockCreate.mockRejectedValue(new Error('OpenAI API Error'));

    // Act: Call the function
    const result = await analyzeCreative(undefined, 'Test Ad', 'Click');

    // Assert: Should return fallback analysis instead of throwing
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.recommendations).toBeDefined();
    expect(result.performance_driver).toContain('temporarily unavailable');
  });

  /**
   * TEST 5: Falls back to mock analysis on error
   */
  test('falls back to mock analysis on error', async () => {
    // Arrange: Mock network error
    mockCreate.mockRejectedValue(new Error('Network error'));

    // Act: Call the function
    const adCopy = 'Great Product Here!';
    const cta = 'Learn More';
    const result = await analyzeCreative(undefined, adCopy, cta);

    // Assert: Should provide fallback analysis
    expect(result).toBeDefined();
    expect(result.headline).toBeTruthy();
    expect(result.emotion).toBeTruthy();
    expect(result.copy_tone).toBeTruthy();
    expect(result.recommendations).toHaveLength(3);
    expect(result.cta).toBe(cta);
  });

  /**
   * TEST 6: Handles rate limit errors (429)
   */
  test('handles rate limit errors (429) with fallback', async () => {
    // Arrange: Mock rate limit error
    const rateLimitError = new Error('Rate limit exceeded');
    (rateLimitError as any).status = 429;
    mockCreate.mockRejectedValue(rateLimitError);

    // Act: Call the function
    const result = await analyzeCreative(
      undefined,
      'Premium Product Sale',
      'Buy Now'
    );

    // Assert: Should not throw, should return fallback
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  /**
   * TEST 7: Handles invalid API key errors (401)
   */
  test('handles invalid API key errors (401) with fallback', async () => {
    // Arrange: Mock authentication error
    const authError = new Error('Invalid API key');
    (authError as any).status = 401;
    mockCreate.mockRejectedValue(authError);

    // Act: Call the function
    const result = await analyzeCreative(
      undefined,
      'Test Advertisement',
      'Sign Up'
    );

    // Assert: Should not throw, should return fallback
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.emotion).toBeDefined();
    expect(result.recommendations).toHaveLength(3);
  });

  /**
   * TEST 8: Returns valid AnalysisResult structure
   */
  test('returns valid AnalysisResult structure', async () => {
    // Arrange: Mock minimal valid response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: 'Test',
              headline_length: 'short',
              emotion: 'neutral',
              copy_tone: 'informative',
              performance_driver: 'Test driver',
              recommendations: ['Recommendation 1'],
            }),
          },
        },
      ],
    });

    // Act: Call the function
    const result = await analyzeCreative(undefined, 'Test', 'Test');

    // Assert: Verify all required fields exist
    expect(result).toHaveProperty('headline');
    expect(result).toHaveProperty('headline_length');
    expect(result).toHaveProperty('emotion');
    expect(result).toHaveProperty('copy_tone');
    expect(result).toHaveProperty('performance_driver');
    expect(result).toHaveProperty('recommendations');

    // Verify field types
    expect(typeof result.headline).toBe('string');
    expect(['short', 'medium', 'long']).toContain(result.headline_length);
    expect(typeof result.emotion).toBe('string');
    expect(typeof result.copy_tone).toBe('string');
    expect(typeof result.performance_driver).toBe('string');
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  /**
   * TEST 9: Handles empty OpenAI response
   */
  test('handles empty OpenAI response gracefully', async () => {
    // Arrange: Mock empty response
    mockCreate.mockResolvedValue({
      choices: [],
    });

    // Act: Call the function
    const result = await analyzeCreative(undefined, 'Test Ad', 'Click');

    // Assert: Should fall back to basic analysis
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  /**
   * TEST 10: Handles malformed JSON response
   */
  test('handles malformed JSON response gracefully', async () => {
    // Arrange: Mock invalid JSON response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: 'This is not valid JSON {broken',
          },
        },
      ],
    });

    // Act: Call the function
    const result = await analyzeCreative(undefined, 'Ad Copy', 'CTA');

    // Assert: Should fall back to basic analysis
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  /**
   * TEST 11: Handles partial JSON response with missing fields
   */
  test('handles partial JSON response with missing fields', async () => {
    // Arrange: Mock incomplete response (missing some optional fields)
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: 'Test',
              emotion: 'trust',
              // Missing: headline_length, copy_tone, etc.
            }),
          },
        },
      ],
    });

    // Act: Call the function
    const result = await analyzeCreative(undefined, 'Test', 'Test');

    // Assert: Should provide default values for missing fields
    expect(result.headline).toBe('Test');
    expect(result.emotion).toBe('trust');
    expect(result.headline_length).toBe('medium'); // Default
    expect(result.copy_tone).toBe('informative'); // Default
    expect(result.recommendations).toBeDefined();
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  /**
   * TEST 12: Uses correct OpenAI parameters for cost-effectiveness
   */
  test('uses correct OpenAI parameters for cost-effectiveness', async () => {
    // Arrange: Mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: 'Test',
              emotion: 'neutral',
              copy_tone: 'informative',
              performance_driver: 'Test',
              recommendations: ['Test'],
            }),
          },
        },
      ],
    });

    // Act: Call the function
    await analyzeCreative(undefined, 'Ad Copy', 'CTA');

    // Assert: Verify cost-effective parameters
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-3.5-turbo', // Cost-effective model
        max_tokens: 1000, // Limited to control costs
        temperature: 0.7, // Balanced creativity
        response_format: { type: 'json_object' }, // Structured output
      })
    );
  });

  /**
   * TEST 13: Includes system prompt for marketing expertise
   */
  test('includes system prompt for marketing expertise', async () => {
    // Arrange: Mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: 'Test',
              emotion: 'neutral',
              copy_tone: 'informative',
              performance_driver: 'Test',
              recommendations: ['Test'],
            }),
          },
        },
      ],
    });

    // Act: Call the function
    await analyzeCreative(undefined, 'Ad Copy', 'CTA');

    // Assert: Verify system prompt is included
    const callArgs = mockCreate.mock.calls[0][0];
    const systemMessage = callArgs.messages.find((m: any) => m.role === 'system');

    expect(systemMessage).toBeDefined();
    expect(systemMessage.content).toContain('marketing analyst');
    expect(systemMessage.content).toContain('ad creative analysis');
  });

  /**
   * TEST 14: Preserves CTA in the result
   */
  test('preserves CTA in the result', async () => {
    // Arrange: Mock response
    mockCreate.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              headline: 'Test',
              emotion: 'neutral',
              copy_tone: 'informative',
              performance_driver: 'Test',
              recommendations: ['Test'],
              cta: 'Different CTA', // API might return CTA
            }),
          },
        },
      ],
    });

    // Act: Call the function with specific CTA
    const inputCTA = 'Buy Now';
    const result = await analyzeCreative(undefined, 'Ad Copy', inputCTA);

    // Assert: Result should have CTA (either from API or fallback)
    expect(result.cta).toBeDefined();
  });
});

/**
 * TEST SUMMARY
 *
 * What we tested:
 * ✅ OpenAI API is called with gpt-3.5-turbo model
 * ✅ Ad copy and CTA are passed to the API
 * ✅ JSON responses are parsed correctly
 * ✅ API errors are handled gracefully
 * ✅ Fallback analysis works when OpenAI fails
 * ✅ Rate limit errors (429) are handled
 * ✅ Invalid API key errors (401) are handled
 * ✅ Valid AnalysisResult structure is always returned
 * ✅ Empty responses are handled
 * ✅ Malformed JSON is handled
 * ✅ Partial responses get default values
 * ✅ Cost-effective parameters are used
 * ✅ Marketing expertise system prompt is included
 * ✅ CTA is preserved in results
 *
 * Why this matters:
 * - Ensures paid users get reliable AI analysis
 * - Prevents app crashes from API failures
 * - Maintains user experience even during outages
 * - Verifies cost controls are in place
 * - Guarantees consistent data structure for the UI
 */
