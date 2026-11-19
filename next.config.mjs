import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

// GitHub Pages 프로젝트 페이지는 /<repo> 하위 경로에서 서빙된다 (예: /filezen)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'webassembly/async',
    });
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default withNextIntl(nextConfig);
