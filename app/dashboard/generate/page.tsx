'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, Creative, Analysis } from '@/lib/types';
import { ArrowLeft, Sparkles, Lightbulb, TrendingUp, Wand2 } from 'lucide-react';
import Link from 'next/link';

export default function GeneratePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

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

      // Fetch creatives and analyses
      const { data: creativesData } = await supabase
        .from('creatives')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (creativesData) {
        setCreatives(creativesData as Creative[]);

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
    } finally {
      setLoading(false);
    }
  }

  const analyzedCreatives = creatives.filter(c =>
    analyses.some(a => a.creative_id === c.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Generate New Concepts
            </h1>
            <p className="text-gray-600">
              AI-powered creative suggestions based on your best performing ads
            </p>
          </div>

          {/* Status Check */}
          {analyzedCreatives.length === 0 ? (
            <div className="bg-white rounded-xl p-12 shadow-sm text-center border border-gray-200">
              <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Analyze Some Creatives First
              </h3>
              <p className="text-gray-600 mb-6">
                To generate new concepts, we need to understand what works in your current ads.
                Please analyze at least one creative to get started.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <>
              {/* Quick Stats */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Analyzed Creatives</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{analyzedCreatives.length}</p>
                  <p className="text-sm text-gray-600 mt-1">Ready for insights</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Patterns Detected</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {new Set(analyses.map(a => a.analysis_result.emotion)).size}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Unique emotions</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Generation Ready</h3>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">Coming Soon</p>
                  <p className="text-sm text-gray-600 mt-1">Feature in development</p>
                </div>
              </div>

              {/* Feature Placeholder */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  What You'll Be Able to Generate
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Copy Variations</h3>
                      <p className="text-sm text-gray-600">
                        New ad copy based on your best-performing tone and messaging
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Visual Concepts</h3>
                      <p className="text-sm text-gray-600">
                        Image composition suggestions based on successful visual elements
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Audience Segments</h3>
                      <p className="text-sm text-gray-600">
                        Recommended target audiences based on creative performance patterns
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-sm">✓</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">A/B Test Ideas</h3>
                      <p className="text-sm text-gray-600">
                        Strategic testing suggestions to improve performance
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
