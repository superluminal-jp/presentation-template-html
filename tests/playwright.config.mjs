import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 設定 — 16:9(1280×720)基準の検証。
 * 実行前提: `npm install` + `npx playwright install chromium`(ネットワーク要)。
 * ローカルの静的ファイルを file:// で開くため webServer は不要。
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
  ],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
});
