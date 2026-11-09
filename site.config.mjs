import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env')) loadEnvFile('.env');

// The portfolio and Fieldnotes now share the confirmed production domain.
// SITE_URL remains an explicit override for portable static-host deployments.
export const canonicalOrigin =
  process.env.SITE_URL?.trim() || 'https://awesomegoodman.vercel.app';
export const siteOrigin = canonicalOrigin;
export const indexable =
  Boolean(canonicalOrigin) && process.env.VERCEL_ENV !== 'preview';

const url = new URL(siteOrigin);
if (
  !['https:', 'http:'].includes(url.protocol) ||
  url.pathname !== '/' ||
  url.search ||
  url.hash ||
  url.username ||
  url.password
) {
  throw new Error(
    'SITE_URL must be an HTTP(S) origin without a path, query, fragment or credentials. Use BASE_PATH for a subdirectory.',
  );
}
