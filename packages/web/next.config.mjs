import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', '@so/component'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
