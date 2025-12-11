import { Creative, Analysis } from '@/lib/types';

export interface DashboardMetrics {
  creativeDiversity: {
    score: number;
    maxScore: number;
    description: string;
  };
  topInsight: {
    value: string;
    description: string;
  } | null;
  performanceStats: {
    avgCTR: number | null;
    totalImpressions: number;
    totalClicks: number;
    creativesWithData: number;
  };
}

/**
 * Calculate Creative Diversity Score based on variety of tested creative variables
 * Factors: unique emotions, copy tones, visual elements, CTAs, colors
 */
export function calculateCreativeDiversityScore(
  creatives: Creative[],
  analyses: Analysis[]
): { score: number; maxScore: number; description: string } {
  if (analyses.length === 0) {
    return {
      score: 0,
      maxScore: 100,
      description: 'No analyzed creatives yet'
    };
  }

  const uniqueEmotions = new Set<string>();
  const uniqueTones = new Set<string>();
  const uniqueColors = new Set<string>();
  const uniqueCTAs = new Set<string>();
  const uniqueVisualElements = new Set<string>();

  analyses.forEach(analysis => {
    const result = analysis.analysis_result;
    if (result.emotion) uniqueEmotions.add(result.emotion.toLowerCase());
    if (result.copy_tone) uniqueTones.add(result.copy_tone.toLowerCase());
    if (result.primary_color) uniqueColors.add(result.primary_color.toLowerCase());
    if (result.cta) uniqueCTAs.add(result.cta.toLowerCase());
    if (result.visual_elements) {
      result.visual_elements.forEach(elem => uniqueVisualElements.add(elem.toLowerCase()));
    }
  });

  // Scoring algorithm:
  // Max 20 points per category, 100 total
  const emotionScore = Math.min(uniqueEmotions.size * 5, 20);
  const toneScore = Math.min(uniqueTones.size * 5, 20);
  const colorScore = Math.min(uniqueColors.size * 4, 20);
  const ctaScore = Math.min(uniqueCTAs.size * 4, 20);
  const visualScore = Math.min(uniqueVisualElements.size * 2, 20);

  const totalScore = emotionScore + toneScore + colorScore + ctaScore + visualScore;

  return {
    score: Math.round(totalScore),
    maxScore: 100,
    description: `${analyses.length} analyzed creative${analyses.length !== 1 ? 's' : ''}`
  };
}

/**
 * Find the most impactful insight from analyzed creatives
 * Priority: 1) Best performing element 2) Most common successful pattern
 */
export function findTopInsight(
  creatives: Creative[],
  analyses: Analysis[]
): { value: string; description: string } | null {
  if (analyses.length === 0 || creatives.length === 0) {
    return null;
  }

  // Join creatives with analyses and performance data
  const creativesWithAnalysis = creatives
    .map(creative => ({
      creative,
      analysis: analyses.find(a => a.creative_id === creative.id)
    }))
    .filter(item => item.analysis && item.creative.performance?.ctr !== undefined);

  if (creativesWithAnalysis.length === 0) {
    // Fallback: show most common emotion or tone
    const emotions = analyses
      .map(a => a.analysis_result.emotion)
      .filter(Boolean) as string[];

    if (emotions.length > 0) {
      const emotionCounts = emotions.reduce((acc, emotion) => {
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommon = Object.entries(emotionCounts)
        .sort(([, a], [, b]) => b - a)[0];

      return {
        value: `${mostCommon[0]} emotion`,
        description: `Most frequently used in your creatives`
      };
    }

    return null;
  }

  // Find best performing creative
  const sorted = creativesWithAnalysis.sort((a, b) =>
    (b.creative.performance?.ctr || 0) - (a.creative.performance?.ctr || 0)
  );

  const best = sorted[0];
  const bestCTR = best.creative.performance?.ctr || 0;
  const avgCTR = creativesWithAnalysis.reduce((sum, item) =>
    sum + (item.creative.performance?.ctr || 0), 0
  ) / creativesWithAnalysis.length;

  const improvement = ((bestCTR - avgCTR) / avgCTR * 100).toFixed(0);

  // Determine what made it successful
  const analysis = best.analysis!.analysis_result;
  let driver = analysis.performance_driver;

  if (!driver) {
    // Infer from analysis data
    if (analysis.emotion) {
      driver = `${analysis.emotion} emotion`;
    } else if (analysis.copy_tone) {
      driver = `${analysis.copy_tone} tone`;
    } else if (analysis.visual_elements && analysis.visual_elements.length > 0) {
      driver = analysis.visual_elements[0];
    }
  }

  return {
    value: `+${improvement}% CTR`,
    description: driver ? `${driver} drove the best performance` : 'compared to average'
  };
}

/**
 * Calculate aggregate performance statistics
 */
export function calculatePerformanceStats(creatives: Creative[]) {
  const creativesWithPerf = creatives.filter(c => c.performance?.ctr !== undefined);

  if (creativesWithPerf.length === 0) {
    return {
      avgCTR: null,
      totalImpressions: 0,
      totalClicks: 0,
      creativesWithData: 0
    };
  }

  const totalCTR = creativesWithPerf.reduce((sum, c) => sum + (c.performance?.ctr || 0), 0);
  const totalImpressions = creativesWithPerf.reduce((sum, c) => sum + (c.performance?.impressions || 0), 0);
  const totalClicks = creativesWithPerf.reduce((sum, c) => sum + (c.performance?.clicks || 0), 0);

  return {
    avgCTR: totalCTR / creativesWithPerf.length,
    totalImpressions,
    totalClicks,
    creativesWithData: creativesWithPerf.length
  };
}

/**
 * Get display-ready metrics for dashboard
 */
export function getDashboardMetrics(
  creatives: Creative[],
  analyses: Analysis[]
): DashboardMetrics {
  return {
    creativeDiversity: calculateCreativeDiversityScore(creatives, analyses),
    topInsight: findTopInsight(creatives, analyses),
    performanceStats: calculatePerformanceStats(creatives)
  };
}
