'use client';

import { Search, Filter, X } from 'lucide-react';
import { useState } from 'react';

export type FilterType = 'all' | 'own' | 'competitor' | 'analyzed' | 'unanalyzed';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  resultCount?: number;
}

export function FilterBar({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  resultCount,
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filters: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All Creatives' },
    { value: 'own', label: 'My Ads' },
    { value: 'competitor', label: 'Competitors' },
    { value: 'analyzed', label: 'Analyzed' },
    { value: 'unanalyzed', label: 'Unanalyzed' },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by brand, copy, or CTA..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all duration-200
              placeholder:text-gray-400
            "
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="
                absolute right-3 top-1/2 -translate-y-1/2
                text-gray-400 hover:text-gray-600 transition-colors
              "
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter by Element Button */}
        <button
          className="
            flex items-center gap-2 px-4 py-2.5 rounded-lg
            border border-gray-300 bg-white hover:bg-gray-50
            transition-colors duration-200 whitespace-nowrap
          "
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter by Element</span>
        </button>

        {/* Filter Toggle Button (Mobile) */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="
            sm:hidden flex items-center gap-2 px-4 py-2.5 rounded-lg
            border border-gray-300 bg-white hover:bg-gray-50
            transition-colors duration-200
          "
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
          {activeFilter !== 'all' && (
            <span className="ml-auto w-2 h-2 rounded-full bg-blue-600" />
          )}
        </button>
      </div>

      {/* Filter Chips */}
      <div className={`
        flex flex-wrap gap-2
        ${isFilterOpen ? 'block' : 'hidden sm:flex'}
      `}>
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              onFilterChange(filter.value);
              setIsFilterOpen(false);
            }}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${
                activeFilter === filter.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300 hover:bg-blue-50'
              }
            `}
          >
            {filter.label}
          </button>
        ))}

        {/* Active Filter Indicator */}
        {activeFilter !== 'all' && (
          <button
            onClick={() => onFilterChange('all')}
            className="
              px-3 py-2 rounded-full text-sm font-medium
              text-gray-600 hover:text-gray-800
              flex items-center gap-1
              transition-colors duration-200
            "
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Result Count */}
      {resultCount !== undefined && (
        <div className="text-sm text-gray-600">
          {resultCount} {resultCount === 1 ? 'result' : 'results'}
          {searchQuery && (
            <span className="text-gray-500">
              {' '}
              for "<span className="font-medium text-gray-700">{searchQuery}</span>"
            </span>
          )}
        </div>
      )}
    </div>
  );
}
