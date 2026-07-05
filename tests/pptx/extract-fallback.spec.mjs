import { test, expect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

test('extractor marks the dashboard chart element as a fallback with a captured image', async () => {
  const tmpDir = await mkdtemp(join(tmpdir(), 'pptx-extract-fallback-'));
  const outPath = join(tmpDir, 'slide-layout-data.json');

  await execFileAsync('node', [
    resolve(REPO_ROOT, 'scripts/extract-slide-layout-data.mjs'),
    '--out',
    outPath,
  ]);

  const data = JSON.parse(await readFile(outPath, 'utf-8'));
  const dashboardLayout = data.layouts.find((l) => l.layout_id === '10-dashboard');
  expect(dashboardLayout).toBeTruthy();

  const chartElement = dashboardLayout.elements.find((e) => e.role === 'chart');
  expect(chartElement).toBeTruthy();
  expect(chartElement.fallback.is_fallback).toBe(true);
  expect(chartElement.fallback.image_path).toBeTruthy();

  const imageStat = await stat(chartElement.fallback.image_path);
  expect(imageStat.size).toBeGreaterThan(0);

  await rm(tmpDir, { recursive: true, force: true });
});
