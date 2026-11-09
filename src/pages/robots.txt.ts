import type { APIRoute } from 'astro';
import { pathTo } from '../lib/content';

export const GET: APIRoute = ({ site }) =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL(pathTo('sitemap-index.xml'), site)}\n`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
