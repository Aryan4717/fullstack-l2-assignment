import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: [],
    instrumentationHook: true,
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  sourcemaps: {
    // Delete source maps after upload so they aren't shipped in the standalone build.
    deleteSourcemapsAfterUpload: true,
  },
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
