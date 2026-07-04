import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LAYOUTS, slideUrl } from '../visual/_fixtures.mjs';

// T028 / SC-04: 各レイアウトのコントラストが WCAG 2.2 AA(axe: color-contrast)
for (const name of LAYOUTS) {
  test(`a11y contrast: ${name}`, async ({ page }) => {
    await page.goto(slideUrl(name));
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .options({ runOnly: ['color-contrast'] })
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
