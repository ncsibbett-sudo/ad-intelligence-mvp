'use client';

import { Creative, Analysis } from '@/lib/types';
import { X, BarChart } from 'lucide-react';

interface DiversityBreakdownModalProps {
  creatives: Creative[];
  analyses: Analysis[];
  onClose: () => void;
}

export function DiversityBreakdownModal({
  creatives,
  analyses,
  onClose,
}: DiversityBreakdownModalProps) {
  // Calculate breakdown metrics
  const analyzedCreatives = creatives.filter(c =>
    analyses.some(a => a.creative_id === c.id)
  );

  const uniqueEmotions = new Set(
    analyses
      .map(a => a.analysis_result?.emotion)
      .filter(Boolean)
  );

  const uniqueTones = new Set(
    analyses
      .map(a => a.analysis_result?.copy_tone)
      .filter(Boolean)
  );

  const uniqueColors = new Set(
    analyses
      .map(a => a.analysis_result?.primary_color)
      .filter(Boolean)
  );

  const uniqueCTAs = new Set(
    analyzedCreatives
      .map(c => c.cta)
      .filter(Boolean)
  );

  const allVisualElements = analyses
    .flatMap(a => a.analysis_result?.visual_elements || [])
    .filter(Boolean);
  const uniqueVisualElements = new Set(allVisualElements);

  // Calculate scores
  const emotionScore = Math.min(uniqueEmotions.size * 5, 25);
  const toneScore = Math.min(uniqueTones.size * 5, 25);
  const colorScore = Math.min(uniqueColors.size * 4, 20);
  const ctaScore = Math.min(uniqueCTAs.size * 4, 20);
  const visualScore = Math.min(uniqueVisualElements.size * 2, 10);
  const totalScore = emotionScore + toneScore + colorScore + ctaScore + visualScore;

  const categories = [
    {
      name: 'Emotions Tested',
      score: emotionScore,
      maxScore: 25,
      count: uniqueEmotions.size,
      items: Array.from(uniqueEmotions),
      description: '5 points per unique emotion (max 5)',
    },
    {
      name: 'Copy Tones',
      score: toneScore,
      maxScore: 25,
      count: uniqueTones.size,
      items: Array.from(uniqueTones),
      description: '5 points per unique tone (max 5)',
    },
    {
      name: 'Color Palettes',
      score: colorScore,
      maxScore: 20,
      count: uniqueColors.size,
      items: Array.from(uniqueColors),
      description: '4 points per unique color (max 5)',
    },
    {
      name: 'Call-to-Actions',
      score: ctaScore,
      maxScore: 20,
      count: uniqueCTAs.size,
      items: Array.from(uniqueCTAs),
      description: '4 points per unique CTA (max 5)',
    },
    {
      name: 'Visual Elements',
      score: visualScore,
      maxScore: 10,
      count: uniqueVisualElements.size,
      items: Array.from(uniqueVisualElements),
      description: '2 points per unique element (max 5)',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <BarChart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Creative Diversity Score</h2>
                <p className="text-blue-100 text-sm mt-1">
                  {totalScore}/100 points from {analyzedCreatives.length} analyzed creatives
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {analyzedCreatives.length === 0 ? (
            <div className="text-center py-12">
              <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Analyzed Creatives Yet
              </h3>
              <p className="text-gray-600">
                Analyze some creatives to see your diversity breakdown
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">What is Diversity Score?</h3>
                <p className="text-sm text-gray-700">
                  Your diversity score measures how many different creative variables you've tested.
                  Higher diversity means you're experimenting with more angles, emotions, visual styles,
                  and messaging approaches - helping you discover what resonates best with your audience.
                </p>
              </div>

              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.name}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-900">{category.name}</h4>
                          <span className="text-sm font-bold text-blue-600">
                            {category.score}/{category.maxScore}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{category.description}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                      />
                    </div>

                    {/* Items */}
                    {category.items.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {category.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {category.items.length === 0 && (
                      <p className="text-sm text-gray-400 italic">No items tested yet</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💡 Pro Tip</h4>
                <p className="text-sm text-yellow-800">
                  To increase your diversity score, try testing creatives with different emotional
                  appeals, messaging tones, color schemes, and visual styles. The more variety you
                  test, the more data you'll have to identify what works best!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
