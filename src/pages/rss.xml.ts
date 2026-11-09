import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '../config';
import { entryUrl, published } from '../lib/content';

export const GET: APIRoute = async (context) => {
  const entries = [
    ...(await published('writing')),
    ...(await published('projects')),
  ].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  return rss({
    title: site.title,
    description: site.description,
    site: context.site!,
    items: entries.map((entry) => ({
      title: `${entry.data.example ? '[Example] ' : ''}${entry.data.title}`,
      description: entry.data.example
        ? `Illustrative example, not a record of ${site.author}’s work. ${entry.data.description}`
        : entry.data.description,
      pubDate: entry.data.date,
      link: entryUrl(entry),
      categories: entry.data.tags,
    })),
    customData: '<language>en-gb</language>',
  });
};
