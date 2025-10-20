'use client';

export const dynamic = 'force-dynamic';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Creative, Analysis } from '@/lib/types';
import { ArrowLeft, Loader2, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AnalyzePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [creative, setCreative] = useState<Creative | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCreative();
  }, [unwrappedParams.id]);

  async function fetchCreative() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Fetch creative
      const { data: creativeData, error: creativeError } = await supabase
        .from('creatives')
        .select('*')
        .eq('id', unwrappedParams.id)
        .eq('user_id', user.id)
        .single();

      if (creativeError) throw creativeError;
      setCreative(creativeData as Creative);

      // Check if analysis exists
      const { data: analysisData } = await supabase
        .from('analysis')
        .select('*')
        .eq('creative_id', unwrappedParams.id)
        .single();

      if (analysisData) {
        setAnalysis(analysisData as Analysis);
      }
    } catch (err) {
      console.error('Error fetching creative:', err);
      setError('Failed to load creative');
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!creative) return;

    setAnalyzing(true);
    setError('');

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          creative_id: creative.id,
          image_url: creative.ad_image_url,
          ad_copy: creative.ad_copy,
          cta: creative.cta,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresUpgrade) {
          setError(data.message);
          return;
        }
        throw new Error(data.error || 'Analysis failed');
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze creative');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!creative) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creative Not Found</h2>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
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
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Creative Preview */}
            <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
              <h2 className="text-xl font-semibold mb-4">Creative Preview</h2>
              {creative.ad_image_url && (
                <img
                  src={creative.ad_image_url}
                  alt={creative.brand_name || 'Ad'}
                  className="w-full rounded-lg mb-4"
                />
              )}
              <div className="space-y-3">
                {creative.brand_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Brand</label>
                    <p className="text-gray-900">{creative.brand_name}</p>
                  </div>
                )}
                {creative.ad_copy && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ad Copy</label>
                    <p className="text-gray-900">{creative.ad_copy}</p>
                  </div>
                )}
                {creative.cta && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Call to Action</label>
                    <p className="text-gray-900">{creative.cta}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">Source</label>
                  <span className={`inline-block px-2 py-1 rounded text-xs ml-2 ${
                    creative.source_type === 'own'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {creative.source_type === 'own' ? 'My Ad' : 'Competitor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis Results */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>

              {!analysis && !analyzing && (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-6">
                    Click below to analyze this creative with AI
                  </p>
                  <button
                    onClick={handleAnalyze}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Analyze Now
                  </button>
                </div>
              )}

              {analyzing && (
                <div className="text-center py-12">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Analyzing creative...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                  {error}
                  {error.includes('Upgrade') && (
                    <button
                      onClick={async () => {
                        const response = await fetch('/api/stripe/checkout', { method: 'POST' });
                        const data = await response.json();
                        if (data.url) window.location.href = data.url;
                      }}
                      className="ml-4 underline hover:no-underline"
                    >
                      Upgrade Now
                    </button>
                  )}
                </div>
              )}

              {analysis && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-green-600 pb-4 border-b">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Analysis Complete</span>
                  </div>

                  {analysis.analysis_result.headline && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Headline</h3>
                      <p className="text-gray-900">{analysis.analysis_result.headline}</p>
                      <span className="inline-block mt-1 text-xs bg-gray-100 px-2 py-1 rounded">
                        Length: {analysis.analysis_result.headline_length}
                      </span>
                    </div>
                  )}

                  {analysis.analysis_result.emotion && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Emotional Tone</h3>
                      <p className="text-gray-900 capitalize">{analysis.analysis_result.emotion}</p>
                    </div>
                  )}

                  {analysis.analysis_result.copy_tone && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Copy Tone</h3>
                      <p className="text-gray-900 capitalize">{analysis.analysis_result.copy_tone}</p>
                    </div>
                  )}

                  {analysis.analysis_result.primary_color && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Primary Color</h3>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border border-gray-300"
                          style={{ backgroundColor: analysis.analysis_result.primary_color }}
                        />
                        <p className="text-gray-900 capitalize">{analysis.analysis_result.primary_color}</p>
                      </div>
                    </div>
                  )}

                  {analysis.analysis_result.visual_elements && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Visual Elements</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysis.analysis_result.visual_elements.map((element, i) => (
                          <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.analysis_result.performance_driver && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Drivers</h3>
                      <p className="text-gray-900">{analysis.analysis_result.performance_driver}</p>
                    </div>
                  )}

                  {analysis.analysis_result.recommendations && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
                      <ul className="space-y-2">
                        {analysis.analysis_result.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-2 text-gray-900">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
