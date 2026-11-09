import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from '@astrojs/markdown-remark';
import rehypeCode from './src/plugins/rehype-code.mjs';
import { siteOrigin } from './site.config.mjs';

const basePath = (process.env.BASE_PATH || '/').replace(/\/$/, '');
// Snapshot of URLs published before the /blog/ migration. Explicit static
// aliases work on subdirectory hosts too; Vercel additionally has wildcards.
const legacyBlogPaths = [
  'about',
  'writing',
  'projects',
  'writing/chess-search',
  'writing/exploration-vs-exploitation',
  'writing/keeping-a-question-open',
  'projects/chess-engine',
  'projects/gridworld',
  'tags/algorithms',
  'tags/software-engineering',
  'tags/machine-learning',
  'tags/mdx',
  'tags/philosophy',
  'tags/learning',
];

export default defineConfig({
  site: siteOrigin,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  redirects: Object.fromEntries(
    legacyBlogPaths.map((path) => [`/${path}`, `${basePath}/blog/${path}/`]),
  ),
  integrations: [
    mdx(),
    sitemap({
      filter: (url) => {
        const path = new URL(url).pathname.slice(basePath.length);
        return (
          !path.endsWith('/404/') &&
          !path.endsWith('/404.html') &&
          !/^\/(writing|projects|tags|about)(\/|$)/.test(path)
        );
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex, rehypeCode],
    }),
    syntaxHighlight: { type: 'shiki', excludeLangs: ['math', 'mermaid'] },
    shikiConfig: {
      themes: {
        light: 'github-light-high-contrast',
        dark: 'github-dark-high-contrast',
      },
      wrap: false,
    },
  },
});
