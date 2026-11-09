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
    if (document.querySelector('meta[http-equiv="refresh"]')) continue;
    assert.equal(document.querySelectorAll('h1').length, 1, file);
    assert.equal(document.documentElement.getAttribute('lang'), 'en', file);
    assert.ok(document.querySelector('main#main'), file);
    assert.ok(document.querySelector('a[href="#main"]'), file);
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
      !indexable || /\/404(?:\/index)?\.html$/.test(file),
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
    if (document.querySelector('meta[http-equiv="refresh"]')) continue;
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
    await readFile(join(root, 'blog/rss.xml'), 'utf8'),
    'text/xml',
  );
  const items = [...rss.querySelectorAll('item')];
  const contentFiles = htmlFiles.filter((file) =>
    /\/blog\/(writing|projects)\/.+\/index\.html$/.test(file),
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
  for (const path of ['/', '/portfolio/', '/blog/'])
    assert.ok(sitemap.includes(`${new URL(origin).origin}${base}${path}`));
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
    if (document.querySelector('meta[http-equiv="refresh"]')) continue;
    const html = document.documentElement.outerHTML;
    assert.ok(
      !html.includes('Your Name') && !html.includes('https://example.com'),
      file,
    );
    assert.ok(!html.includes('linkedin.com'), file);
    assert.ok(document.body.textContent.includes('Awesome Goodman'), file);
    for (const href of [
      'https://github.com/awesomegoodman',
      'mailto:goodman.awesome@gmail.com',
      `${base}/portfolio/`,
    ]) {
      if (
        href === `${base}/portfolio/` &&
        document.documentElement.classList.contains('portfolio-site')
      )
        continue;
      assert.ok(
        document.querySelector(`a[href="${href}"]`),
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
    await readFile(join(root, 'blog/rss.xml'), 'utf8'),
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
    join(root, 'blog/writing/chess-search/index.html'),
    'utf8',
  );
  assert.ok(chess.includes('astro-code'), 'Syntax highlighting missing');
  assert.ok(chess.includes('class="katex"'), 'Math missing from Markdown');
  assert.ok(
    chess.includes('language-mermaid'),
    'Portable diagram source missing',
  );
  const demo = await readFile(
    join(root, 'blog/writing/exploration-vs-exploitation/index.html'),
    'utf8',
  );
  assert.ok(demo.includes('class="katex"'), 'Math missing from MDX');
  assert.ok(demo.includes('<exploration-demo'), 'MDX component missing');
});

test('portfolio pages reuse the original active gallery; blog examples stay separate', () => {
  for (const file of ['index.html', 'portfolio/index.html']) {
    const document = documents.get(join(root, file));
    assert.ok(document.documentElement.classList.contains('portfolio-site'));
    assert.equal(document.querySelectorAll('.folio-list__item-link').length, 4);
    assert.equal(document.querySelectorAll('.project-template').length, 4);
    assert.equal(
      document.querySelectorAll('.testimonial-slider__slide').length,
      2,
    );
    assert.ok(document.querySelector(`a[href="${base}/blog/"]`));
    assert.ok(!document.querySelector('.site-header'));
    for (const project of [
      'Retailbox',
      'Snake Game with Reinforcement Learning',
      'Chess Engine',
      'Vendbox',
    ]) {
      assert.ok(document.body.textContent.includes(project));
    }
  }
  const home = documents.get(join(root, 'index.html'));
  assert.ok(home.querySelector('#intro') && home.querySelector('#about'));
  assert.ok(home.querySelector('a[href^="https://docs.google.com/document/"]'));
  const gallery = documents.get(join(root, 'portfolio/index.html'));
  assert.equal(gallery.querySelector('#intro'), null);
  assert.equal(gallery.querySelector('#about'), null);
  const blog = documents.get(join(root, 'blog/index.html'));
  assert.ok(blog.documentElement.classList.contains('fieldnotes-site'));
  assert.ok(!blog.querySelector('.s-pagewrap'));
});

test('responsive images, CSS assets, local fonts, and manifest icons resolve', async () => {
  for (const document of documents.values()) {
    for (const image of document.querySelectorAll('img[srcset]')) {
      for (const candidate of image.getAttribute('srcset').split(',')) {
        const url = new URL(candidate.trim().split(/\s+/)[0], origin);
        assert.ok(await stat(outputFor(url.pathname)), candidate);
      }
    }
  }
  for (const file of files.filter((file) => extname(file) === '.css')) {
    const css = await readFile(file, 'utf8');
    assert.ok(
      !css.includes('fonts.googleapis.com'),
      'Fonts must be self-hosted',
    );
    const relativePath = file.slice(root.length).replaceAll('\\', '/');
    for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
      const value = match[1].trim();
      if (value.startsWith('data:')) continue;
      const url = new URL(value, new URL(`${base}${relativePath}`, origin));
      if (url.origin === new URL(origin).origin)
        assert.ok(await stat(outputFor(url.pathname)), value);
    }
  }
  const manifest = JSON.parse(
    await readFile(join(root, 'site.webmanifest'), 'utf8'),
  );
  assert.equal(manifest.name, 'Awesome Goodman');
  assert.equal(manifest.start_url, `${base}/`);
  for (const icon of manifest.icons) {
    const png = await readFile(outputFor(new URL(icon.src, origin).pathname));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test('legacy blog routes redirect to the namespace and feeds use the blog homepage', async () => {
  for (const [oldPath, newPath] of [
    ['about', 'blog/about'],
    ['writing', 'blog/writing'],
    ['writing/chess-search', 'blog/writing/chess-search'],
    ['projects/gridworld', 'blog/projects/gridworld'],
    ['tags/algorithms', 'blog/tags/algorithms'],
  ]) {
    const document = documents.get(join(root, oldPath, 'index.html'));
    assert.ok(
      document
        .querySelector('meta[http-equiv="refresh"]')
        .getAttribute('content')
        .includes(`${base}/${newPath}/`),
    );
  }
  const feed = await readFile(join(root, 'blog/rss.xml'), 'utf8');
  assert.equal(
    await readFile(join(root, 'rss.xml'), 'utf8'),
    feed,
    'Static fallback feed must remain usable',
  );
  const rss = new DOMParser().parseFromString(feed, 'text/xml');
  assert.equal(
    rss.querySelector('channel > link').textContent,
    `${new URL(origin).origin}${base}/blog/`,
  );
  const sitemap = new DOMParser().parseFromString(
    await readFile(join(root, 'sitemap-0.xml'), 'utf8'),
    'text/xml',
  );
  for (const entry of sitemap.querySelectorAll('url > loc')) {
    const pathname = new URL(entry.textContent).pathname.slice(base.length);
    assert.ok(
      pathname === '/' ||
        pathname === '/portfolio/' ||
        pathname.startsWith('/blog/'),
      pathname,
    );
  }
  const hosting = JSON.parse(await readFile('vercel.json', 'utf8'));
  for (const source of [
    '/writing/:path*',
    '/projects/:path*',
    '/tags/:path*',
    '/rss.xml',
  ]) {
    const redirect = hosting.redirects.find((entry) => entry.source === source);
    assert.ok(
      redirect?.permanent && redirect.destination.startsWith('/blog/'),
      source,
    );
  }
});
