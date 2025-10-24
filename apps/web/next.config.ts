import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // For placeholder images during upload
      },
    ],
    // Image optimization configuration
    formats: ['image/webp', 'image/avif'], // Modern formats first
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Responsive breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Smaller image sizes
    minimumCacheTTL: 60, // Cache for 1 minute minimum
  },
  // Performance optimizations
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true, // Enable strict mode for better debugging

  // CSS optimization
  experimental: {
    optimizeCss: true, // Enable CSS optimization
  },

  // Bundle analysis - use ANALYZE=true npm run build to analyze bundle
  // Note: Bundle analyzer is configured via package.json build:analyze script
};

export default nextConfig;
