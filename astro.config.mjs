import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { unified } from '@astrojs/markdown-remark';
import rehypeCode from './src/plugins/rehype-code.mjs';
import { siteOrigin } from './site.config.mjs';

export default defineConfig({
  site: siteOrigin,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [mdx(), sitemap({ filter: (url) => !url.endsWith('/404/') })],
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
