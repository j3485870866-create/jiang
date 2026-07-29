# Mobile Interaction Motion Budget Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add responsive touch feedback and viewport-aware mobile animation pausing without disrupting existing drag, flip, scroll, or dialog interactions.

**Architecture:** A focused `mobileMotionBudget` module owns media-query gating, section visibility state, and delegated press feedback. `main.jsx` wires existing elements into the module, while mobile-only CSS renders feedback and pauses inactive animations. The existing contact fuzzy canvas receives a mobile DPR and FPS budget.

**Tech Stack:** React 19 entry point, browser DOM APIs, IntersectionObserver, CSS media queries, Node test runner, Vite.

## Global Constraints

- Do not add a continuous `requestAnimationFrame` loop.
- Do not add new WebGL, particle, or real-time blur effects.
- Preserve About photo flipping and portfolio two-dimensional dragging.
- Disable the enhancement for `prefers-reduced-motion: reduce`.
- Cap the contact fuzzy canvas at 1.5 DPR and 30 FPS on coarse mobile pointers.

---

### Task 1: Mobile motion controller

**Files:**
- Create: `src/mobileMotionBudget.js`
- Create: `tests/mobile-motion-budget.test.mjs`

**Interfaces:**
- Produces: `installMobileMotionBudget(options): () => void`
- Consumes: DOM-like `root`, `documentTarget`, `sections`, `mobileQuery`, `reducedMotionQuery`, and `createObserver`

- [ ] **Step 1: Write the failing controller tests**

Test that mobile mode marks visible sections, adds/removes a pressed class only for `[data-mobile-interactive]`, pauses on document visibility changes, and removes all state during cleanup.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/mobile-motion-budget.test.mjs`

Expected: FAIL because `src/mobileMotionBudget.js` does not exist.

- [ ] **Step 3: Implement the minimal controller**

Implement media-query gating, a single `IntersectionObserver`, delegated pointer handlers, document visibility handling, media-query change handling, and an idempotent cleanup function.

- [ ] **Step 4: Run the focused and full suites**

Run: `node --test tests/mobile-motion-budget.test.mjs`

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/mobileMotionBudget.js tests/mobile-motion-budget.test.mjs
git commit -m "Add mobile motion budget controller"
```

### Task 2: Wire touch feedback and CSS animation pausing

**Files:**
- Modify: `src/main.jsx`
- Modify: `index.html`
- Modify: `tests/mobile-motion-budget.test.mjs`

**Interfaces:**
- Consumes: `installMobileMotionBudget`
- Produces: `data-mobile-interactive`, `data-mobile-motion-tier`, `data-mobile-motion-active`, and `is-mobile-pressed` behavior

- [ ] **Step 1: Add a failing integration expectation**

Extend the test fixture so a declared interactive element receives feedback while a drag-only element does not.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/mobile-motion-budget.test.mjs`

Expected: FAIL because the integration selector set and mobile styling are not wired.

- [ ] **Step 3: Wire the controller and add mobile-only CSS**

Mark safe card/button selectors as interactive in `main.jsx`. Add mobile CSS that pauses animations in inactive sections and displays a short outline glow for `.is-mobile-pressed`. Do not select the About photo stack or portfolio drag handle.

- [ ] **Step 4: Run all tests**

Run: `pnpm test`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/main.jsx index.html tests/mobile-motion-budget.test.mjs
git commit -m "Enable balanced mobile touch effects"
```

### Task 3: Apply the mobile canvas budget and verify production

**Files:**
- Modify: `index.html`
- Modify: `tests/html-integrity.test.mjs`

**Interfaces:**
- Produces: coarse-pointer Canvas budget of 30 FPS and DPR 1.5

- [ ] **Step 1: Add a failing Canvas budget regression test**

Add a test that reads the built page fixture and verifies the mobile coarse-pointer branch selects `fps = 30` and `maximumDpr = 1.5`, while desktop retains `60` and `2`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/html-integrity.test.mjs`

Expected: FAIL because the current fuzzy canvas always uses 60 FPS and DPR 2.

- [ ] **Step 3: Implement the Canvas budget**

Create a coarse-pointer query in the contact fuzzy text controller. Derive `fps` and `maximumDpr` from it and use `maximumDpr` for both canvas render and resize paths.

- [ ] **Step 4: Verify test suite and production build**

Run: `pnpm test`

Run: `pnpm build`

Run: `git diff --check`

Expected: tests pass, Vite build exits 0, and no whitespace errors are reported.

- [ ] **Step 5: Commit**

```bash
git add index.html tests/html-integrity.test.mjs
git commit -m "Reduce mobile canvas rendering cost"
```
