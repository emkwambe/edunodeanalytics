const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization for production
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.clerk.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    // Optimize image formats for production
    formats: ['image/avif', 'image/webp'],
    // Enable sharp for production image optimization
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Server Actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Compression
  compress: true,

  // Strict mode for React
  reactStrictMode: true,

  // Turbopack configuration (Next.js 16+ default)
  turbopack: {},

  // External packages (server-side only, optional dependencies)
  serverExternalPackages: ['@google-cloud/bigquery'],

  // Output configuration for Vercel deployment
  output: 'standalone',

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // FERPA compliance: Strict caching for student data routes
        source: '/:school_slug/student-360/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },

  // Redirects for common routes
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/select-school',
        permanent: false,
      },
    ];
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Webpack optimizations for production
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          chartjs: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'chartjs',
            chunks: 'all',
            priority: 10,
          },
        },
      };
    }

    return config;
  },
};

// Sentry webpack plugin configuration
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppress source map uploading logs during build
  silent: true,

  // Project identifier in Sentry
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps (set in CI/CD)
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Don't upload source maps in development
  dryRun: !process.env.SENTRY_AUTH_TOKEN,

  // Automatically instrument Next.js
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,
  autoInstrumentAppDirectory: true,

  // Hide source maps from users
  hideSourceMaps: true,

  // Disable telemetry
  telemetry: false,

  // Widen the upload scope to include all files
  widenClientFileUpload: true,

  // Tunnel through a proxy to avoid ad blockers
  tunnelRoute: '/monitoring-tunnel',

  // Disable logger in production
  disableLogger: process.env.NODE_ENV === 'production',
};

// Export config with Sentry wrapper (only if DSN is configured)
module.exports = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
