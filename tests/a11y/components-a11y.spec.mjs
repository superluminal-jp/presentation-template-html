import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { repoRoot } from '../visual/_fixtures.mjs';

// SC-003 / INV-12: デッキ本体(付録=コンポーネント一本化先)のコントラストが WCAG 2.2 AA(axe: color-contrast)
test('a11y contrast: index.html (deck incl. appendix components)', async ({ page }) => {
  await page.goto(pathToFileURL(resolve(repoRoot, 'index.html')).href);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag21aa'])
    .options({ runOnly: ['color-contrast'] })
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
