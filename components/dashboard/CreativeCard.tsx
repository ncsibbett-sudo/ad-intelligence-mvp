'use client';

import { Creative, Analysis } from '@/lib/types';
import { MoreVertical, Eye, GitCompare, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface CreativeCardProps {
  creative: Creative;
  analysis?: Analysis | null;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  showCheckbox?: boolean;
}

export function CreativeCard({
  creative,
  analysis,
  isSelected = false,
  onSelect,
  onDelete,
  showCheckbox = false,
}: CreativeCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasAnalysis = !!analysis;

  return (
    <div
      onClick={() => showCheckbox && onSelect && onSelect(creative.id)}
      className={`
        group relative bg-white rounded-xl border overflow-hidden
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1
        animate-scale-in
        ${showCheckbox ? 'cursor-pointer' : ''}
        ${isSelected ? 'ring-4 ring-blue-500 border-blue-500 shadow-xl' : 'border-gray-200'}
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 left-3 z-20">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
      )}

      {/* Actions Menu */}
      <div className="absolute top-3 right-3 z-20">
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="
              p-2 rounded-lg bg-white/90 backdrop-blur-sm shadow-sm
              opacity-0 group-hover:opacity-100 transition-opacity
              hover:bg-white
            "
            aria-label="More options"
          >
            <MoreVertical className="w-4 h-4 text-gray-600" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="
                absolute right-0 mt-2 w-48 py-1 bg-white rounded-lg shadow-lg border border-gray-200
                z-20 animate-scale-in
              ">
                <Link
                  href={`/dashboard/analyze/${creative.id}`}
                  className="
                    flex items-center gap-3 px-4 py-2 text-sm text-gray-700
                    hover:bg-gray-50 transition-colors
                  "
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(creative.id);
                      setShowMenu(false);
                    }}
                    className="
                      w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600
                      hover:bg-red-50 transition-colors
                    "
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image or Placeholder */}
      <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {creative.ad_image_url && !imageError ? (
          <>
            <img
              src={creative.ad_image_url}
              alt={creative.brand_name || 'Ad creative'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
            {/* Overlay gradient on hover */}
            <div className="
              absolute inset-0 bg-gradient-to-t from-black/50 to-transparent
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
            " />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <GitCompare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No Image</p>
            </div>
          </div>
        )}

        {/* Key Performance Metric - Only show if real data exists */}
        {creative.performance?.ctr !== undefined && (
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-white/95 text-gray-900 backdrop-blur-sm shadow-md border border-gray-200">
              {creative.performance.ctr.toFixed(2)}% CTR
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
          {/* Brand Name */}
          {creative.brand_name && (
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {creative.brand_name}
            </h3>
          )}

          {/* Ad Copy Preview */}
          {creative.ad_copy && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {creative.ad_copy}
            </p>
          )}

          {/* CTA */}
          {creative.cta && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">CTA:</span>
              <span className="text-xs text-blue-600 font-medium truncate">
                {creative.cta}
              </span>
            </div>
          )}

          {/* Performance Metrics Preview */}
          {creative.performance && (creative.performance.ctr || creative.performance.impressions) && (
            <div className="flex gap-4 pt-2 border-t border-gray-100">
              {creative.performance.impressions !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Impressions</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {creative.performance.impressions.toLocaleString()}
                  </p>
                </div>
              )}
              {creative.performance.ctr !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">CTR</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {creative.performance.ctr.toFixed(2)}%
                  </p>
                </div>
              )}
            </div>
          )}

        {/* Action Link */}
        <div className="pt-2">
          <Link
            href={`/dashboard/analyze/${creative.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-block"
          >
            {hasAnalysis ? (
              <span className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer">
                View Analysis
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1 cursor-pointer">
                Analyze Now
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
