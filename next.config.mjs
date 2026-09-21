/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'pdf-parse': 'commonjs pdf-parse' }];
    return config;
  },
};

export default nextConfig;
