# Mobile Portfolio Two-Dimensional Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow mobile portfolio gestures that start in the center circle to drag the WebGL gallery upward, downward, left, right, or diagonally.

**Architecture:** Simplify the existing drag decision from three states (`pending`, `horizontal`, `vertical`) to two states (`pending`, `dragging`). Once total pointer movement exceeds `6px`, forward every pointer move with its original X/Y coordinates to the existing canvas until release. Mirror the state change in the standalone HTML page.

**Tech Stack:** React/Vite, browser Pointer Events, JavaScript state machine, Node.js built-in test runner.

## Global Constraints

- The center hit area remains exactly `64%` of the gallery's shorter side.
- The activation threshold remains exactly `6px`.
- Any movement direction over the threshold enters `dragging`.
- Center gestures continue to use `touch-action: none` and never scroll the page.
- Gestures beginning outside the center continue to scroll the page.
- Desktop behavior, portfolio assets, labels, copy, and WebGL rendering remain unchanged.
- `index.html` and `Jiang-Hao-个人网站.html` must behave consistently.

---

### Task 1: Prove vertical and diagonal gestures currently fail

**Files:**
- Modify: `tests/mobile-portfolio-drag-gate.test.mjs`

**Interfaces:**
- Consumes: `createMobileDragDecision()` and `installMobilePortfolioDragGate(options)`.
- Produces: Regression coverage requiring the `dragging` state and real pointer forwarding for vertical movement.

- [ ] **Step 1: Replace direction-specific decision tests**

Add a table-driven behavior test with hand-derived points:

```js
test('movement over the threshold starts dragging in every direction', () => {
  const movements = [
    { name: 'right', point: { x: 207, y: 300 } },
    { name: 'down', point: { x: 200, y: 307 } },
    { name: 'diagonal', point: { x: 205, y: 305 } }
  ];

  for (const { name, point } of movements) {
    const decision = createMobileDragDecision();
    decision.begin({ x: 200, y: 300 });
    assert.equal(decision.move(point), 'dragging', name);
    assert.equal(decision.move({ x: 20, y: 20 }), 'dragging', `${name} remains locked`);
  }
});
```

Keep a separate below-threshold test:

```js
test('movement below six pixels remains pending', () => {
  const decision = createMobileDragDecision();
  decision.begin({ x: 200, y: 300 });
  assert.equal(decision.move({ x: 204, y: 302 }), 'pending');
});
```

- [ ] **Step 2: Replace the vertical cancellation integration test**

Use the existing real fake pointer target and assert actual forwarded events:

```js
test('vertical dragging is forwarded to the gallery until release', () => {
  const gallery = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 600 })
  };
  const canvas = createPointerTarget();
  const handle = createPointerTarget();

  installMobilePortfolioDragGate({
    gallery,
    canvas,
    handle,
    mediaQuery: { matches: true },
    createPointerEvent: (type, init) => ({ type, ...init })
  });

  handle.emit('pointerdown', { clientX: 200, clientY: 300 });
  const activation = handle.emit('pointermove', { clientX: 200, clientY: 307 });
  handle.emit('pointermove', { clientX: 202, clientY: 390 });
  handle.emit('pointerup', { clientX: 202, clientY: 390, buttons: 0 });

  assert.deepEqual(canvas.events.map(({ type }) => type), [
    'pointerdown',
    'pointermove',
    'pointermove',
    'pointerup'
  ]);
  assert.equal(activation.defaultPrevented, true);
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```powershell
node --test tests/mobile-portfolio-drag-gate.test.mjs
```

Expected: FAIL because vertical movement currently returns `vertical` and is not forwarded.

- [ ] **Step 4: Commit the failing regression tests**

```powershell
git add tests/mobile-portfolio-drag-gate.test.mjs
git commit -m "Test mobile portfolio two-dimensional dragging"
```

---

### Task 2: Simplify the gesture state machine and synchronize the standalone page

**Files:**
- Modify: `src/mobilePortfolioDragGate.js`
- Modify: `tests/html-integrity.test.mjs`
- Modify: `D:\codex\个人站\Jiang-Hao-个人网站.html`

**Interfaces:**
- Consumes: The existing center hit test, threshold, pointer capture, and canvas event forwarding.
- Produces: A `createMobileDragDecision()` state machine that returns only `pending` or `dragging`.

- [ ] **Step 1: Implement the minimal two-state decision**

Replace the direction branch in `createMobileDragDecision`:

```js
move(point) {
  if (!start || state === 'dragging') return state;

  const deltaX = point.x - start.x;
  const deltaY = point.y - start.y;

  if (Math.hypot(deltaX, deltaY) < threshold) return 'pending';

  state = 'dragging';
  return state;
}
```

- [ ] **Step 2: Forward every activated direction**

In `installMobilePortfolioDragGate`, replace the direction-specific returns with:

```js
const state = decision.move({ x: event.clientX, y: event.clientY });
if (state !== 'dragging') return;
```

Keep `preventDefault`, pointer capture, pointerdown forwarding, pointermove forwarding, and reset behavior unchanged.

- [ ] **Step 3: Update standalone integrity coverage**

Add a standalone assertion that documents the deployed state name:

```js
assert.match(standalone, /state\s*=\s*['"]dragging['"]/);
```

Run the HTML integrity test now. Expected: FAIL because the standalone inline gate still uses horizontal/vertical direction states.

- [ ] **Step 4: Mirror the two-state logic in the standalone page**

In `D:\codex\个人站\Jiang-Hao-个人网站.html`:

- Replace the horizontal/vertical direction decision with `state = 'dragging'`.
- Forward pointer movement whenever state is `dragging`.
- Preserve the `64%` hit area, `6px` threshold, `touch-action: none`, pointer capture, and release reset.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run:

```powershell
node --test tests/mobile-portfolio-drag-gate.test.mjs tests/html-integrity.test.mjs
```

Expected: all focused tests PASS.

- [ ] **Step 6: Run the complete automated suite**

Run:

```powershell
pnpm test
pnpm build
```

Expected: all tests PASS and the Vite production build succeeds.

- [ ] **Step 7: Commit the implementation**

```powershell
git add src/mobilePortfolioDragGate.js tests/html-integrity.test.mjs
git commit -m "Enable mobile portfolio two-dimensional dragging"
```

The standalone HTML page remains a synchronized local edit outside this repository.

---

### Task 3: Verify real mobile gestures and publish

**Files:**
- Verify: `index.html`
- Verify: `src/mobilePortfolioDragGate.js`
- Verify: `D:\codex\个人站\Jiang-Hao-个人网站.html`

**Interfaces:**
- Consumes: The completed two-dimensional drag behavior.
- Produces: Browser evidence, final test/build evidence, and an updated GitHub `main`.

- [ ] **Step 1: Start a local production preview**

Run:

```powershell
pnpm build
pnpm preview --host 127.0.0.1
```

- [ ] **Step 2: Verify a `390x844` mobile viewport**

Confirm all of the following:

- Horizontal center drag moves the gallery without changing `scrollY`.
- Vertical center drag moves the gallery without changing `scrollY`.
- Diagonal center drag moves the gallery without changing `scrollY`.
- After release, an outside start does not move the gallery.
- A scroll beginning outside the center changes `scrollY`.

- [ ] **Step 3: Verify desktop behavior**

At `1280x800`, confirm the mobile handle is hidden and the canvas receives pointer events normally.

- [ ] **Step 4: Run final verification**

```powershell
pnpm test
pnpm build
git diff --check
git status -sb
```

Expected: all tests and build pass, no whitespace errors, and only intended commits are ahead of `origin/main`.

- [ ] **Step 5: Merge and push after the user selects the integration option**

Use the finishing-branch workflow, then push the verified `main` branch to GitHub so Cloudflare can redeploy.
