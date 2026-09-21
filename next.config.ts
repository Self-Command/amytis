import type { NextConfig } from 'next';

// actions/configure-pages supplies BASE_PATH for project Pages deployments.
// Keep it empty for local development and custom-domain deployments.
const basePath = process.env.BASE_PATH ?? '';

const nextConfig: NextConfig = {
  reactCompiler: true,
  trailingSlash: true,
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  images: {
    loader: 'custom',
    imageSizes: [64, 128, 256],
    deviceSizes: [640, 1200, 1920],
  },
  transpilePackages: ['next-image-export-optimizer'],
  experimental: { optimizePackageImports: ['react-icons', 'd3'] },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    nextImageExportOptimizer_imageFolderPath: 'public',
    nextImageExportOptimizer_exportFolderPath: 'out',
    nextImageExportOptimizer_quality: '75',
    nextImageExportOptimizer_storePicturesInWEBP: 'true',
    nextImageExportOptimizer_generateAndUseBlurImages: 'true',
  },
};

export default nextConfig;