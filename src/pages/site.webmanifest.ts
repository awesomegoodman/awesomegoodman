import type { APIRoute } from 'astro';
import { pathTo } from '../lib/paths';

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: 'Awesome Goodman',
      short_name: 'Awesome',
      start_url: pathTo(),
      icons: [192, 512].map((size) => ({
        src: pathTo(`portfolio-icons/icon-${size}.png`),
        sizes: `${size}x${size}`,
        type: 'image/png',
      })),
      theme_color: '#141516',
      background_color: '#141516',
      display: 'standalone',
    }),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
