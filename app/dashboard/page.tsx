'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, Creative, Analysis } from '@/lib/types';
import { LogOut, Plus, TrendingUp, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
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
        const { data: analysesData } = await supabase
          .from('analysis')
          .select('*')
          .in('creative_id', creativeIds);

        if (analysesData) {
          setAnalyses(analysesData as Analysis[]);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
      console.log('Upgrade button clicked');
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session ? 'exists' : 'missing');

      if (!session?.access_token) {
        alert('Please log in again to continue');
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
      console.log('Stripe checkout response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned:', data);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Ad Intelligence</h1>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user.email}</span>
                {user.payment_status === 'free' && (
                  <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                    Free ({5 - user.analysis_count} analyses left)
                  </span>
                )}
                {user.payment_status === 'paid' && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Pro
                  </span>
                )}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Total Creatives</h3>
              <BarChart className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{creatives.length}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Analyses Done</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analyses.length}</p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">Account Status</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {user?.payment_status === 'paid' ? 'Pro' : 'Free'}
            </p>
            {user?.payment_status === 'free' && (
              <button
                onClick={handleUpgrade}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer hover:underline"
              >
                Upgrade to Pro →
              </button>
            )}
            {!user && (
              <p className="mt-2 text-xs text-gray-500">Loading user info...</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/dashboard/import"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
            >
              <Plus className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900">Import Your Ads</h3>
                <p className="text-sm text-gray-600">Connect Meta account and import ads</p>
              </div>
            </Link>

            <Link
              href="/dashboard/competitor"
              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition"
            >
              <Plus className="w-6 h-6 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900">Analyze Competitors</h3>
                <p className="text-sm text-gray-600">Search and analyze competitor ads</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Creatives */}
        {creatives.length > 0 ? (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Recent Creatives</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatives.slice(0, 6).map((creative) => {
                const analysis = analyses.find(a => a.creative_id === creative.id);
                return (
                  <div key={creative.id} className="border rounded-lg p-4 hover:shadow-md transition">
                    {creative.ad_image_url && (
                      <img
                        src={creative.ad_image_url}
                        alt={creative.brand_name || 'Ad'}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                      />
                    )}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        creative.source_type === 'own'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {creative.source_type === 'own' ? 'My Ad' : 'Competitor'}
                      </span>
                      {creative.brand_name && (
                        <span className="text-xs text-gray-600">{creative.brand_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                      {creative.ad_copy || 'No copy available'}
                    </p>
                    {analysis && (
                      <Link
                        href={`/dashboard/analyze/${creative.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Analysis →
                      </Link>
                    )}
                    {!analysis && (
                      <Link
                        href={`/dashboard/analyze/${creative.id}`}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        Analyze Now →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 shadow-sm text-center">
            <div className="max-w-md mx-auto">
              <BarChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No creatives yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by importing your ads or analyzing competitors
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/dashboard/import"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Import Ads
                </Link>
                <Link
                  href="/dashboard/competitor"
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Analyze Competitors
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
