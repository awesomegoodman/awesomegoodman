import { defineConfig, devices } from '@playwright/test';
import shared from './playwright.config';

export default defineConfig({
  ...shared,
  testDir: './tests/visual',
  workers: 2,
  retries: 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.VISUAL_BASE_URL || 'http://127.0.0.1:4322',
    reducedMotion: 'reduce',
    colorScheme: 'dark',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium' }],
  snapshotPathTemplate: '{testDir}/snapshots/{arg}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixels: 0, animations: 'disabled' } },
  webServer: process.env.VISUAL_BASE_URL ? undefined : shared.webServer,
});
