'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { GOOGLE_CONFIG } from '@/lib/constants';

function ImportPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    // Check for connection success/error from OAuth redirect
    if (searchParams.get('google_connected') === 'true') {
      setGoogleConnected(true);
    }
    if (searchParams.get('error')) {
      const errorType = searchParams.get('error');
      let errorMessage = 'Failed to connect Google Ads account';
      if (errorType === 'google_auth_denied') {
        errorMessage = 'Authorization was denied. Please try again.';
      }
      setError(errorMessage);
    }

    // Check database for existing Google connection
    async function checkGoogleConnection() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('google_refresh_token, google_customer_id')
          .eq('id', user.id)
          .single();

        if (userData?.google_refresh_token && userData?.google_customer_id) {
          setGoogleConnected(true);
        }
      } catch (err) {
        console.error('Error checking Google connection:', err);
      }
    }

    checkGoogleConnection();
  }, [searchParams]);

  function connectGoogleAdsAccount() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID;
    if (!clientId) {
      setError('Google Ads is not configured. Please contact support.');
      return;
    }

    const redirectUri = GOOGLE_CONFIG.REDIRECT_URI;
    const scope = GOOGLE_CONFIG.SCOPES.join(' ');
    const googleOAuthUrl = `${GOOGLE_CONFIG.OAUTH_ENDPOINT}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    window.location.href = googleOAuthUrl;
  }

  async function handleImportFromGoogle() {
    setImporting(true);
    setError('');
    setImportResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/google/import-ads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          campaignStatus: 'ENABLED',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.requiresConnection) {
          setError('Please connect your Google Ads account first.');
          setGoogleConnected(false);
        } else {
          throw new Error(data.error || 'Failed to import ads');
        }
        return;
      }

      setImportResult(data);
      if (data.importedAds > 0 || data.updatedAds > 0) {
        // Refresh the page after a delay to show results
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err) {
      console.error('Error importing ads:', err);
      setError(err instanceof Error ? err.message : 'Failed to import ads');
    } finally {
      setImporting(false);
    }
  }

  async function handleManualImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setImporting(true);

    const formData = new FormData(e.currentTarget);
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
          brand_name: null,
          ad_copy: adCopy,
          ad_image_url: imageUrl || null,
          cta: cta || null,
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
            Connect your Google Ads account or manually add ad creatives for analysis
          </p>

          {/* Success/Error Messages */}
          {googleConnected && (
            <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Google Ads account connected successfully!</p>
                <p className="text-sm">You can now import your ads using the button below.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg mb-6 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {importResult && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg mb-6">
              <p className="font-medium mb-2">Import Complete!</p>
              <ul className="text-sm space-y-1">
                <li>Total ads: {importResult.totalAds}</li>
                <li>Imported: {importResult.importedAds}</li>
                <li>Updated: {importResult.updatedAds}</li>
                {importResult.skippedAds > 0 && (
                  <li className="text-yellow-700">Skipped: {importResult.skippedAds}</li>
                )}
              </ul>
              <p className="text-sm mt-2">Redirecting to dashboard...</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Google Ads Connect */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Google Ads</h3>
              <p className="text-gray-600 mb-4 text-sm">
                Import ads directly from your Google Ads account with performance metrics
              </p>

              {!googleConnected ? (
                <button
                  onClick={connectGoogleAdsAccount}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Connect Google Ads
                </button>
              ) : (
                <button
                  onClick={handleImportFromGoogle}
                  disabled={importing}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Ads from Google'}
                </button>
              )}

              <p className="mt-3 text-xs text-gray-500">
                Imports active campaigns and ads with performance data (impressions, clicks, CTR, CPC, conversions)
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ad Image (Optional)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const imageUrlInput = document.getElementById('imageUrl') as HTMLInputElement;
                        if (imageUrlInput && event.target?.result) {
                          imageUrlInput.value = event.target.result as string;
                          // Trigger preview update
                          const img = document.getElementById('imagePreview') as HTMLImageElement;
                          if (img) {
                            img.src = event.target.result as string;
                            img.style.display = 'block';
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('imageFileInput')?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Drag and drop your ad image here
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
                <input
                  type="file"
                  id="imageFileInput"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const imageUrlInput = document.getElementById('imageUrl') as HTMLInputElement;
                        if (imageUrlInput && event.target?.result) {
                          imageUrlInput.value = event.target.result as string;
                          // Trigger preview update
                          const img = document.getElementById('imagePreview') as HTMLImageElement;
                          if (img) {
                            img.src = event.target.result as string;
                            img.style.display = 'block';
                          }
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {/* Hidden input to store the data URL */}
                <input type="hidden" id="imageUrl" name="imageUrl" />
                {/* Image Preview */}
                <img
                  id="imagePreview"
                  alt="Preview"
                  className="mt-4 max-h-64 rounded-lg mx-auto border border-gray-200 hidden"
                />
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

export default function ImportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ImportPageContent />
    </Suspense>
  );
}
