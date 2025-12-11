'use client';

import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  action?: ReactNode;
  gradient?: boolean;
  onClick?: () => void;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  action,
  gradient = false,
  onClick,
}: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-xl p-6 shadow-sm border
        transition-all duration-300 hover:shadow-md hover:-translate-y-0.5
        animate-scale-in
        ${onClick ? 'cursor-pointer' : ''}
        ${
          gradient
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600'
            : 'bg-white border-gray-200'
        }
      `}
    >
      {/* Background decoration */}
      <div
        className={`
          absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-2xl opacity-10
          ${gradient ? 'bg-white' : 'bg-blue-500'}
        `}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`
              p-3 rounded-lg
              ${
                gradient
                  ? 'bg-white/20 backdrop-blur-sm'
                  : 'bg-blue-50'
              }
            `}
          >
            <Icon
              className={`w-6 h-6 ${gradient ? 'text-white' : 'text-blue-600'}`}
            />
          </div>
          {trend && (
            <div
              className={`
                text-sm font-medium px-2 py-1 rounded-full
                ${
                  gradient
                    ? 'bg-white/20 text-white'
                    : trend.isPositive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }
              `}
            >
              {trend.isPositive ? '+' : ''}{trend.value}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p
            className={`text-sm font-medium ${
              gradient ? 'text-white/80' : 'text-gray-600'
            }`}
          >
            {title}
          </p>
          <p
            className={`text-3xl font-bold ${
              gradient ? 'text-white' : 'text-gray-900'
            }`}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className={`text-xs ${
                gradient ? 'text-white/70' : 'text-gray-500'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}
