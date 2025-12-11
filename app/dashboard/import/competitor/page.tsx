'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User } from '@/lib/types';
import { ArrowLeft, Eye, Upload } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/toast';

export default function ImportCompetitorPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    brandName: '',
    adCopy: '',
    imageUrl: '',
    cta: '',
  });

  useEffect(() => {
    checkUser();
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
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!formData.brandName || !formData.adCopy) {
      showToast('Brand name and ad copy are required', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('creatives')
        .insert({
          user_id: user.id,
          brand_name: formData.brandName,
          ad_copy: formData.adCopy,
          ad_image_url: formData.imageUrl || null,
          cta: formData.cta || null,
          source_type: 'competitor',
        });

      if (error) throw error;

      showToast('Competitor ad imported successfully!', 'success');

      // Reset form
      setFormData({
        brandName: '',
        adCopy: '',
        imageUrl: '',
        cta: '',
      });

      // Redirect to dashboard after brief delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error) {
      console.error('Error importing competitor ad:', error);
      showToast('Failed to import competitor ad', 'error');
    } finally {
      setSubmitting(false);
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
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Eye className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Import Competitor Ad
            </h1>
            <p className="text-gray-600 text-center">
              Manually add competitor creatives for competitive analysis
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="space-y-6">
              {/* Brand Name */}
              <div>
                <label htmlFor="brandName" className="block text-sm font-medium text-gray-900 mb-2">
                  Competitor Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="brandName"
                  required
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g., Nike, Apple, Amazon"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Ad Copy */}
              <div>
                <label htmlFor="adCopy" className="block text-sm font-medium text-gray-900 mb-2">
                  Ad Copy <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="adCopy"
                  required
                  value={formData.adCopy}
                  onChange={(e) => setFormData({ ...formData, adCopy: e.target.value })}
                  placeholder="Paste the full ad copy/text here..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Include headlines, body text, and any other copy from the ad
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Ad Image (Optional)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-orange-500', 'bg-orange-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-orange-500', 'bg-orange-50');
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setFormData({ ...formData, imageUrl: event.target.result as string });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('imageFileInput')?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Drag and drop competitor ad image
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
                        if (event.target?.result) {
                          setFormData({ ...formData, imageUrl: event.target.result as string });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Take a screenshot of the competitor ad and upload it here
                </p>
              </div>

              {/* Image Preview */}
              {formData.imageUrl && (
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900 mb-2">Image Preview:</p>
                  <img
                    src={formData.imageUrl}
                    alt="Ad preview"
                    className="max-h-64 rounded-lg mx-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      showToast('Invalid image', 'error');
                    }}
                  />
                </div>
              )}

              {/* CTA */}
              <div>
                <label htmlFor="cta" className="block text-sm font-medium text-gray-900 mb-2">
                  Call-to-Action (Optional)
                </label>
                <input
                  type="text"
                  id="cta"
                  value={formData.cta}
                  onChange={(e) => setFormData({ ...formData, cta: e.target.value })}
                  placeholder="e.g., Shop Now, Learn More, Sign Up"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Import Competitor Ad
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">💡 Tips for Competitive Analysis</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Include as much detail as possible for better AI analysis</li>
              <li>• Note where you saw the ad (Facebook, Google, Instagram, etc.)</li>
              <li>• After importing, you can analyze it to understand what makes it effective</li>
              <li>• Compare competitor ads with your own to identify opportunities</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
