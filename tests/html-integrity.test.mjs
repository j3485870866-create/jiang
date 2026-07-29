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

test('mobile contact ray canvas exactly fills its fractional container', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /id="mobile-contact-ray-edge-fix"[\s\S]*@media \(max-width: 760px\)[\s\S]*#contact \.contact-side-rays canvas[\s\S]*width:\s*100%\s*!important[\s\S]*height:\s*100%\s*!important/,
    'the mobile WebGL canvas must not overflow its fractional contact section'
  );
});

test('mobile contact rays fade in instead of creating a hard section boundary', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /id="mobile-contact-ray-edge-fix"[\s\S]*@media \(max-width: 760px\)[\s\S]*#contact \.contact-side-rays\s*{[\s\S]*-webkit-mask-image:\s*linear-gradient\(to bottom,\s*transparent 0%,\s*#000 22%\)[\s\S]*mask-image:\s*linear-gradient\(to bottom,\s*transparent 0%,\s*#000 22%\)/,
    'the mobile contact background must blend smoothly from the preceding black section'
  );
});

test('mobile hero rays fade out before the second section', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /id="mobile-section-ray-transitions"[\s\S]*@media \(max-width: 760px\)[\s\S]*#home \[data-side-rays\][\s\S]*mask-image:\s*linear-gradient\(to bottom,\s*#000 0%,\s*#000 78%,\s*transparent 100%\)/,
    'the mobile hero background must blend into black before the second section'
  );
});
