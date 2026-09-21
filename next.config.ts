import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  trailingSlash: true,
  output: "export",
  basePath: "/amytis",
  images: {
    loader: "custom",
    imageSizes: [64, 128, 256],
    deviceSizes: [640, 1200, 1920],
  },
  transpilePackages: ["next-image-export-optimizer"],
  experimental: {
    optimizePackageImports: ["react-icons", "d3"],
  },
  env: {
    nextImageExportOptimizer_imageFolderPath: "public",
    nextImageExportOptimizer_exportFolderPath: "out",
    nextImageExportOptimizer_quality: "75",
    nextImageExportOptimizer_storePicturesInWEBP: "true",
    nextImageExportOptimizer_generateAndUseBlurImages: "true",
  },
};

export default nextConfig;