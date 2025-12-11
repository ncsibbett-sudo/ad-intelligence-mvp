'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, Creative, Analysis } from '@/lib/types';
import { LogOut, Plus, TrendingUp, BarChart, GitCompare, Sparkles, Eye } from 'lucide-react';
import Link from 'next/link';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { FilterBar, FilterType } from '@/components/dashboard/FilterBar';
import { CreativeCard } from '@/components/dashboard/CreativeCard';
import { ComparisonModal } from '@/components/dashboard/ComparisonModal';
import { DiversityBreakdownModal } from '@/components/dashboard/DiversityBreakdownModal';
import { useToast } from '@/components/ui/toast';
import { getDashboardMetrics } from '@/lib/metrics/insights';

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Comparison state
  const [selectedCreatives, setSelectedCreatives] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Diversity breakdown modal state
  const [showDiversityModal, setShowDiversityModal] = useState(false);

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      router.push('/auth/login');
      return;
    }

    // Fetch user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (userData) {
      setUser(userData as User);
    }
  }

  async function fetchData() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Fetch creatives
      const { data: creativesData } = await supabase
        .from('creatives')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (creativesData) {
        setCreatives(creativesData as Creative[]);

        // Fetch analyses for these creatives
        const creativeIds = creativesData.map(c => c.id);
        if (creativeIds.length > 0) {
          const { data: analysesData } = await supabase
            .from('analysis')
            .select('*')
            .in('creative_id', creativeIds);

          if (analysesData) {
            setAnalyses(analysesData as Analysis[]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  async function handleUpgrade() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        showToast('Please log in again to continue', 'error');
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast('Failed to start checkout. Please try again.', 'error');
      }
    } catch (error) {
      showToast('Failed to start checkout: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this creative?')) return;

    try {
      const { error } = await supabase
        .from('creatives')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCreatives(prev => prev.filter(c => c.id !== id));
      setAnalyses(prev => prev.filter(a => a.creative_id !== id));
      setSelectedCreatives(prev => prev.filter(cid => cid !== id));
      showToast('Creative deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting creative:', error);
      showToast('Failed to delete creative', 'error');
    }
  }

  function handleSelect(id: string) {
    setSelectedCreatives(prev => {
      if (prev.includes(id)) {
        return prev.filter(cid => cid !== id);
      } else {
        if (prev.length >= 3) {
          showToast('You can compare up to 3 creatives at a time', 'warning');
          return prev;
        }
        return [...prev, id];
      }
    });
  }

  function handleCompare() {
    if (selectedCreatives.length < 2) {
      showToast('Select at least 2 creatives to compare', 'warning');
      return;
    }
    setShowComparison(true);
  }

  function handleDiversityClick() {
    setShowDiversityModal(true);
  }

  function handleTopInsightClick() {
    // Find the best performing creative
    const creativesWithCTR = creatives.filter(c => c.performance?.ctr !== undefined);
    if (creativesWithCTR.length === 0) {
      showToast('No performance data available yet', 'info');
      return;
    }

    const bestCreative = creativesWithCTR.reduce((best, current) =>
      (current.performance!.ctr > best.performance!.ctr) ? current : best
    );

    router.push(`/dashboard/analyze/${bestCreative.id}`);
  }

  function handleUnanalyzedClick() {
    if (unanalyzedCount === 0) {
      showToast('All creatives have been analyzed!', 'success');
      return;
    }
    setActiveFilter('unanalyzed');
    showToast(`Showing ${unanalyzedCount} unanalyzed creative${unanalyzedCount !== 1 ? 's' : ''}`, 'info');
  }

  // Filter and search logic
  const filteredCreatives = useMemo(() => {
    let filtered = [...creatives];

    // Apply filter
    switch (activeFilter) {
      case 'own':
        filtered = filtered.filter(c => c.source_type === 'own');
        break;
      case 'competitor':
        filtered = filtered.filter(c => c.source_type === 'competitor');
        break;
      case 'analyzed':
        filtered = filtered.filter(c => analyses.some(a => a.creative_id === c.id));
        break;
      case 'unanalyzed':
        filtered = filtered.filter(c => !analyses.some(a => a.creative_id === c.id));
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.brand_name?.toLowerCase().includes(query) ||
        c.ad_copy?.toLowerCase().includes(query) ||
        c.cta?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [creatives, analyses, activeFilter, searchQuery]);

  const creativesWithAnalysis = useMemo(() => {
    return filteredCreatives.map(creative => ({
      ...creative,
      analysis: analyses.find(a => a.creative_id === creative.id),
    }));
  }, [filteredCreatives, analyses]);

  const comparisonCreatives = useMemo(() => {
    return selectedCreatives
      .map(id => creativesWithAnalysis.find(c => c.id === id))
      .filter(Boolean) as (Creative & { analysis?: Analysis })[];
  }, [selectedCreatives, creativesWithAnalysis]);

  const dashboardMetrics = useMemo(() => {
    return getDashboardMetrics(creatives, analyses);
  }, [creatives, analyses]);

  const unanalyzedCount = useMemo(() => {
    return creatives.filter(c => !analyses.some(a => a.creative_id === c.id)).length;
  }, [creatives, analyses]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Ad Intelligence
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.email}</span>
                {user.payment_status === 'free' && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    Free ({5 - user.analysis_count} left)
                  </span>
                )}
                {user.payment_status === 'paid' && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    Pro
                  </span>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Creative Diversity Score"
            value={dashboardMetrics.creativeDiversity.score > 0
              ? `${dashboardMetrics.creativeDiversity.score}/${dashboardMetrics.creativeDiversity.maxScore}`
              : 'N/A'}
            icon={BarChart}
            subtitle={dashboardMetrics.creativeDiversity.description}
            onClick={handleDiversityClick}
          />

          <StatsCard
            title="Top Creative Insight"
            value={dashboardMetrics.topInsight?.value || 'N/A'}
            icon={TrendingUp}
            subtitle={dashboardMetrics.topInsight?.description || 'Analyze more creatives to see insights'}
            onClick={handleTopInsightClick}
          />

          <StatsCard
            title="Unanalyzed Creatives"
            value={unanalyzedCount}
            icon={Sparkles}
            subtitle={unanalyzedCount > 0
              ? `${unanalyzedCount} creative${unanalyzedCount !== 1 ? 's' : ''} waiting for analysis`
              : 'All creatives analyzed!'}
            onClick={handleUnanalyzedClick}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm mb-8 border border-gray-200">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/dashboard/import"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Import Your Ads</h3>
                <p className="text-sm text-gray-600">Connect Google Ads or add manually</p>
              </div>
            </Link>
            {selectedCreatives.length >= 2 ? (
              <button
                onClick={handleCompare}
                className="flex items-center gap-3 p-4 border-2 border-purple-300 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg group"
              >
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <GitCompare className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium text-white">Compare {selectedCreatives.length} Ads</h3>
                  <p className="text-sm text-purple-100">Click to view side-by-side comparison</p>
                </div>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <GitCompare className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Compare Ads</h3>
                  <p className="text-sm text-gray-600">Select creatives to compare side-by-side</p>
                </div>
              </div>
            )}
            <Link
              href="/dashboard/import/competitor"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Eye className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Import Competitor Ads</h3>
                <p className="text-sm text-gray-600">Analyze competitor creatives manually</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Creatives Section */}
        {creatives.length > 0 ? (
          <div className="space-y-6">
            {/* Filter Bar */}
            <FilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              resultCount={filteredCreatives.length}
            />

            {/* Creatives Grid */}
            {filteredCreatives.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creativesWithAnalysis.map((creative) => (
                  <CreativeCard
                    key={creative.id}
                    creative={creative}
                    analysis={creative.analysis}
                    isSelected={selectedCreatives.includes(creative.id)}
                    onSelect={handleSelect}
                    onDelete={handleDelete}
                    showCheckbox={true}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center border border-gray-200">
                <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm text-center border border-gray-200">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No creatives yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by importing your ads from Google Ads or manually adding them
              </p>
              <Link
                href="/dashboard/import"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Import Your First Ad
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Comparison Modal */}
      {showComparison && (
        <ComparisonModal
          creatives={comparisonCreatives}
          onClose={() => {
            setShowComparison(false);
            setSelectedCreatives([]);
          }}
        />
      )}

      {/* Diversity Breakdown Modal */}
      {showDiversityModal && (
        <DiversityBreakdownModal
          creatives={creatives}
          analyses={analyses}
          onClose={() => setShowDiversityModal(false)}
        />
      )}
    </div>
  );
}
