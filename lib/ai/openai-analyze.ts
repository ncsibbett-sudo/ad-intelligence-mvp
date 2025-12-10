import OpenAI from 'openai';
import { AnalysisResult } from '@/lib/types';

// Lazy-load OpenAI client to avoid build-time initialization issues
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'placeholder',
  });
}

/**
 * Real AI Analysis using GPT-4 Vision
 * Analyzes ad creatives for marketing insights
 */
export async function analyzeCreative(
  imageUrl?: string,
  adCopy?: string,
  cta?: string
): Promise<AnalysisResult> {
  try {
    // Build the analysis prompt
    const prompt = buildAnalysisPrompt(adCopy, cta);

    // Prepare messages for OpenAI (text-only for GPT-3.5 Turbo)
    // Note: GPT-3.5 Turbo doesn't support vision, so we analyze based on ad copy and CTA
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert marketing analyst specializing in ad creative analysis.
Analyze the provided ad creative and return insights in JSON format.
Be specific, actionable, and focus on what drives performance.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Call OpenAI API with cost-effective model
    // GPT-3.5 Turbo: ~$0.002 per analysis (99% profit margin on $29/month)
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      response_format: { type: 'json_object' },
      max_tokens: 1000,
      temperature: 0.7,
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const analysis = JSON.parse(content);

    // Validate and structure the response
    return structureAnalysis(analysis);

  } catch (error) {
    console.error('OpenAI analysis error:', error);

    // Fallback to basic analysis if OpenAI fails
    return fallbackAnalysis(adCopy, cta);
  }
}

function buildAnalysisPrompt(adCopy?: string, cta?: string): string {
  let prompt = `Analyze this ad creative and provide detailed marketing insights.

`;

  if (adCopy) {
    prompt += `Ad Copy: "${adCopy}"\n`;
  }

  if (cta) {
    prompt += `Call to Action: "${cta}"\n`;
  }

  prompt += `
Return a JSON object with the following structure:
{
  "headline": "The main headline or key message (extract or summarize)",
  "headline_length": "short|medium|long (based on character count)",
  "emotion": "The primary emotion (excitement|urgency|trust|curiosity|aspiration|neutral)",
  "copy_tone": "The tone of the copy (urgent|promotional|informative|casual|professional)",
  "primary_color": "The dominant color in the creative (if image provided)",
  "visual_elements": ["array", "of", "visual", "elements", "like product, person, text-overlay"],
  "target_audience": "Detailed description of the specific audience segments this ad is targeting (demographics, psychographics, behaviors, pain points)",
  "performance_driver": "1-2 sentence explanation of what makes this ad effective or what could improve it",
  "recommendations": ["Array of 3-5 SPECIFIC recommendations based on THIS exact ad content - NOT generic advice. Reference specific words, phrases, or elements from the ad. Include suggestions for target audience refinement."]
}

CRITICAL INSTRUCTIONS for recommendations:
- Reference SPECIFIC elements from this ad (e.g., "Change 'Transform Your Life' to..." NOT "Use stronger headlines")
- Suggest which audience segments to prioritize based on the messaging
- Be tactical and implementable, not generic
- Each recommendation must be unique to THIS ad's content

Focus on:
- Target audience analysis: Who is this ad speaking to? What demographics, interests, behaviors?
- Emotional triggers specific to this copy
- Messaging clarity and unique value proposition
- CTA effectiveness for the target audience
- Specific word choices, phrasing, or claims that could be optimized
`;

  return prompt;
}

function structureAnalysis(rawAnalysis: any): AnalysisResult {
  return {
    headline: rawAnalysis.headline || 'Unable to extract headline',
    headline_length: rawAnalysis.headline_length || 'medium',
    emotion: rawAnalysis.emotion || 'neutral',
    copy_tone: rawAnalysis.copy_tone || 'informative',
    primary_color: rawAnalysis.primary_color,
    visual_elements: Array.isArray(rawAnalysis.visual_elements)
      ? rawAnalysis.visual_elements
      : [],
    target_audience: rawAnalysis.target_audience || 'Target audience analysis not available',
    performance_driver: rawAnalysis.performance_driver || 'Analysis completed',
    recommendations: Array.isArray(rawAnalysis.recommendations)
      ? rawAnalysis.recommendations
      : ['Continue testing variations of this creative'],
    cta: rawAnalysis.cta,
  };
}

function fallbackAnalysis(adCopy?: string, cta?: string): AnalysisResult {
  // Basic fallback if OpenAI fails
  return {
    headline: adCopy?.split(/[.!?]/)[0]?.trim() || 'No headline detected',
    headline_length: 'medium',
    emotion: 'neutral',
    copy_tone: 'informative',
    performance_driver: 'AI analysis temporarily unavailable. Basic analysis provided.',
    recommendations: [
      'Test different variations of your ad copy',
      'Ensure your CTA is clear and action-oriented',
      'A/B test with different images',
    ],
    cta: cta,
  };
}

/**
 * Batch analyze multiple creatives
 */
export async function analyzeBatchCreatives(
  creatives: Array<{ imageUrl?: string; adCopy?: string; cta?: string }>
): Promise<AnalysisResult[]> {
  // Process sequentially to avoid rate limits
  const results: AnalysisResult[] = [];

  for (const creative of creatives) {
    const result = await analyzeCreative(
      creative.imageUrl,
      creative.adCopy,
      creative.cta
    );
    results.push(result);

    // Small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}
