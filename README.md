# Awesome Goodman

Software Engineer.

I build things end-to-end: APIs, UI, infrastructure, data pipelines, AI.

Currently working with Java, JavaScript, and Python.

[Portfolio](https://awesomegoodman.vercel.app) · [LinkedIn](https://linkedin.com/in/awesomegoodman) · [Email](mailto:goodman.awesome@gmail.com)

<!-- 

## Routes

| URL                                                                 | Content                                                                                              |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `/`                                                                 | Original portfolio homepage: intro, About, experience/education, work, testimonials, contact         |
| `/portfolio/`                                                       | Dedicated portfolio gallery with the same four projects, dialogs, testimonials, and contact controls |
| `/blog/`                                                            | Fieldnotes homepage                                                                                  |
| `/blog/writing/`, `/blog/projects/`, `/blog/tags/*`, `/blog/about/` | Fieldnotes archives, articles, project notes, topics, and About                                      |
| `/blog/rss.xml`                                                     | Fieldnotes RSS feed                                                                                  |
| `/sitemap-index.xml`, `/robots.txt`                                 | Shared site discovery                                                                                |

The supplied portfolio’s old `/portfolio/` was only a client redirect to `/`. It is now a real gallery, reusing the homepage’s Astro components.

## Development and checks

Use Node **24.16+ in the 24.x line** (`.node-version` pins 24.22.2).

```sh
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:4321`. Build with `npm run build`; `npm run preview` serves `dist/`.

```sh
npm run format
npm run validate
npx playwright install chromium
npm run test:e2e
```

Validation includes formatting, ESLint, Astro/TypeScript, production output, internal links/fragments, images/srcsets, CSS/font assets, metadata, RSS, sitemap, redirects, and example attribution. Browser tests use a separate production preview at port **4322** and cover both sections on desktop and mobile: navigation, themes, keyboard/dialog focus, menu behaviour, mail-client selection, carousel controls, responsive widths, reduced motion, original intro animations, no-JavaScript reading, accessibility, Mermaid and MDX. CI runs validation and browser checks. Automated checks supplement manual screen-reader review.

## Source organisation and integration decisions

- **One application:** root `package.json`, `astro.config.mjs`, content collections, and build output. No iframe, embedded legacy HTML application, second build, or runtime server.
- **Portfolio:** `src/layouts/PortfolioLayout.astro`, `src/components/portfolio/`, `src/styles/portfolio/`, and `src/scripts/portfolio/main.ts`. The original markup, grids, colours, responsive breakpoints, animations, project descriptions, testimonials, and CV/contact links were migrated from the supplied site. Gallery components are shared by `/` and `/portfolio/`.
- **Isolation:** portfolio selectors are namespaced to `html.portfolio-site` and loaded only by its layout. Fieldnotes uses its original `BaseLayout` and `global.css`, on `html.fieldnotes-site`. There is no client router: full document navigation keeps portfolio listeners/plugins and the blog theme isolated.
- **Assets:** active portfolio photos, project images, icons, and the original font families live in `src/assets/portfolio/`, imported and fingerprinted by Astro/Vite. Fonts are self-hosted, with OFL licences beside them. `public/` contains only static assets/hosting files, including the retained `/senku.png` social avatar, generated manifest icons, and blog favicon/social card under `/blog/`. The unused style-guide page, commented-out sample projects, unused images, and global plugins bundle were removed after verification.
- **Interactions:** Anime.js, Swiper, BasicLightbox, MoveTo, and MailtoUI are imported from the same npm dependency graph rather than copied into a global script bundle. The original unused Prism plugin is omitted; Fieldnotes retains Shiki. Project dialogs add focus management, Escape, and a close button; menus expose expanded state. Small fixes improve muted-text contrast, link names, malformed headings, and no-JavaScript/reduced-motion fallbacks. On mobile the original email links use the native mail app; desktop keeps the mail-client chooser.
- **Paths:** `src/lib/paths.ts` provides `pathTo()` for site paths and `blogPath()` for Fieldnotes. The `pathTo` export in `src/lib/content.ts` deliberately aliases `blogPath` so existing blog components remain readable. `BASE_PATH` is an optional hosting subdirectory, not the blog prefix.

### Content and configuration

`src/config.ts` holds the Fieldnotes identity and contact details. Portfolio biography, CV link, project descriptions, phone/WhatsApp links, and testimonials are preserved from the supplied portfolio; update their Astro components when those details change. External destinations and CV availability are not controlled by this static site.

`site.config.mjs` defaults to the confirmed canonical origin `https://awesomegoodman.vercel.app`; `SITE_URL` can explicitly override it for another static host. Vercel’s deployment/branch URLs never replace the canonical origin. Preview deployments are marked `noindex`. `BASE_PATH=/` is the production setting.

Add `.md`/`.mdx` files in `src/content/writing/` or `src/content/projects/`. Filenames become `/blog/writing/<slug>/` or `/blog/projects/<slug>/`; nested folders work. Required metadata is title, description, date, and at least one lowercase kebab-case tag. Optional fields include `updated`, `draft`, `example`, and `featured`. Writing supports `Note`, `Tutorial`, `Experiment`, and `Essay`; projects support a status, repository/demo links, and decorative visual. Drafts are excluded everywhere; dates do not schedule publication.

Use language-labelled code fences, `$...$`/`$$...$$` for KaTeX, and `mermaid` fences with accessible titles/descriptions. MDX can import Astro components for interactive demonstrations. Images belong in `src/assets/`, with alt text and dimensions. Relative public links between existing content entries still work because their routes moved together. Use the path helpers for absolute navigation. Content, tags, related notes, reading time, RSS, and sitemap remain automatic.

The **three Fieldnotes articles and two Fieldnotes projects are still labelled illustrative examples**, not publications, results, or achievements. They are separate from the actual portfolio gallery migrated from the supplied HTML. Keep the example flags/notices; regression tests reference these five entries. Reserved `.test` domains appear only in configuration tests.

The Fieldnotes social card is `public/blog/og.png`; regenerate it with `npm run generate:og`. Portfolio image sources remain intact; Astro generates smaller WebP display variants. The original avatar is retained in `src/assets/portfolio/avatar.png`; `npm run generate:portfolio-icons` creates lightweight favicon/touch/manifest icons and a smaller `/senku.png` social image from it. Commit generated public assets when changing either identity.

## Redirects and portability

Existing `/writing/*`, `/projects/*`, `/tags/*`, and `/about/` URLs have static redirect pages generated from the migration snapshot in `astro.config.mjs`, plus permanent wildcard Vercel redirects to `/blog/...`. New blog entries need no legacy alias because their URLs start under `/blog/`. Vercel also redirects `/rss.xml`, `/favicon.svg`, and `/og.png` to their new blog locations, plus legacy `index.html` URLs to clean routes. A root RSS mirror keeps subscriptions readable on static hosts without redirect support. The old blog homepage at `/` cannot redirect because `/` now intentionally serves the portfolio.

Vercel’s redirect rules take precedence over static fallback pages; actual HTTP redirect status/edge behaviour should be checked after deployment. Other hosts can serve `dist/`; static page redirects use meta refresh. Add redirects for renamed content in `astro.config.mjs` and the host configuration, keeping sitemap URLs canonical.

The optional manual GitHub Pages workflow discovers the alternative origin/base path. Cloudflare Pages can also serve `dist/` (`npm run build`, Node 24.x, explicit `SITE_URL`); `public/_headers` is retained for that host. Vercel uses `vercel.json`. For a subdirectory portability check, set `SITE_URL` to the alternative origin and `BASE_PATH` to its repository prefix for both build and tests, then rebuild normally.

## Deploy the unified site to Vercel

Deployment has **not** been performed by this migration.

1. Run validation and browser tests, then commit and push this repository.
2. In the **existing Vercel project serving `awesomegoodman.vercel.app`**, connect this repository/production branch. Set the root directory to the repository root, not the former `awesome/` directory. Keep one project/deployment for both sections.
3. Select **Astro**, Node **24.x**, install command **`npm ci`**, build command **`npm run build`**, and output **`dist`**. No server adapter is needed. `vercel.json` contains build, caching, security-header, trailing-slash, and redirect settings; remove any old SPA catch-all rewrite in project settings.
4. Set **`SITE_URL=https://awesomegoodman.vercel.app`** and **`BASE_PATH=/`** for Production (and the same origin for Preview if configuring overrides). Redeploy. Keep the domain attached to this project.
5. Check `/`, `/portfolio/`, `/blog/`, an article and dialog, `/blog/rss.xml`, the shared sitemap, a missing page (404), and old article/feed URLs (permanent redirects). Check canonical/OG URLs use the production domain and previews stay `noindex`.

See [Astro’s static Vercel guide](https://docs.astro.build/en/guides/deploy/vercel/).

## Architecture Decisions and Alternatives

- **Independent Git-backed static publishing:** portable files, revision history, and owned URLs suit a permanent home. Medium, Substack, and Hashnode put publishing inside another platform’s product/policies; Ghost and WordPress add service or server/database/plugin maintenance this site does not need.
- **Astro over Hugo/Zola:** typed content collections and optional components support essays and technical demonstrations, at the cost of more JavaScript build dependencies than smaller generators. Most writing remains portable Markdown; MDX is opt-in and carries some component coupling.
- **One static deployment:** Astro renders both identities without merging their CSS or adding a UI framework. Reusing original portfolio sections keeps fidelity and avoids duplicate maintenance. Vercel serves the confirmed domain; static output remains portable to other hosts.
- **Principles:** ownership, simplicity, low maintenance, readable technical writing, and focused interactive examples. No database, CMS, authentication, comments, analytics, newsletter, or monetisation.

The lockfile pins the verified dependency graph. Patched transitive KaTeX and `minimatch` overrides remain; review them when upgrading, run `npm audit`, and rerun checks. -->
