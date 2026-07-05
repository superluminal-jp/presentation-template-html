import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { repoRoot } from '../visual/_fixtures.mjs';

// T007 / SC-003: コンポーネント集ページのコントラストが WCAG 2.2 AA(axe: color-contrast)
test('a11y contrast: components.html', async ({ page }) => {
  await page.goto(pathToFileURL(resolve(repoRoot, 'components.html')).href);
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag21aa'])
    .options({ runOnly: ['color-contrast'] })
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
