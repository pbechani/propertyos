/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pribec/ui', '@pribec/shared-types'],
};

module.exports = nextConfig;
