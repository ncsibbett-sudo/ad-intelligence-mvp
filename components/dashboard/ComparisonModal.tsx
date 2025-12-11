'use client';

import { Creative, Analysis } from '@/lib/types';
import { X, TrendingUp, TrendingDown, Minus, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ComparisonModalProps {
  creatives: (Creative & { analysis?: Analysis })[];
  onClose: () => void;
}

export function ComparisonModal({ creatives, onClose }: ComparisonModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const getComparisonIcon = (value1?: number, value2?: number) => {
    if (value1 === undefined || value2 === undefined) return <Minus className="w-4 h-4 text-gray-400" />;
    if (value1 > value2) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (value1 < value2) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatMetric = (value?: number, isPercentage?: boolean) => {
    if (value === undefined) return 'N/A';
    if (isPercentage) return `${value.toFixed(2)}%`;
    return value.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="
        relative w-full max-w-6xl max-h-[90vh] overflow-auto
        bg-white rounded-2xl shadow-2xl
        animate-scale-in
      ">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Compare Creatives</h2>
              <p className="text-sm text-gray-600 mt-1">
                Side-by-side comparison of {creatives.length} creatives
              </p>
            </div>
            <button
              onClick={onClose}
              className="
                p-2 rounded-lg hover:bg-gray-100 transition-colors
                text-gray-400 hover:text-gray-600
              "
              aria-label="Close comparison"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="p-6">
          <div className={`grid gap-6 ${creatives.length === 2 ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {creatives.map((creative, index) => (
              <div key={creative.id} className="space-y-4">
                {/* Creative Header */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">
                      Creative {index + 1}
                    </span>
                    <span
                      className={`
                        px-2 py-1 rounded-full text-xs font-medium
                        ${
                          creative.source_type === 'own'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }
                      `}
                    >
                      {creative.source_type === 'own' ? 'My Ad' : 'Competitor'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {creative.brand_name || 'Untitled'}
                  </h3>
                </div>

                {/* Image */}
                {creative.ad_image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={creative.ad_image_url}
                      alt={creative.brand_name || 'Ad'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Creative Details */}
                <div className="space-y-3">
                  {creative.ad_copy && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Ad Copy
                      </label>
                      <p className="text-sm text-gray-900 mt-1">{creative.ad_copy}</p>
                    </div>
                  )}

                  {creative.cta && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        CTA
                      </label>
                      <p className="text-sm text-blue-600 font-medium mt-1">{creative.cta}</p>
                    </div>
                  )}
                </div>

                {/* Performance Metrics */}
                {creative.performance && Object.keys(creative.performance).some(key => creative.performance[key as keyof typeof creative.performance] !== undefined) && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                      Performance
                    </h4>
                    <div className="space-y-2">
                      {creative.performance.impressions !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Impressions</span>
                          <div className="flex items-center gap-2">
                            {index > 0 && getComparisonIcon(creative.performance.impressions, creatives[index - 1].performance?.impressions)}
                            <span className="text-sm font-semibold text-gray-900">
                              {formatMetric(creative.performance.impressions)}
                            </span>
                          </div>
                        </div>
                      )}
                      {creative.performance.clicks !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Clicks</span>
                          <div className="flex items-center gap-2">
                            {index > 0 && getComparisonIcon(creative.performance.clicks, creatives[index - 1].performance?.clicks)}
                            <span className="text-sm font-semibold text-gray-900">
                              {formatMetric(creative.performance.clicks)}
                            </span>
                          </div>
                        </div>
                      )}
                      {creative.performance.ctr !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">CTR</span>
                          <div className="flex items-center gap-2">
                            {index > 0 && getComparisonIcon(creative.performance.ctr, creatives[index - 1].performance?.ctr)}
                            <span className="text-sm font-semibold text-gray-900">
                              {formatMetric(creative.performance.ctr, true)}
                            </span>
                          </div>
                        </div>
                      )}
                      {creative.performance.conversions !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Conversions</span>
                          <div className="flex items-center gap-2">
                            {index > 0 && getComparisonIcon(creative.performance.conversions, creatives[index - 1].performance?.conversions)}
                            <span className="text-sm font-semibold text-gray-900">
                              {formatMetric(creative.performance.conversions)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                {creative.analysis ? (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        AI Analysis
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {creative.analysis.analysis_result.emotion && (
                        <div>
                          <span className="text-xs text-gray-600">Emotion:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                            {creative.analysis.analysis_result.emotion}
                          </span>
                        </div>
                      )}
                      {creative.analysis.analysis_result.copy_tone && (
                        <div>
                          <span className="text-xs text-gray-600">Tone:</span>
                          <span className="ml-2 text-sm font-medium text-gray-900 capitalize">
                            {creative.analysis.analysis_result.copy_tone}
                          </span>
                        </div>
                      )}
                      {creative.analysis.analysis_result.target_audience && (
                        <div>
                          <span className="text-xs text-gray-600">Audience:</span>
                          <p className="text-sm text-gray-900 mt-1">
                            {creative.analysis.analysis_result.target_audience}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Not Analyzed</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Use comparison insights to optimize your creative strategy
            </p>
            <button
              onClick={onClose}
              className="
                px-4 py-2 rounded-lg bg-blue-600 text-white font-medium
                hover:bg-blue-700 transition-colors
              "
            >
              Close Comparison
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
