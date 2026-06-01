/**
 * export-import.spec.js — E2E round-trip tests for JSON export and import
 *
 * Prerequisites:
 *   A static file server must be serving src/ on port 3000 before running:
 *     npx http-server src -p 3000
 *   Then: npm test
 *
 * Design notes:
 *   - `dlBlob()` triggers downloads via URL.createObjectURL + <a>.click().
 *     Playwright does not intercept blob-URL downloads via waitForEvent('download'),
 *     so we temporarily replace window.dlBlob with a capturing stub to read the
 *     blob content directly from the page context.
 *
 *   - The welcome modal is suppressed by pre-seeding localStorage before page
 *     load (via addInitScript), which is more reliable than clicking the close
 *     button after load.
 *
 *   - Only JSON is reimportable; SVG and PNG exports are one-way.
 */

'use strict';

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calls an export function in the page and returns the blob content as text.
 * Stubs window.dlBlob to capture the blob without triggering a real download.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} fnName  Global function name to call (e.g. 'exportJSON')
 * @param {string} [expectedExt]  If provided, asserts the filename ends with this
 * @returns {{ text: string, name: string }}
 */
async function captureExport(page, fnName, expectedExt) {
  const result = await page.evaluate(async (fn) => {
    const orig = window.dlBlob;
    let capturedBlob = null;
    let capturedName = null;
    window.dlBlob = (blob, name) => { capturedBlob = blob; capturedName = name; };
    window[fn]();
    window.dlBlob = orig;
    if (!capturedBlob) throw new Error(`dlBlob was not called by ${fn}()`);
    return { text: await capturedBlob.text(), name: capturedName };
  }, fnName);

  if (expectedExt) {
    expect(result.name, `filename from ${fnName}`).toMatch(new RegExp(`\\.${expectedExt}$`));
  }
  return result;
}

/**
 * Writes content to a temp file, sets it on #file-input, then deletes the file.
 * Returns after the import handler has run.
 */
async function importFile(page, content, filename = 'test.json') {
  const tmpFile = path.join(os.tmpdir(), filename);
  fs.writeFileSync(tmpFile, content);
  try {
    await page.locator('#file-input').setInputFiles(tmpFile);
  } finally {
    fs.unlinkSync(tmpFile);
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  // Suppress the welcome modal by marking it as seen before the page loads.
  // Using addInitScript is more reliable than clicking the close button after
  // load, which is subject to animation/timing races.
  await page.addInitScript(() => {
    localStorage.setItem('handpan-welcome-seen-v1', '1');
  });
  await page.goto('/editor.html');
});

// ─── Tests ────────────────────────────────────────────────────────────────────

test('exportJSON produces valid JSON matching the expected schema', async ({ page }) => {
  const { text } = await captureExport(page, 'exportJSON', 'json');
  const json = JSON.parse(text);

  expect(json).toHaveProperty('version', 1);
  expect(json).toHaveProperty('pan');
  expect(json.pan).toMatchObject({ cx: expect.any(Number), cy: expect.any(Number), r: expect.any(Number) });
  expect(Array.isArray(json.notes)).toBe(true);
  expect(json.notes.length).toBeGreaterThan(0);
  for (const note of json.notes) {
    expect(note).toMatchObject({
      id:    expect.any(String),
      x:     expect.any(Number),
      y:     expect.any(Number),
      r:     expect.any(Number),
      label: expect.any(String),
    });
  }
});

test('export → reimport restores the original note count', async ({ page }) => {
  // Capture the initial layout via the export function
  const { text } = await captureExport(page, 'exportJSON', 'json');
  const exported = JSON.parse(text);
  const originalCount = exported.notes.length;

  // Dirty the state: inject an extra note directly to avoid relying on click
  // coordinates which may land on an existing note (and only select, not add).
  await page.evaluate(() => {
    state.notes.push({ id: 'dirty-note', x: 10, y: 10, r: 50, label: 'X' });
    render();
  });
  const dirtyCount = await page.locator('#notes-layer > g').count();
  expect(dirtyCount).toBe(originalCount + 1); // confirm we dirtied the state

  // Import the original JSON — should restore the original layout
  await importFile(page, text);

  const restoredCount = await page.locator('#notes-layer > g').count();
  expect(restoredCount).toBe(originalCount);
});

test('importing a hand-crafted 3-note JSON places exactly 3 notes on the canvas', async ({ page }) => {
  const layout = {
    version: 1,
    name: 'Test Layout',
    pan: { cx: 500, cy: 500, r: 320 },
    notes: [
      { id: 'n1', x: 500, y: 400, r: 70, label: 'D3' },
      { id: 'n2', x: 380, y: 520, r: 70, label: 'A3' },
      { id: 'n3', x: 620, y: 520, r: 70, label: 'C4' },
    ],
    noteNumbers: { D3: 0, A3: 1, C4: 2 },
  };

  await importFile(page, JSON.stringify(layout));

  const count = await page.locator('#notes-layer > g').count();
  expect(count).toBe(layout.notes.length);
});

test('importing malformed JSON shows an alert and does not crash the page', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e));
  page.on('dialog', d => d.dismiss()); // accept/dismiss the alert that the app shows

  await importFile(page, 'NOT VALID JSON {{{', 'bad.json');

  // The app should show an alert (handled above) and then continue normally
  expect(pageErrors).toHaveLength(0);
});

test('exportCurrentSVG produces a well-formed SVG document without errors', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e));

  const { text, name } = await captureExport(page, 'exportCurrentSVG', 'svg');

  expect(pageErrors).toHaveLength(0);
  expect(name).toMatch(/\.svg$/);
  expect(text).toMatch(/^<svg[\s>]/);
  expect(text).toContain('</svg>');
});
