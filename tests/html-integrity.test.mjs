import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('profile card CSS is not rendered as page text', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.doesNotMatch(
    html,
    /<\/script>\s*\{\s*--pointer-x:/,
    'profile card CSS starts outside a <style> element'
  );
});
