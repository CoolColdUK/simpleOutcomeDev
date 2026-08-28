import type {MetadataRoute} from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SimpleOutcome',
    short_name: 'SimpleOutcome',
    description: 'Personal spaces and pods',
    start_url: '/app',
    scope: '/app',
    display: 'standalone',
    background_color: '#F6E7D8',
    theme_color: '#6B4F3A',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
