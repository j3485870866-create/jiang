# Mobile Portfolio Drag Hit Area Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limit mobile portfolio dragging to a center circle expanded by 12%, while allowing a started horizontal drag to continue anywhere and preserving vertical page scrolling.

**Architecture:** Add a small, testable gesture gate module that owns hit testing and direction locking. On mobile, an invisible circular handle sits above the WebGL canvas; it forwards only accepted horizontal pointer sequences to the existing canvas controller and keeps pointer capture until release. Desktop continues using the existing canvas listeners unchanged.

**Tech Stack:** JavaScript ES modules, Pointer Events, CSS media queries, Node test runner, Vite.

## Global Constraints

- Mobile behavior applies only at viewport widths up to `760px`.
- The start hit radius is `112%` of the visible center-disc radius.
- A vertical gesture must remain native page scrolling.
- After a horizontal drag starts, it continues outside the hit circle until `pointerup` or `pointercancel`.
- A new drag must start inside the hit circle.
- No visible controls, outlines, layout changes, content changes, or desktop interaction changes.

---

## File Structure

- `src/mobilePortfolioDragGate.js`: pure hit-test/direction helpers plus the mobile pointer forwarding initializer.
- `src/main.jsx`: installs the gate after the page DOM is available.
- `tests/mobile-portfolio-drag-gate.test.mjs`: behavior tests for hit testing and gesture direction state.
- `tests/html-integrity.test.mjs`: integration assertions for the mobile handle and scroll-preserving CSS contract.
- `index.html`: adds the invisible handle element and mobile-only CSS used by the Vite/Cloudflare version.
- `../Jiang-Hao-个人网站.html`: mirrors the same handle, CSS, and inline initializer for the directly opened local standalone page.

### Task 1: Gesture gate behavior

**Files:**
- Create: `src/mobilePortfolioDragGate.js`
- Create: `tests/mobile-portfolio-drag-gate.test.mjs`

**Interfaces:**
- Produces: `isInsideCenteredCircle(point, rect, diameterRatio) -> boolean`
- Produces: `createMobileDragDecision({ threshold }) -> { begin(point), move(point), end() }`
- `move(point)` returns one of `"pending"`, `"horizontal"`, or `"vertical"`.

- [ ] **Step 1: Write the failing behavior tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createMobileDragDecision,
  isInsideCenteredCircle
} from '../src/mobilePortfolioDragGate.js';

test('center hit circle includes a 12 percent expansion and rejects outside starts', () => {
  const rect = { left: 0, top: 0, width: 400, height: 600 };
  assert.equal(isInsideCenteredCircle({ x: 200, y: 300 }, rect, 0.56), true);
  assert.equal(isInsideCenteredCircle({ x: 311, y: 300 }, rect, 0.56), true);
  assert.equal(isInsideCenteredCircle({ x: 313, y: 300 }, rect, 0.56), false);
});

test('horizontal movement activates dragging and remains active outside the start area', () => {
  const decision = createMobileDragDecision({ threshold: 12 });
  decision.begin({ x: 200, y: 300 });
  assert.equal(decision.move({ x: 205, y: 303 }), 'pending');
  assert.equal(decision.move({ x: 218, y: 304 }), 'horizontal');
  assert.equal(decision.move({ x: 390, y: 20 }), 'horizontal');
  decision.end();
  assert.equal(decision.move({ x: 390, y: 20 }), 'pending');
});

test('vertical movement cancels the drag candidate', () => {
  const decision = createMobileDragDecision({ threshold: 12 });
  decision.begin({ x: 200, y: 300 });
  assert.equal(decision.move({ x: 204, y: 316 }), 'vertical');
  assert.equal(decision.move({ x: 230, y: 320 }), 'vertical');
});
```

- [ ] **Step 2: Run tests and verify the missing module failure**

Run: `npm test -- tests/mobile-portfolio-drag-gate.test.mjs`

Expected: FAIL because `src/mobilePortfolioDragGate.js` does not exist.

- [ ] **Step 3: Implement the minimal pure helpers**

```js
export function isInsideCenteredCircle(point, rect, diameterRatio = 0.56) {
  const diameter = Math.min(rect.width, rect.height) * diameterRatio;
  const radius = diameter / 2;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.hypot(point.x - centerX, point.y - centerY) <= radius;
}

export function createMobileDragDecision({ threshold = 12 } = {}) {
  let start = null;
  let state = 'pending';
  return {
    begin(point) {
      start = point;
      state = 'pending';
    },
    move(point) {
      if (!start || state === 'vertical') return state;
      if (state === 'horizontal') return state;
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      if (Math.hypot(dx, dy) < threshold) return 'pending';
      state = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      return state;
    },
    end() {
      start = null;
      state = 'pending';
    }
  };
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test tests/mobile-portfolio-drag-gate.test.mjs`

Expected: 3 tests pass.

### Task 2: Mobile pointer forwarding

**Files:**
- Modify: `src/mobilePortfolioDragGate.js`
- Modify: `src/main.jsx`
- Modify: `index.html`
- Modify: `tests/html-integrity.test.mjs`

**Interfaces:**
- Consumes: `createMobileDragDecision`
- Produces: `installMobilePortfolioDragGate({ gallery, canvas, handle, mediaQuery }) -> cleanup()`
- The initializer dispatches synthetic pointer events to the existing canvas controller only after a horizontal direction lock.

- [ ] **Step 1: Add failing integration assertions**

```js
test('mobile portfolio uses a center-only drag handle and keeps vertical scrolling', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /data-mobile-portfolio-drag-handle/);
  assert.match(
    html,
    /id="mobile-portfolio-drag-hit-area"[\s\S]*@media \(max-width: 760px\)[\s\S]*touch-action:\s*pan-y[\s\S]*border-radius:\s*50%/
  );
});
```

- [ ] **Step 2: Run the integration test and verify it fails**

Run: `node --test tests/html-integrity.test.mjs`

Expected: FAIL because the handle and its mobile CSS do not exist.

- [ ] **Step 3: Add the handle and mobile CSS**

Add immediately after the portfolio canvas:

```html
<div data-mobile-portfolio-drag-handle aria-hidden="true"></div>
```

Add a named style block:

```css
<style id="mobile-portfolio-drag-hit-area">
  [data-mobile-portfolio-drag-handle] {
    display: none;
  }

  @media (max-width: 760px) {
    #infinite-grid-menu-canvas {
      pointer-events: none;
      touch-action: pan-y !important;
    }

    [data-mobile-portfolio-drag-handle] {
      position: absolute;
      top: 50%;
      left: 50%;
      z-index: 3;
      display: block;
      width: min(56vw, 56vh);
      aspect-ratio: 1;
      border-radius: 50%;
      background: transparent;
      touch-action: pan-y;
      transform: translate(-50%, -50%);
    }
  }
</style>
```

- [ ] **Step 4: Implement pointer forwarding and installation**

In `src/mobilePortfolioDragGate.js`, add `installMobilePortfolioDragGate`. It must:

- listen on the circular handle;
- record the trusted `pointerdown` only as a candidate;
- classify movement after `12px`;
- on horizontal lock, capture the pointer on the handle, dispatch a synthetic `pointerdown` followed by pointer moves to the canvas, and prevent only horizontal movement;
- on vertical lock, stop forwarding and leave scrolling untouched;
- dispatch `pointerup` or `pointercancel` to the canvas only when horizontal dragging was active;
- clear all state on release;
- enable this behavior only while `matchMedia('(max-width: 760px)')` matches.

In `src/main.jsx`, query the gallery, canvas, and handle, then call:

```js
installMobilePortfolioDragGate({
  gallery: document.querySelector('[data-infinite-menu]'),
  canvas: document.querySelector('[data-infinite-menu-canvas]'),
  handle: document.querySelector('[data-mobile-portfolio-drag-handle]'),
  mediaQuery: window.matchMedia('(max-width: 760px)')
});
```

- [ ] **Step 5: Run all unit and integrity tests**

Run: `npm test`

Expected: all tests pass.

### Task 3: Standalone page parity

**Files:**
- Modify: `../Jiang-Hao-个人网站.html`
- Test: `tests/html-integrity.test.mjs`

**Interfaces:**
- Consumes: the same pointer state rules and CSS values from Tasks 1 and 2.
- Produces: identical mobile behavior when the standalone file is opened through `file://`.

- [ ] **Step 1: Extend the integration test to inspect the standalone page**

Read `../../Jiang-Hao-个人网站.html` and assert that it contains:

- `data-mobile-portfolio-drag-handle`;
- `id="mobile-portfolio-drag-hit-area"`;
- a `12px` direction threshold;
- a `pointercancel` cleanup path.

- [ ] **Step 2: Run the test and verify the standalone assertions fail**

Run: `node --test tests/html-integrity.test.mjs`

Expected: FAIL because the standalone page has not yet received the mobile gate.

- [ ] **Step 3: Mirror the handle, CSS, and inline initializer**

Insert the same handle beside the canvas, the same named CSS block before `</body>`, and an inline ES5-compatible initializer that implements the exact Task 2 pointer sequence without importing Vite modules.

- [ ] **Step 4: Run all tests**

Run: `npm test`

Expected: all tests pass.

### Task 4: Browser verification and production build

**Files:**
- Verify: `index.html`
- Verify: `../Jiang-Hao-个人网站.html`

**Interfaces:**
- No new interfaces.

- [ ] **Step 1: Build the Cloudflare artifact**

Run: `npm run build`

Expected: Vite exits with code 0 and produces `dist/index.html` plus the runtime asset.

- [ ] **Step 2: Verify mobile behavior in a 390 × 844 viewport**

Using the local preview:

- start a vertical swipe outside the center circle and confirm the page scrolls;
- start a vertical swipe inside the center circle and confirm the page scrolls;
- start a horizontal drag inside the center circle and continue outside it;
- release outside, then swipe outside again and confirm the gallery does not move;
- verify desktop canvas dragging still works.

- [ ] **Step 3: Inspect the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors and only the planned source, test, HTML, and plan files are changed.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/mobilePortfolioDragGate.js src/main.jsx tests/mobile-portfolio-drag-gate.test.mjs tests/html-integrity.test.mjs index.html
git commit -m "Fix mobile portfolio drag hit area"
```

The standalone file lives outside this repository, so report it separately rather than attempting to include it in this commit.
