'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Search, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CompetitorAnalysisPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any[]>([]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError('');

    try {
      // In production, this would call Meta Ad Library API
      // For MVP, we'll create mock competitor ads
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockResults = [
        {
          id: 'comp_1',
          page_name: searchTerm,
          ad_creative_bodies: [`Discover amazing products from ${searchTerm}. Shop now and save!`],
          ad_creative_link_titles: ['Shop Now'],
          ad_snapshot_url: 'https://placehold.co/600x400/blue/white?text=Ad+1',
        },
        {
          id: 'comp_2',
          page_name: searchTerm,
          ad_creative_bodies: [`Limited time offer! Get the best deals at ${searchTerm}.`],
          ad_creative_link_titles: ['Learn More'],
          ad_snapshot_url: 'https://placehold.co/600x400/green/white?text=Ad+2',
        },
        {
          id: 'comp_3',
          page_name: searchTerm,
          ad_creative_bodies: [`Transform your life with ${searchTerm}. Join thousands of happy customers.`],
          ad_creative_link_titles: ['Sign Up'],
          ad_snapshot_url: 'https://placehold.co/600x400/purple/white?text=Ad+3',
        },
      ];

      setResults(mockResults);
    } catch (err) {
      setError('Failed to search ads. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleImportAd(ad: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Save competitor creative to database
      const { data: creative, error: insertError } = await supabase
        .from('creatives')
        .insert({
          user_id: user.id,
          source_type: 'competitor',
          brand_name: ad.page_name,
          ad_image_url: ad.ad_snapshot_url,
          ad_copy: ad.ad_creative_bodies?.[0] || '',
          cta: ad.ad_creative_link_titles?.[0] || '',
          performance: {},
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirect to analysis page
      router.push(`/dashboard/analyze/${creative.id}`);
    } catch (err) {
      console.error('Error importing ad:', err);
      setError('Failed to import ad. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Competitor Analysis</h1>
          <p className="text-gray-600 mb-8">
            Search for competitor ads and analyze their creative strategies
          </p>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter competitor brand name or keyword..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchTerm.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Found {results.length} ads for &quot;{searchTerm}&quot;
              </h2>
              <div className="space-y-6">
                {results.map((ad) => (
                  <div key={ad.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex gap-6">
                      {ad.ad_snapshot_url && (
                        <img
                          src={ad.ad_snapshot_url}
                          alt={ad.page_name}
                          className="w-48 h-48 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{ad.page_name}</h3>
                            {ad.ad_creative_link_titles?.[0] && (
                              <span className="inline-block mt-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                {ad.ad_creative_link_titles[0]}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleImportAd(ad)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                          >
                            Analyze This Ad
                          </button>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          {ad.ad_creative_bodies?.[0] || 'No ad copy available'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length === 0 && searchTerm && (
            <div className="bg-white rounded-lg p-12 text-center">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No ads found</h3>
              <p className="text-gray-600">
                Try a different search term or brand name
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
