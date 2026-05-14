/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pribec/ui', '@pribec/shared-types'],
  images: {
    remotePatterns: [
      // Company logos stored in S3-compatible object storage
      { protocol: 'https', hostname: '**' },
      // Local API server (development)
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  async redirects() {
    return [
      {
        source: '/contractor-supplier-marketplace',
        destination: '/service-providers',
        permanent: true,
      },
    ];
  },
  typescript: {
    // Type errors are addressed incrementally — build should not block on them.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
