/**
 * Quick OpenAI API Test Script
 * Tests that your API key works and can generate AI analysis
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API connection...\n');

  try {
    // Test with a simple ad analysis request
    const testAd = {
      headline: 'Get 50% Off Premium Software Today',
      body: 'Limited time offer! Transform your business with our award-winning platform.',
      cta: 'Start Free Trial',
    };

    console.log('📝 Test Ad:');
    console.log(`   Headline: ${testAd.headline}`);
    console.log(`   Body: ${testAd.body}`);
    console.log(`   CTA: ${testAd.cta}\n`);
    console.log('⏳ Calling OpenAI API (this may take 5-10 seconds)...\n');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert ad copywriter. Analyze ads and provide brief insights.',
        },
        {
          role: 'user',
          content: `Analyze this ad and respond with JSON only:

Headline: ${testAd.headline}
Body: ${testAd.body}
CTA: ${testAd.cta}

Return JSON with: emotion (string), tone (string), and one recommendation (string).`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content;
    console.log('✅ SUCCESS! OpenAI API is working!\n');
    console.log('🤖 AI Response:');
    console.log(response);
    console.log('\n📊 Token Usage:');
    console.log(`   Prompt tokens: ${completion.usage.prompt_tokens}`);
    console.log(`   Completion tokens: ${completion.usage.completion_tokens}`);
    console.log(`   Total tokens: ${completion.usage.total_tokens}`);
    console.log(`   Estimated cost: $${(completion.usage.total_tokens / 1000 * 0.002).toFixed(6)}`);
    console.log('\n✨ Your OpenAI integration is ready to use!');

  } catch (error) {
    console.error('❌ ERROR testing OpenAI API:');

    if (error.status === 401) {
      console.error('   Authentication failed - check your API key');
    } else if (error.status === 429) {
      console.error('   Rate limit exceeded or billing issue');
      console.error('   Make sure you have credits/payment method set up');
    } else if (error.status === 500) {
      console.error('   OpenAI server error - try again in a moment');
    } else {
      console.error(`   ${error.message}`);
    }

    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Check API key is correct in .env.local');
    console.error('   2. Verify you have payment method at platform.openai.com/settings/organization/billing');
    console.error('   3. Make sure you have credits/prepaid balance');

    process.exit(1);
  }
}

// Run the test
testOpenAI();
