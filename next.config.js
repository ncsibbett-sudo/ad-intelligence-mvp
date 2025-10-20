/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Skip build-time static generation for dynamic pages
  experimental: {
    runtime: 'nodejs',
  },
  output: 'standalone',
};

module.exports = nextConfig;
