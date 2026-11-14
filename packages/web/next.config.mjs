import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function publicSupabaseUrl() {
  const ref = process.env.SUPABASE_PROJECT_REF?.trim() ?? '';
  if (ref.length > 0) {
    return `https://${ref}.supabase.co`;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? '';
  if (url.length > 0) {
    return url;
  }
  return undefined;
}

const supabaseUrl = publicSupabaseUrl();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../..'),
  ...(supabaseUrl === undefined ? {} : {env: {NEXT_PUBLIC_SUPABASE_URL: supabaseUrl}}),
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', '@so/component'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
