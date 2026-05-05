/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: [
      "mongoose",
      "bcryptjs",
      "node-cron",
      "google-ads-api",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent these packages from being bundled by webpack
      config.externals = [
        ...(Array.isArray(config.externals)
          ? config.externals
          : [config.externals].filter(Boolean)),
        "mongoose",
        "bcryptjs",
        "node-cron",
      ];
    }
    return config;
  },
};

module.exports = nextConfig;
