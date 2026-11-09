import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { test } from 'node:test';
import { parseHTML, DOMParser } from 'linkedom';
import { canonicalOrigin, siteOrigin, indexable } from '../site.config.mjs';

const root = resolve('dist');
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
const origin = siteOrigin;

async function filesIn(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? filesIn(join(dir, entry.name))
          : join(dir, entry.name),
      ),
    )
  ).flat();
}

const files = await filesIn(root);
const htmlFiles = files.filter((file) => extname(file) === '.html');
const documents = new Map();
for (const file of htmlFiles) {
  documents.set(file, parseHTML(await readFile(file, 'utf8')).document);
}

function pageUrl(document) {
  return new URL(
    document.querySelector('meta[property="og:url"]').getAttribute('content'),
  );
}

function outputFor(pathname) {
  assert.ok(
    !base || pathname === base || pathname.startsWith(`${base}/`),
    `Missing base path: ${pathname}`,
  );
  const relative = decodeURIComponent(pathname.slice(base.length)).replace(
    /^\//,
    '',
  );
  return join(
    root,
    relative.endsWith('/') || !extname(relative)
      ? `${relative.replace(/\/$/, '')}/index.html`
      : relative,
  );
}

test('generated pages have complete, distinct metadata and accessible structure', () => {
  const titles = new Set();
  for (const [file, document] of documents) {
    assert.equal(document.querySelectorAll('h1').length, 1, file);
    assert.equal(document.documentElement.getAttribute('lang'), 'en', file);
    assert.ok(document.querySelector('main#main'), file);
    assert.ok(document.querySelector('a.skip-link[href="#main"]'), file);
    const title = document.querySelector('title')?.textContent;
    assert.ok(
      title && !titles.has(title),
      `Missing or duplicate title in ${file}`,
    );
    titles.add(title);
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:image"]',
      'meta[property="og:url"]',
    ]) {
      assert.ok(
        document.querySelector(selector),
        `${selector} missing in ${file}`,
      );
    }
    const url = pageUrl(document);
    assert.equal(url.origin, new URL(origin).origin, file);
    assert.equal(url.search, '', file);
    assert.equal(url.hash, '', file);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonicalOrigin)
      assert.equal(canonical?.getAttribute('href'), url.href, file);
    else
      assert.equal(
        canonical,
        null,
        `Canonical must remain unset before configuration: ${file}`,
      );
    const robots = document.querySelector('meta[name="robots"]');
    assert.equal(
      Boolean(robots?.getAttribute('content')?.includes('noindex')),
      !indexable || file.endsWith('/404.html'),
      file,
    );
    for (const image of document.querySelectorAll('img')) {
      assert.ok(image.hasAttribute('alt'), `Missing image alt in ${file}`);
      assert.ok(
        image.getAttribute('width') && image.getAttribute('height'),
        `Missing image dimensions in ${file}`,
      );
    }
  }
});

test('every internal page link, fragment and local asset resolves, including under a base path', async () => {
  for (const [file, document] of documents) {
    const page = pageUrl(document);
    for (const node of document.querySelectorAll(
      'a[href], img[src], script[src], link[href]',
    )) {
      const raw = node.getAttribute('href') || node.getAttribute('src');
      const target = new URL(raw, page);
      if (
        target.origin !== new URL(origin).origin ||
        !['http:', 'https:'].includes(target.protocol)
      )
        continue;
      const output = outputFor(target.pathname);
      assert.ok(
        await stat(output).catch(() => false),
        `${raw} does not resolve in ${file}`,
      );
      if (target.hash && output.endsWith('.html')) {
        const targetDocument = documents.get(output);
        assert.ok(
          targetDocument?.getElementById(
            decodeURIComponent(target.hash.slice(1)),
          ),
          `Missing fragment ${raw} in ${file}`,
        );
      }
    }
  }
});

test('feeds and sitemap advertise published entries; 404 is excluded from sitemap', async () => {
  const parser = new DOMParser();
  const rss = parser.parseFromString(
    await readFile(join(root, 'rss.xml'), 'utf8'),
    'text/xml',
  );
  const items = [...rss.querySelectorAll('item')];
  const contentFiles = htmlFiles.filter((file) =>
    /\/(writing|projects)\/.+\/index\.html$/.test(file),
  );
  assert.equal(items.length, contentFiles.length);
  for (const item of items) {
    const url = new URL(item.querySelector('link').textContent);
    assert.ok(await stat(outputFor(url.pathname)));
    assert.ok(
      !Number.isNaN(Date.parse(item.querySelector('pubDate').textContent)),
    );
  }
  const sitemap = await readFile(join(root, 'sitemap-0.xml'), 'utf8');
  assert.ok(!sitemap.includes('/404/'));
  assert.ok(!sitemap.includes('404.html'));
  for (const file of contentFiles) {
    const canonical = pageUrl(documents.get(file)).href;
    assert.ok(
      sitemap.includes(canonical),
      `Missing sitemap entry ${canonical}`,
    );
  }
  assert.ok(
    (await readFile(join(root, 'robots.txt'), 'utf8')).includes(
      `${new URL(origin).origin}${base}/sitemap-index.xml`,
    ),
  );
});

test('identity, contact links and example attribution are consistent across all pages', async () => {
  let exampleCount = 0;
  for (const [file, document] of documents) {
    const html = document.documentElement.outerHTML;
    assert.ok(
      !html.includes('Your Name') && !html.includes('https://example.com'),
      file,
    );
    assert.ok(!html.includes('linkedin.com'), file);
    assert.ok(
      document
        .querySelector('.wordmark')
        .textContent.includes('Awesome Goodman'),
      file,
    );
    for (const href of [
      'https://github.com/awesomegoodman',
      'mailto:goodman.awesome@gmail.com',
      'https://awesomegoodman.vercel.app/',
    ]) {
      assert.ok(
        document.querySelector(`footer a[href="${href}"]`),
        `Missing contact ${href}: ${file}`,
      );
    }
    if (!document.querySelector('.example-notice')) continue;
    exampleCount += 1;
    assert.equal(document.querySelector('meta[name="author"]'), null, file);
    assert.ok(
      document.querySelector('title').textContent.startsWith('[Example]'),
      file,
    );
    assert.ok(
      document
        .querySelector('.article-meta')
        .textContent.includes('Illustrative example'),
      file,
    );
    assert.ok(
      document
        .querySelector('.example-notice')
        .textContent.includes('Awesome Goodman'),
      file,
    );
    const data = JSON.parse(
      document.querySelector('script[type="application/ld+json"]').textContent,
    );
    assert.equal(data.author, undefined, file);
    assert.ok(data.headline.startsWith('[Example]'), file);
    assert.ok(data.description.includes('Illustrative example'), file);
  }
  assert.equal(exampleCount, 5, 'Retain all five approved examples');
  const rss = new DOMParser().parseFromString(
    await readFile(join(root, 'rss.xml'), 'utf8'),
    'text/xml',
  );
  for (const item of rss.querySelectorAll('item')) {
    assert.ok(item.querySelector('title').textContent.startsWith('[Example]'));
    assert.ok(
      item
        .querySelector('description')
        .textContent.includes('Illustrative example'),
    );
  }
});

test('technical content is rendered at build time with progressive diagram source', async () => {
  const chess = await readFile(
    join(root, 'writing/chess-search/index.html'),
    'utf8',
  );
  assert.ok(chess.includes('astro-code'), 'Syntax highlighting missing');
  assert.ok(chess.includes('class="katex"'), 'Math missing from Markdown');
  assert.ok(
    chess.includes('language-mermaid'),
    'Portable diagram source missing',
  );
  const demo = await readFile(
    join(root, 'writing/exploration-vs-exploitation/index.html'),
    'utf8',
  );
  assert.ok(demo.includes('class="katex"'), 'Math missing from MDX');
  assert.ok(demo.includes('<exploration-demo'), 'MDX component missing');
});
