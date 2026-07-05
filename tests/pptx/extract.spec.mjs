import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSlideLayoutData } from '../../scripts/validate-slide-layout-data.mjs';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

test('extractor produces schema-valid JSON for the 01-title layout', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'pptx-extract-'));
  const outPath = join(tmpDir, 'slide-layout-data.json');

  // Run the extractor against a single-file input dir containing only 01-title.html
  // by pointing --input-dir at the real slides/ dir but asserting on that one entry
  // (the extractor always walks the full fixed LAYOUT_ORDER list).
  await execFileAsync('node', [
    resolve(REPO_ROOT, 'scripts/extract-slide-layout-data.mjs'),
    '--out',
    outPath,
  ]);

  const data = JSON.parse(await readFile(outPath, 'utf-8'));
  const { valid, errors } = validateSlideLayoutData(data);
  expect(errors).toEqual([]);
  expect(valid).toBe(true);

  const titleLayout = data.layouts.find((l) => l.layout_id === '01-title');
  expect(titleLayout).toBeTruthy();
  const roles = titleLayout.elements.map((e) => e.role);
  expect(roles).toEqual(expect.arrayContaining(['title', 'subtitle', 'meta']));

  await rm(tmpDir, { recursive: true, force: true });
});
