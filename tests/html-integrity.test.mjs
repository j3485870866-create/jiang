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

test('mobile portraits cover their frames and the scrollbar track blends into the page', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /id="mobile-edge-fixes"[\s\S]*portrait-placeholder\.has-photo[\s\S]*background:\s*#000\s*!important[\s\S]*box-shadow:\s*none\s*!important[\s\S]*object-fit:\s*cover\s*!important/,
    'mobile photo frames must not expose the green template behind real photos'
  );
  assert.match(
    html,
    /html::[-\w]*scrollbar-track[\s\S]*background:\s*#000/,
    'the mobile scrollbar track must blend into the black page'
  );
});

test('mobile portfolio labels sit on opposite sides of the gallery center', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /id="mobile-portfolio-side-labels"[\s\S]*@media \(max-width: 760px\)[\s\S]*infinite-menu-active-title[\s\S]*top:\s*50%[\s\S]*left:\s*clamp\([\s\S]*infinite-menu-active-description[\s\S]*right:\s*clamp\(/,
    'mobile active title and description must be anchored to opposite sides'
  );
});
