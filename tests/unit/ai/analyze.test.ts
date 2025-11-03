/**
 * UNIT TEST TUTORIAL: Testing the Mock AI Analysis Function
 *
 * This file tests the mock AI that free users see.
 * We want to ensure it always returns valid results.
 *
 * Test Structure:
 * 1. Import the function we're testing
 * 2. Import testing utilities (describe, test, expect)
 * 3. Group related tests together
 * 4. Write individual test cases
 */

// STEP 1: Import the function we want to test
// This is the mock AI analysis function from your codebase
import { analyzeCreative } from '@/lib/ai/analyze';

// STEP 2: Import testing utilities from Vitest
// - describe: Groups related tests together
// - test: Defines a single test case
// - expect: Makes assertions about what should happen
import { describe, test, expect } from 'vitest';

/**
 * DESCRIBE BLOCK: Groups related tests together
 *
 * Think of this as a folder for tests about the same thing.
 * Here we're testing the "analyzeCreative" function.
 */
describe('analyzeCreative', () => {
  /**
   * TEST CASE 1: Headline Extraction
   *
   * What we're testing: Can the function find the headline in ad copy?
   * Why it matters: Headlines are the first thing users see
   *
   * Test structure:
   * 1. Arrange: Set up test data
   * 2. Act: Call the function
   * 3. Assert: Check if results are correct
   *
   * IMPORTANT: Notice the "async" keyword before the arrow function.
   * This is required because analyzeCreative() is an async function.
   */
  test('extracts headline from ad copy', async () => {
    // ARRANGE: Create test input
    const adCopy = 'Get 50% Off Today! Free Shipping. Limited Time Only.';
    const cta = 'Shop Now';

    // ACT: Call the function we're testing
    // Notice the "await" keyword - this waits for the Promise to resolve
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Check if the headline is extracted correctly
    // The function removes punctuation when extracting the headline
    expect(result.headline).toBe('Get 50% Off Today'); // No punctuation!

    // Also check the headline length categorization
    expect(result.headline_length).toBe('short'); // 19 chars = "short" category
  });

  /**
   * TEST CASE 2: Urgency Emotion Detection
   *
   * What we're testing: Does it detect urgency words like "today", "limited"?
   * Why it matters: Emotion is a key driver of ad performance
   */
  test('detects urgency emotion from keywords', async () => {
    // ARRANGE: Ad copy with urgency words
    const adCopy = 'Limited Time Offer! Act Now!';
    const cta = 'Shop Now';

    // ACT: Run analysis
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Should detect "urgency" emotion
    expect(result.emotion).toBe('urgency');
  });

  /**
   * TEST CASE 3: Trust Emotion Detection
   *
   * What we're testing: Does it detect trust words like "guarantee", "certified"?
   * Why it matters: Trust builds confidence in the offer
   */
  test('detects trust emotion from keywords', async () => {
    // ARRANGE: Ad copy with trust words
    const adCopy = 'Money-Back Guarantee. Certified Quality. Risk-Free Trial.';
    const cta = 'Try Now';

    // ACT: Run analysis
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Should detect "trust" emotion
    expect(result.emotion).toBe('trust');
  });

  /**
   * TEST CASE 4: Informative Tone Detection (Default)
   *
   * What we're testing: Does it default to "informative" when no keywords match?
   * Why it matters: The code has specific tone categories with keyword triggers
   *
   * Actual tone categories:
   * - 'urgent' (exclusive, limited)
   * - 'curious' (discover, explore)
   * - 'promotional' (save, deal)
   * - 'exciting' (contains !)
   * - 'informative' (default when nothing else matches)
   */
  test('identifies informative tone as default', async () => {
    // ARRANGE: Formal copy with no specific keywords
    const adCopy = 'Enhance your enterprise infrastructure with our innovative solutions.';
    const cta = 'Learn More';

    // ACT: Run analysis
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Should detect "informative" tone (default)
    expect(result.copy_tone).toBe('informative');
  });

  /**
   * TEST CASE 5: Promotional Tone Detection
   *
   * What we're testing: Does it identify promotional language?
   * Why it matters: Promotional tone triggers on "save" or "deal" keywords
   */
  test('identifies promotional tone', async () => {
    // ARRANGE: Promotional ad copy with "deals" keyword
    const adCopy = 'Hey! Check out these awesome deals just for you!';
    const cta = 'Shop Now';

    // ACT: Run analysis
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Should detect "promotional" tone (contains "deals")
    expect(result.copy_tone).toBe('promotional');
  });

  /**
   * TEST CASE 6: Edge Case - Empty Ad Copy
   *
   * What we're testing: What happens if ad copy is empty?
   * Why it matters: Users might forget to enter ad copy
   *
   * This is called an "edge case" - testing unusual inputs
   * to make sure your code doesn't crash.
   */
  test('handles empty ad copy gracefully', async () => {
    // ARRANGE: Empty ad copy
    const adCopy = '';
    const cta = 'Click Here';

    // ACT: Run analysis (should not crash!)
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Should return default values (not undefined!)
    expect(result).toBeDefined(); // Result exists
    expect(result.headline).toBe('[No headline provided]'); // Default headline
    expect(result.emotion).toBe('neutral'); // Default emotion
    expect(result.copy_tone).toBe('informative'); // Default tone
    expect(result.headline_length).toBe('short'); // Default length

    // Recommendations should still be generated
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  /**
   * TEST CASE 7: Edge Case - Missing CTA
   *
   * What we're testing: What if there's no call-to-action?
   * Why it matters: Users might analyze ads without CTAs
   */
  test('handles missing CTA gracefully', async () => {
    // ARRANGE: No CTA provided
    const adCopy = 'Amazing product with incredible features!';
    const cta = undefined; // Missing CTA

    // ACT: Run analysis
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Should still work
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.recommendations).toBeDefined();
  });

  /**
   * TEST CASE 8: Complete Result Structure
   *
   * What we're testing: Does the result have ALL required fields?
   * Why it matters: Missing fields would break the UI
   *
   * This test ensures the function ALWAYS returns a complete result.
   */
  test('returns complete AnalysisResult structure', async () => {
    // ARRANGE: Standard test input
    const adCopy = 'Save 30% on Premium Features! Upgrade Today.';
    const cta = 'Upgrade Now';

    // ACT: Run analysis
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: Check EVERY field exists
    expect(result).toHaveProperty('headline');
    expect(result).toHaveProperty('headline_length');
    expect(result).toHaveProperty('emotion');
    expect(result).toHaveProperty('copy_tone');
    expect(result).toHaveProperty('primary_color');
    expect(result).toHaveProperty('visual_elements');
    expect(result).toHaveProperty('performance_driver');
    expect(result).toHaveProperty('recommendations');

    // Check data types are correct
    expect(typeof result.headline).toBe('string');
    expect(typeof result.headline_length).toBe('string'); // 'short' | 'medium' | 'long'
    expect(Array.isArray(result.visual_elements)).toBe(true);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  /**
   * TEST CASE 9: Recommendations Generation
   *
   * What we're testing: Are recommendations always provided?
   * Why it matters: Recommendations are the key value of the analysis
   */
  test('generates at least one recommendation', async () => {
    // ARRANGE
    const adCopy = 'Buy now!';
    const cta = 'Buy';

    // ACT
    const result = await analyzeCreative(null, adCopy, cta);

    // ASSERT: There should be at least 1 recommendation
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);

    // Each recommendation should be a non-empty string
    result.recommendations.forEach(rec => {
      expect(typeof rec).toBe('string');
      expect(rec.length).toBeGreaterThan(0);
    });
  });

  /**
   * TEST CASE 10: Edge Case - Very Long Ad Copy
   *
   * What we're testing: Can it handle huge ad copy?
   * Why it matters: Users might paste entire landing pages
   */
  test('handles very long ad copy without crashing', async () => {
    // ARRANGE: Generate 5000+ character ad copy
    const longAdCopy = 'This is a very long ad. '.repeat(250); // ~6000 chars
    const cta = 'Click';

    // ACT: Run analysis (should not crash or timeout)
    const result = await analyzeCreative(null, longAdCopy, cta);

    // ASSERT: Still returns valid result
    expect(result).toBeDefined();
    expect(result.headline).toBeDefined();
    expect(result.emotion).toBeDefined();
  });
});

/**
 * CONGRATULATIONS! You've written your first test suite.
 *
 * What we tested:
 * ✅ Headline extraction works correctly
 * ✅ Emotion detection (urgency, trust) works
 * ✅ Tone detection (professional, friendly) works
 * ✅ Edge cases don't crash the function (empty input, long input)
 * ✅ Result structure is always complete
 * ✅ Recommendations are always generated
 *
 * Next steps:
 * 1. Run this test: npm test
 * 2. See all tests pass (green checkmarks!)
 * 3. Try breaking a test to see it fail
 * 4. Write more tests for other functions
 *
 * Key Testing Concepts Learned:
 * - Arrange-Act-Assert pattern
 * - Edge case testing
 * - Structure validation
 * - Testing error handling
 */
