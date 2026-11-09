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

test('the confirmed unified domain is canonical by default, including local builds', () => {
  const result = configuration();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    canonicalOrigin: 'https://awesomegoodman.vercel.app',
    siteOrigin: 'https://awesomegoodman.vercel.app',
    indexable: true,
  });
});

test('Vercel deployment hostnames cannot replace the confirmed canonical origin', () => {
  const result = configuration({
    VERCEL: '1',
    VERCEL_URL: 'fieldnotes-deployment.test',
    VERCEL_ENV: 'production',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    canonicalOrigin: 'https://awesomegoodman.vercel.app',
    siteOrigin: 'https://awesomegoodman.vercel.app',
    indexable: true,
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

test('invalid canonical origins fail; deployment variables are optional', () => {
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
  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    JSON.parse(result.stdout).siteOrigin,
    'https://awesomegoodman.vercel.app',
  );
});
