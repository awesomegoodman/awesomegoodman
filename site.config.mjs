import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env')) loadEnvFile('.env');

// Choose the permanent origin explicitly after the first deployment. The
// provider hostname supports absolute feed/image URLs without claiming it as
// canonical; localhost is only the development fallback.
export const canonicalOrigin = process.env.SITE_URL?.trim() || undefined;
const deploymentOrigin = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
export const siteOrigin =
  canonicalOrigin || deploymentOrigin || 'http://localhost:4321';
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
if (process.env.VERCEL === '1' && !canonicalOrigin && !deploymentOrigin) {
  throw new Error(
    'Enable Vercel system environment variables so VERCEL_URL is available for the initial build, or set SITE_URL after deployment.',
  );
}
