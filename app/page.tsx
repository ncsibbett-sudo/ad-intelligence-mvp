import Link from 'next/link';
import { BarChart3, Eye, TrendingUp, Zap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex justify-between items-center mb-16">
          <h1 className="text-2xl font-bold text-blue-600">Ad Intelligence</h1>
          <div className="space-x-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/auth/signup"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="text-center max-w-4xl mx-auto mb-20">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Discover What Makes Ads Perform
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Analyze your Meta ad creatives and competitors to uncover winning patterns.
            Powered by AI-driven insights.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ad Analysis</h3>
            <p className="text-gray-600">
              Deep dive into your ad creatives with AI-powered analysis of images, copy, and CTAs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Competitor Insights</h3>
            <p className="text-gray-600">
              Track competitor ad strategies and learn from their creative approaches.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Performance Trends</h3>
            <p className="text-gray-600">
              Identify patterns that drive engagement and conversions across your campaigns.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Reports</h3>
            <p className="text-gray-600">
              Generate actionable insights in seconds with automated analysis.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 text-white rounded-2xl p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to optimize your ad strategy?</h3>
          <p className="text-xl mb-8 text-blue-100">
            Start analyzing your ads today. Free trial includes 5 analyses.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
          >
            Get Started Now
          </Link>
        </div>
      </div>
    </main>
  );
}
