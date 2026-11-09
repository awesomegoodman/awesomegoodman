import { getCollection, type CollectionEntry } from 'astro:content';
import { blogPath } from './paths';
export { blogPath as pathTo } from './paths';

export type Entry = CollectionEntry<'writing'> | CollectionEntry<'projects'>;

export function entryUrl(entry: Entry) {
  return blogPath(`${entry.collection}/${entry.id}/`);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function readingTime(body = '') {
  const text = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_~`]/g, '');
  return Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));
}

export function tagLabel(tag: string) {
  const labels: Record<string, string> = {
    'machine-learning': 'Machine learning',
    mdx: 'MDX',
    stem: 'STEM',
  };
  return (
    labels[tag] ??
    tag.replaceAll('-', ' ').replace(/^./, (s) => s.toUpperCase())
  );
}

export async function published<K extends 'writing' | 'projects'>(
  collection: K,
) {
  const entries = await getCollection(collection, ({ data }) => !data.draft);
  return entries.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
}

export function relatedTo(entry: Entry, candidates: Entry[], limit = 3) {
  return candidates
    .filter((candidate) => entryUrl(candidate) !== entryUrl(entry))
    .map((candidate) => ({
      candidate,
      score: candidate.data.tags.filter((tag) => entry.data.tags.includes(tag))
        .length,
    }))
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.candidate.data.date.getTime() - a.candidate.data.date.getTime(),
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}
