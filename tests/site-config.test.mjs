import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

// Reserved .test hostnames simulate hosting configuration; none is a real URL.
function configuration(overrides = {}) {
  return spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      "import * as config from './site.config.mjs'; console.log(JSON.stringify(config));",
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        SITE_URL: '',
        VERCEL: '',
        VERCEL_URL: '',
        VERCEL_ENV: '',
        ...overrides,
      },
    },
  );
}

test('local development has a working origin without claiming a canonical URL', () => {
  const result = configuration();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    siteOrigin: 'http://localhost:4321',
    indexable: false,
  });
});

test('initial Vercel build uses only its assigned deployment origin', () => {
  const result = configuration({
    VERCEL: '1',
    VERCEL_URL: 'fieldnotes-deployment.test',
    VERCEL_ENV: 'production',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    siteOrigin: 'https://fieldnotes-deployment.test',
    indexable: false,
  });
});

test('explicit SITE_URL enables production canonicals while previews stay unindexed', () => {
  const settings = {
    SITE_URL: 'https://fieldnotes-canonical.test',
    VERCEL: '1',
    VERCEL_URL: 'fieldnotes-deployment.test',
  };
  for (const environment of ['production', 'preview']) {
    const result = configuration({ ...settings, VERCEL_ENV: environment });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), {
      canonicalOrigin: settings.SITE_URL,
      siteOrigin: settings.SITE_URL,
      indexable: environment === 'production',
    });
  }
});

test('invalid origins and unavailable Vercel system variables fail with an actionable error', () => {
  for (const url of [
    'https://fieldnotes-canonical.test/path',
    'javascript:alert(1)',
    'https://fieldnotes-canonical.test/?query=1',
  ]) {
    const result = configuration({ SITE_URL: url });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /SITE_URL must be an HTTP\(S\) origin/);
  }
  const result = configuration({ VERCEL: '1' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Enable Vercel system environment variables/);
});
