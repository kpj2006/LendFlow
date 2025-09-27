/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
    }

    config.externals.push('pino-pretty', 'lokijs', 'encoding', '@react-native-async-storage/async-storage')
    
    // Ignore warnings about optional modules
    config.module = {
      ...config.module,
      exprContextCritical: false,
      unknownContextCritical: false,
    }

    // Optimize chunk splitting to prevent loading errors
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
        },
      },
    }

    return config
  },
  transpilePackages: ['@metamask/sdk'],
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

module.exports = nextConfig