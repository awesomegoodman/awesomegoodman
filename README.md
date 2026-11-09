# Awesome Goodman

Software Engineer.

I build things end-to-end: APIs, UI, infrastructure, data pipelines, AI.

Currently working with Java, JavaScript, and Python.

[Portfolio](https://awesomegoodman.vercel.app) · [LinkedIn](https://linkedin.com/in/awesomegoodman) · [Email](mailto:goodman.awesome@gmail.com)

<!-- # Fieldnotes — Awesome Goodman

A personal notebook by **Awesome Goodman** (`awesomegoodman`), a software engineer interested in software engineering, robotics, machine learning, algorithms, and other STEM subjects, with room for philosophy, theology, anime, and gaming.

[Portfolio](https://awesomegoodman.vercel.app/) · [GitHub](https://github.com/awesomegoodman) · [Email](mailto:goodman.awesome@gmail.com)

The portfolio is a separate website, not the assumed canonical URL for Fieldnotes. Fieldnotes targets **Vercel static hosting**. It has not been deployed, and its canonical origin is intentionally unset.

## Setup and checks

Use Node **24.16+ in the 24.x line**; `.node-version` pins 24.22.2.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:4321`. `npm run build` creates `dist/`; `npm run preview` serves that production output.

```sh
npm run validate
npx playwright install chromium
npm run test:e2e
```

Validation covers formatting, ESLint, Astro/TypeScript, the production build, internal links/assets, metadata, RSS, sitemap, identity/example attribution, and hosting configuration. Browser tests cover desktop/mobile navigation, both themes, automated accessibility, keyboard use, diagrams, MDX, and reading without JavaScript. Use `npm run format` before committing. CI runs validation and browser checks; manual screen-reader review remains useful.

## Configuration and content

- `src/config.ts`: confirmed identity, description, email, GitHub, and separate portfolio URL. About copy uses only the supplied role and interests.
- `site.config.mjs`: build-origin selection. Priority is explicit `SITE_URL`, Vercel’s assigned `VERCEL_URL`, then the local development server. Only explicit `SITE_URL` emits canonical tags. Builds without a canonical origin and Vercel previews are marked `noindex`; RSS, sitemap, and social-image URLs still use the available build origin.
- `.env`: leave `SITE_URL` blank until the first Vercel deployment. Set it afterwards to the selected production origin, with protocol and no path. `BASE_PATH=/` suits Vercel. Host/shell environment variables override `.env`.
- `scripts/generate-og.mjs`: social-card artwork reads the identity from `src/config.ts`. Run `npm run generate:og` after changing it; commit `public/og.png`.

Add `.md` or `.mdx` files under `src/content/writing/` or `src/content/projects/`. Filenames become stable URLs; nested folders work. No application-code changes are needed for new entries.

```yaml
---
title: 'An illustrative article title'
description: 'An illustrative summary of the article.'
date: 2026-11-01
tags: [software-engineering]
kind: Note
# Optional: updated, draft, example, featured
---
```

This frontmatter is a documentation example, not a publication. Writing kinds are `Note`, `Tutorial`, `Experiment`, and `Essay`. Projects use `status` (`Idea`, `In progress`, `Complete`, `Archived`) instead of `kind`, with optional `repository`, `demo`, and `visual` (`system`, `chess`, `grid`). Only title, description, date, and at least one lowercase kebab-case tag are required. Updates cannot precede publication dates. `draft: true` excludes content everywhere; future dates do not schedule publication. Tags, related entries, reading time, RSS, and sitemap update automatically.

Use language-labelled code fences, `$...$`/`$$...$$` for KaTeX, and `mermaid` fences with `accTitle`/`accDescr` for diagrams. Mermaid renders in the browser and keeps its source readable without JavaScript; its larger chunks load only on diagram pages. Images belong in `src/assets/`, with descriptive alt text and dimensions; Astro’s `Image` component can optimise raster images. MDX can import the existing interactive Astro components. Keep essential explanations readable without JavaScript, and treat MDX as trusted executable content.

Use relative public links in Markdown and `pathTo()`/`entryUrl()` from `src/lib/content.ts` in components so subdirectory hosting works.

### Intentionally retained examples

All **three articles and two projects** remain approved demonstrations. Their labels, notices, metadata, and RSS descriptions identify them as illustrative, including their dates and project statuses. They are not Awesome Goodman’s publications, completed projects, results, or achievements; they have no personal author byline or author metadata. Regression tests reference these five examples to verify technical features. Keep their flags intact; update the corresponding tests if replacing them later. Reserved `.test` hostnames occur only in automated hosting tests.

## Publish to Vercel

1. Run the checks above, commit the project and lockfile, and push to GitHub.
2. Import the repository as a **new Vercel project**, separate from the existing portfolio. Select **Astro**, the repository root, **Node 24.x**, install command `npm ci`, build command `npm run build`, and output directory `dist`. `vercel.json` records the static build, trailing slashes, and existing security/cache headers; no adapter or backend is required.
3. Keep **access to System Environment Variables** enabled so the first build can use `VERCEL_URL`. Leave `SITE_URL` unset and `BASE_PATH=/`. Deploy using Vercel’s assigned URL; no hostname is guessed in source.
4. After deployment, copy the chosen stable production URL from Vercel’s **Domains** settings. Set `SITE_URL` to that full origin in the project’s Production environment, then **redeploy**. This enables canonical tags and production indexing, and aligns feed, sitemap, and Open Graph URLs. A custom domain can be added later by updating `SITE_URL` and rebuilding.
5. Check the home page, About/contact links, an example article, `/rss.xml`, `/sitemap-index.xml`, and an unknown URL (the custom 404). Verify the canonical tags after the second deployment. Future production-branch pushes rebuild the site.

Vercel previews remain `noindex`. If providing `SITE_URL` to Preview too, use the confirmed production origin so preview canonical tags point to production. See the official [Astro deployment guide](https://docs.astro.build/en/guides/deploy/vercel/) and [Vercel system-variable reference](https://vercel.com/docs/environment-variables/system-environment-variables).

### Static-host alternatives

GitHub Pages remains available through the manual **Deploy to GitHub Pages** workflow: select GitHub Actions in repository Pages settings, then run it. The workflow discovers the origin and base path. `public/.nojekyll` is retained. `BASE_PATH` supports repository subdirectories; the `/repository-name` convention is illustrative, not a configured deployment.

Cloudflare Pages can also serve `dist/` using `npm run build`, Node 24.x, and an explicitly configured `SITE_URL`. `public/_headers` is retained for that alternative; Vercel uses `vercel.json` instead. All output is ordinary static HTML and assets, with no CMS, database, or runtime service.

## Architecture Decisions and Alternatives

- **Independent Git-backed static site:** ownership of content/URLs and portable revision history suit a permanent notebook. Medium, Substack, and Hashnode place publishing inside another platform’s product and policies. Ghost and WordPress add hosting/service or server, database, and plugin maintenance that this site does not require.
- **Astro:** static output, TypeScript, typed collections, and optional components suit essays and technical demonstrations. Hugo and Zola have smaller toolchains; Astro accepts more JavaScript dependencies in exchange for its component model and MDX integration.
- **Markdown/MDX and Content Collections:** Markdown keeps ordinary writing portable; MDX is opt-in for interactive explanations. Typed schemas validate local metadata during builds. Shiki, KaTeX, and Mermaid support technical writing without external runtime services.
- **Vercel:** selected for this deployment, using its assigned URL first and configuring the canonical origin afterwards. Static output stays portable to GitHub Pages, Cloudflare Pages, or another static host.
- **Principles:** portability, simplicity, low maintenance, readable technical writing, minimal client JavaScript, and room for focused interactive demonstrations. No authentication, comments, analytics, newsletter, or monetisation.

The lockfile pins the verified dependency graph. Patched transitive KaTeX and `minimatch` overrides remain; review them when updating dependencies, run `npm audit`, and rerun validation/browser checks. -->
