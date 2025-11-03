import { AnalysisResult } from '@/lib/types';

/**
 * Mock AI Analysis Function
 * In production, this would call OpenAI, Claude, or a custom ML model
 * For MVP, returns structured analysis based on heuristics
 */
export async function analyzeCreative(
  imageUrl?: string,
  adCopy?: string,
  cta?: string
): Promise<AnalysisResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const analysis: AnalysisResult = {};

  // Analyze headline/copy
  // FIX: Always provide default values even if ad copy is empty
  if (adCopy) {
    const headline = extractHeadline(adCopy);
    analysis.headline = headline;
    analysis.headline_length = categorizeHeadlineLength(headline);
    analysis.copy_tone = analyzeCopyTone(adCopy);
    analysis.emotion = detectEmotion(adCopy);
  } else {
    // Default values for empty ad copy
    analysis.headline = '[No headline provided]';
    analysis.headline_length = 'short';
    analysis.copy_tone = 'informative';
    analysis.emotion = 'neutral';
  }

  // Analyze CTA
  if (cta) {
    analysis.cta = cta;
  }

  // Analyze visual elements (mock)
  // FIX: Always provide primary_color even without an image
  if (imageUrl) {
    analysis.primary_color = mockColorAnalysis();
    analysis.visual_elements = mockVisualElements();
  } else {
    // Default values for no image
    analysis.primary_color = 'blue'; // Default brand color
    analysis.visual_elements = [];
  }

  // Generate performance insights
  analysis.performance_driver = generatePerformanceDriver(analysis);
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

function extractHeadline(copy: string): string {
  const sentences = copy.split(/[.!?]/);
  return sentences[0]?.trim() || copy.substring(0, 50);
}

function categorizeHeadlineLength(headline: string): 'short' | 'medium' | 'long' {
  const length = headline.length;
  if (length < 30) return 'short';
  if (length < 60) return 'medium';
  return 'long';
}

function analyzeCopyTone(copy: string): string {
  const lowerCopy = copy.toLowerCase();

  if (lowerCopy.includes('exclusive') || lowerCopy.includes('limited')) {
    return 'urgent';
  }
  if (lowerCopy.includes('discover') || lowerCopy.includes('explore')) {
    return 'curious';
  }
  if (lowerCopy.includes('save') || lowerCopy.includes('deal')) {
    return 'promotional';
  }
  if (lowerCopy.includes('!')) {
    return 'exciting';
  }
  return 'informative';
}

function detectEmotion(copy: string): string {
  const lowerCopy = copy.toLowerCase();

  const emotionKeywords = {
    excitement: ['amazing', 'incredible', 'wow', 'awesome', 'fantastic'],
    curiosity: ['discover', 'explore', 'find out', 'learn', 'secret'],
    urgency: ['now', 'today', 'limited', 'hurry', 'don\'t miss'],
    trust: ['proven', 'trusted', 'reliable', 'guaranteed', 'certified'],
    aspiration: ['achieve', 'success', 'dream', 'transform', 'elevate'],
  };

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    for (const keyword of keywords) {
      if (lowerCopy.includes(keyword)) {
        return emotion;
      }
    }
  }

  return 'neutral';
}

function mockColorAnalysis(): string {
  const colors = ['blue', 'red', 'green', 'orange', 'purple', 'yellow', 'black', 'white'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function mockVisualElements(): string[] {
  const elements = [
    'product image',
    'lifestyle photo',
    'text overlay',
    'logo',
    'people',
    'gradient background',
    'call-to-action button',
    'price tag',
  ];

  // Return 2-4 random elements
  const count = 2 + Math.floor(Math.random() * 3);
  return elements.sort(() => 0.5 - Math.random()).slice(0, count);
}

function generatePerformanceDriver(analysis: AnalysisResult): string {
  const drivers = [];

  if (analysis.headline_length === 'short') {
    drivers.push('concise messaging');
  }

  if (analysis.emotion === 'urgency' || analysis.emotion === 'excitement') {
    drivers.push('emotional appeal');
  }

  if (analysis.visual_elements && analysis.visual_elements.length > 3) {
    drivers.push('rich visual content');
  }

  if (analysis.cta) {
    drivers.push('clear call-to-action');
  }

  return drivers.length > 0
    ? drivers.join(', ')
    : 'balanced creative elements';
}

function generateRecommendations(analysis: AnalysisResult): string[] {
  const recommendations = [];

  if (analysis.headline_length === 'long') {
    recommendations.push('Consider shortening the headline for better mobile readability');
  }

  if (analysis.emotion === 'neutral') {
    recommendations.push('Add emotional triggers to increase engagement');
  }

  if (!analysis.cta) {
    recommendations.push('Include a clear call-to-action to drive conversions');
  }

  if (analysis.copy_tone === 'informative') {
    recommendations.push('Test more urgent or promotional copy to boost click-through rates');
  }

  // Always provide at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push('Test variations of this creative with different headlines');
  }

  return recommendations;
}

/**
 * Batch analyze multiple creatives
 */
export async function analyzeBatchCreatives(
  creatives: Array<{ imageUrl?: string; adCopy?: string; cta?: string }>
): Promise<AnalysisResult[]> {
  const results = await Promise.all(
    creatives.map(c => analyzeCreative(c.imageUrl, c.adCopy, c.cta))
  );
  return results;
}
