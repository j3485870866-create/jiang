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

test('mobile portfolio uses a center-only drag handle and keeps vertical scrolling', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /data-mobile-portfolio-drag-handle/,
    'the mobile gallery must expose a dedicated center drag handle'
  );
  assert.match(
    html,
    /id="mobile-portfolio-drag-hit-area"[\s\S]*@media \(max-width: 760px\)[\s\S]*touch-action:\s*pan-y[\s\S]*border-radius:\s*50%/,
    'the mobile handle must preserve vertical scrolling and remain circular'
  );
});

test('standalone page includes the same mobile portfolio drag gate', async () => {
  const standalone = await readFile(
    new URL('../../../../Jiang-Hao-个人网站.html', import.meta.url),
    'utf8'
  );

  assert.match(standalone, /data-mobile-portfolio-drag-handle/);
  assert.match(standalone, /id="mobile-portfolio-drag-hit-area"/);
  assert.match(standalone, /threshold\s*=\s*12/);
  assert.match(standalone, /pointercancel/);
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
    /id="mobile-contact-ray-edge-fix"[\s\S]*@media \(max-width: 760px\)[\s\S]*#contact \.contact-side-rays\s*{[\s\S]*-webkit-mask-image:\s*linear-gradient\(to bottom,\s*#000 0%,\s*#000 52%,\s*transparent 100%\)[\s\S]*mask-image:\s*linear-gradient\(to bottom,\s*#000 0%,\s*#000 52%,\s*transparent 100%\)/,
    'the vertically flipped mobile contact background must fade at its visual top edge'
  );
});

test('mobile hero rays fade out before the second section', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /id="mobile-section-ray-transitions"[\s\S]*@media \(max-width: 760px\)[\s\S]*#home \[data-side-rays\][\s\S]*mask-image:\s*linear-gradient\(to bottom,\s*#000 0%,\s*#000 52%,\s*transparent 100%\)/,
    'the mobile hero background must blend into black before the second section'
  );
});
