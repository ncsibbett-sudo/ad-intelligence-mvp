'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Upload, FileText } from 'lucide-react';
import Link from 'next/link';

export default function ImportPage() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');

  function connectMetaAccount() {
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/meta/connect`);
    const scope = 'ads_read,ads_management';
    const metaOAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.NEXT_PUBLIC_META_APP_ID}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

    window.location.href = metaOAuthUrl;
  }

  async function handleManualImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setImporting(true);

    const formData = new FormData(e.currentTarget);
    const brandName = formData.get('brandName') as string;
    const adCopy = formData.get('adCopy') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const cta = formData.get('cta') as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Create creative
      const { data: creative, error: insertError } = await supabase
        .from('creatives')
        .insert({
          user_id: user.id,
          source_type: 'own',
          brand_name: brandName,
          ad_copy: adCopy,
          ad_image_url: imageUrl,
          cta: cta,
          performance: {},
        })
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/dashboard/analyze/${creative.id}`);
    } catch (err) {
      console.error('Error importing ad:', err);
      setError('Failed to import ad. Please try again.');
    } finally {
      setImporting(false);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Your Ads</h1>
          <p className="text-gray-600 mb-8">
            Connect your Meta account or manually add ad creatives for analysis
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Meta Connect */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Meta Account</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Import ads directly from your Meta Ads account with performance data
              </p>
              <button
                onClick={connectMetaAccount}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Connect Meta
              </button>
              <p className="mt-3 text-xs text-gray-500">
                Note: Requires Meta App configuration with valid credentials
              </p>
            </div>

            {/* Manual Import */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Manual Import</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Manually add ad creative details for analysis
              </p>
              <p className="text-sm text-gray-500">
                Use the form below to manually enter ad details
              </p>
            </div>
          </div>

          {/* Manual Import Form */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6">Manual Ad Import</h2>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleManualImport} className="space-y-6">
              <div>
                <label htmlFor="brandName" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  id="brandName"
                  name="brandName"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your brand name"
                />
              </div>

              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  name="imageUrl"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/ad-image.jpg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: URL to your ad creative image
                </p>
              </div>

              <div>
                <label htmlFor="adCopy" className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Copy
                </label>
                <textarea
                  id="adCopy"
                  name="adCopy"
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your ad copy here..."
                />
              </div>

              <div>
                <label htmlFor="cta" className="block text-sm font-medium text-gray-700 mb-2">
                  Call to Action
                </label>
                <input
                  type="text"
                  id="cta"
                  name="cta"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Shop Now, Learn More, etc."
                />
              </div>

              <button
                type="submit"
                disabled={importing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {importing ? 'Importing...' : 'Import Ad'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
