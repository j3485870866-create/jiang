# Mobile Portfolio Drag Smoothness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the mobile portfolio gallery start dragging faster, enlarge its center hit area, and prevent gallery gestures from moving the page.

**Architecture:** Keep the existing transparent center handle and pointer-event forwarding architecture. Change the shared gesture defaults to a `0.64` diameter ratio and `6px` threshold, then make the center handle exclusively own touch gestures with `touch-action: none`. Mirror the same values and styles in the standalone HTML page.

**Tech Stack:** React/Vite, browser Pointer Events, CSS touch-action, Node.js built-in test runner.

## Global Constraints

- Only viewports at or below `760px` change; desktop behavior remains unchanged.
- The center hit circle uses exactly `0.64` of the gallery's shorter side.
- The drag decision threshold uses exactly `6px`.
- Touches that start inside the center handle cannot scroll the page.
- Page scrolling remains available when the gesture starts outside the center handle.
- Existing portfolio images, labels, copy, and WebGL rendering remain unchanged.
- `index.html` and `Jiang-Hao-个人网站.html` must use the same mobile behavior.

---

### Task 1: Lock the new hit area and gesture defaults with failing tests

**Files:**
- Modify: `tests/mobile-portfolio-drag-gate.test.mjs`
- Modify: `tests/html-integrity.test.mjs`

**Interfaces:**
- Consumes: `isInsideCenteredCircle(point, rect, diameterRatio?)` and `createMobileDragDecision(options?)` from `src/mobilePortfolioDragGate.js`.
- Produces: Regression tests requiring default ratio `0.64`, default threshold `6`, a `64%` mobile handle, and `touch-action: none`.

- [ ] **Step 1: Update the hit-area and threshold tests**

Replace the existing ratio-specific test with:

```js
test('center hit circle uses the expanded 64 percent diameter', () => {
  const rect = { left: 0, top: 0, width: 400, height: 600 };

  assert.equal(isInsideCenteredCircle({ x: 200, y: 300 }, rect), true);
  assert.equal(isInsideCenteredCircle({ x: 327, y: 300 }, rect), true);
  assert.equal(isInsideCenteredCircle({ x: 329, y: 300 }, rect), false);
});
```

Update the drag-decision test to use the default threshold:

```js
test('default six pixel threshold activates horizontal dragging quickly', () => {
  const decision = createMobileDragDecision();

  decision.begin({ x: 200, y: 300 });
  assert.equal(decision.move({ x: 204, y: 302 }), 'pending');
  assert.equal(decision.move({ x: 207, y: 302 }), 'horizontal');
  assert.equal(decision.move({ x: 390, y: 20 }), 'horizontal');
});
```

- [ ] **Step 2: Update the HTML integrity assertions**

Require the Vite page and standalone page to contain the new dimensions and scroll lock:

```js
assert.match(
  html,
  /id="mobile-portfolio-drag-hit-area"[\s\S]*width:\s*min\(64vw,\s*64vh\)[\s\S]*touch-action:\s*none/
);

assert.match(standalone, /width:\s*min\(64vw,\s*64vh\)/);
assert.match(standalone, /threshold\s*=\s*6/);
assert.match(standalone, /diameterRatio\s*=\s*0\.64/);
```

- [ ] **Step 3: Run the focused tests and verify RED**

Run:

```powershell
pnpm exec node --test tests/mobile-portfolio-drag-gate.test.mjs tests/html-integrity.test.mjs
```

Expected: FAIL because production still uses `0.56`, `12px`, `56vw/56vh`, and `touch-action: pan-y`.

- [ ] **Step 4: Commit the failing regression tests**

```powershell
git add tests/mobile-portfolio-drag-gate.test.mjs tests/html-integrity.test.mjs
git commit -m "Test smoother mobile portfolio dragging"
```

---

### Task 2: Apply the shared gesture defaults and center scroll lock

**Files:**
- Modify: `src/mobilePortfolioDragGate.js`
- Modify: `index.html`
- Modify: `D:\codex\个人站\Jiang-Hao-个人网站.html`

**Interfaces:**
- Consumes: The existing `installMobilePortfolioDragGate` API and transparent handle markup.
- Produces: Default `diameterRatio = 0.64`, default `threshold = 6`, and a `64%` center-only touch surface that blocks page panning.

- [ ] **Step 1: Change the shared JavaScript defaults**

In `src/mobilePortfolioDragGate.js`, change only these defaults:

```js
export function isInsideCenteredCircle(point, rect, diameterRatio = 0.64) {
```

```js
export function createMobileDragDecision({ threshold = 6 } = {}) {
```

```js
export function installMobilePortfolioDragGate({
  // existing arguments
  diameterRatio = 0.64,
  threshold = 6
} = {}) {
```

- [ ] **Step 2: Change the Vite page mobile handle**

In the `mobile-portfolio-drag-hit-area` style block in `index.html`, set:

```css
[data-mobile-portfolio-drag-handle] {
  width: min(64vw, 64vh);
  touch-action: none;
}
```

Leave the canvas pointer-event rule and all desktop styles unchanged.

- [ ] **Step 3: Mirror the behavior in the standalone page**

In `D:\codex\个人站\Jiang-Hao-个人网站.html`:

- Set the mobile handle width to `min(64vw, 64vh)`.
- Set the handle `touch-action` to `none`.
- Set the inline gate's `threshold` to `6`.
- Set the inline gate's `diameterRatio` to `0.64`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```powershell
pnpm exec node --test tests/mobile-portfolio-drag-gate.test.mjs tests/html-integrity.test.mjs
```

Expected: all focused tests PASS.

- [ ] **Step 5: Run the complete automated suite**

Run:

```powershell
pnpm test
```

Expected: all tests PASS with no failures.

- [ ] **Step 6: Commit the implementation**

```powershell
git add src/mobilePortfolioDragGate.js index.html
git commit -m "Smooth mobile portfolio dragging"
```

The standalone HTML file lives outside this Git repository and remains a synchronized local edit.

---

### Task 3: Verify responsive behavior and publish

**Files:**
- Verify: `index.html`
- Verify: `src/mobilePortfolioDragGate.js`
- Verify: `D:\codex\个人站\Jiang-Hao-个人网站.html`

**Interfaces:**
- Consumes: The completed mobile gesture implementation.
- Produces: Browser evidence, a successful production build, and synchronized GitHub `main`.

- [ ] **Step 1: Start the local Vite preview**

Run:

```powershell
pnpm build
pnpm preview --host 127.0.0.1
```

Expected: Vite serves the production build on a local port.

- [ ] **Step 2: Verify a `390x844` mobile viewport**

Check:

- The handle is `64%` of the mobile viewport's limiting dimension.
- A horizontal drag beginning near the expanded circle edge moves the gallery.
- The page `scrollY` value does not change during a center drag.
- A vertical scroll beginning outside the circle changes `scrollY`.
- Releasing outside the circle ends the drag; another outside start does not move the gallery.

- [ ] **Step 3: Verify a desktop viewport**

At `1280x800`, confirm:

- The transparent mobile handle is `display: none`.
- The WebGL canvas receives pointer events normally.
- Existing desktop gallery dragging still works.

- [ ] **Step 4: Run final verification**

Run:

```powershell
pnpm test
pnpm build
git diff --check
git status -sb
```

Expected: tests and build PASS, `git diff --check` prints nothing, and only intended commits are ahead of `origin/main`.

- [ ] **Step 5: Push the verified main branch**

```powershell
git push origin main
```

Expected: remote `main` advances to the local verified commit.
