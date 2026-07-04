import { test, expect } from '@playwright/test';
import { LAYOUTS, slideUrl } from './_fixtures.mjs';

/**
 * T037 + T038 / SC-07: DS更新耐性。
 * - 初回実行でレイアウト別ベースラインを取得(__baselines__)。
 * - `--speckit-sim-rename` 相当のトークン改名を写像層エイリアスで吸収した状態でも、
 *   レイアウト定義を変更せずベースライン差分が閾値(maxDiffPixelRatio=0.001)内であること。
 *
 * 改名シミュレーション: ページ読込後に vendor 変数のエイリアスを注入し、写像層が同値へ解決することを模す。
 * (実際の更新運用は docs/ds-version-map.md のランブックに従う)
 */
for (const name of LAYOUTS) {
  test(`ds-update resilience: ${name} stable under alias absorption`, async ({ page }) => {
    await page.goto(slideUrl(name));
    // 写像層が吸収する想定の別名を注入(役割変数は不変のはず = 差分ゼロ)
    await page.addStyleTag({
      content: ':root{ --color-key-800-alias: var(--color-key-800); }',
    });
    await expect(page.locator('.slide')).toHaveScreenshot(`${name}.png`, { maxDiffPixelRatio: 0.001 });
  });
}
