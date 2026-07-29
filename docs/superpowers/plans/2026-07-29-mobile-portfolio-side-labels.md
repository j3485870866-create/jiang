# Mobile Portfolio Side Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Place the active portfolio title to the left of the central work disc and its description to the right on mobile screens.

**Architecture:** Add one late-loading mobile-only CSS block to the existing single-page Vite HTML so it overrides the bundled infinite-menu defaults without changing JavaScript, canvas rendering, portfolio data, or desktop layout. Extend the existing HTML integrity test with a regression assertion for the responsive positioning contract.

**Tech Stack:** HTML, CSS media queries, Node.js built-in test runner, Vite, in-app browser responsive validation.

## Global Constraints

- Apply the layout only at `max-width: 760px`.
- Keep “我的作品集” at the top of the section.
- Place the active main title on the left and the active description on the right.
- Align both labels vertically with the gallery center.
- Preserve desktop layout, canvas rendering, work images, and drag interaction.

---

### Task 1: Mobile portfolio side-label layout

**Files:**
- Modify: `tests/html-integrity.test.mjs`
- Modify: `index.html`

**Interfaces:**
- Consumes: `.infinite-menu-active-title`, `.infinite-menu-active-description`, and the existing `max-width: 760px` breakpoint.
- Produces: A `<style id="mobile-portfolio-side-labels">` override that is inactive on desktop.

- [x] **Step 1: Write the failing regression test**

Add this test to `tests/html-integrity.test.mjs`:

```js
test('mobile portfolio labels sit on opposite sides of the gallery center', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(
    html,
    /id="mobile-portfolio-side-labels"[\s\S]*@media \(max-width: 760px\)[\s\S]*infinite-menu-active-title[\s\S]*top:\s*50%[\s\S]*left:\s*clamp\([\s\S]*infinite-menu-active-description[\s\S]*right:\s*clamp\(/,
    'mobile active title and description must be anchored to opposite sides'
  );
});
```

- [x] **Step 2: Run the test and verify the expected failure**

Run:

```powershell
$env:PATH='C:\Users\hao\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:PATH
& 'C:\Users\hao\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' test
```

Expected: the new test fails because `mobile-portfolio-side-labels` does not exist.

- [x] **Step 3: Add the minimal mobile-only CSS override**

Insert this late in `index.html`, after the existing `mobile-edge-fixes` style:

```html
<style id="mobile-portfolio-side-labels">
  @media (max-width: 760px) {
    #journey .infinite-menu-active-title,
    #journey .infinite-menu-active-description {
      top: 50%;
      bottom: auto;
      z-index: 3;
      transform: translateY(-50%);
    }

    #journey .infinite-menu-active-title {
      left: clamp(0.75rem, 4vw, 1.25rem);
      width: clamp(4.75rem, 24vw, 6.5rem);
      font-size: clamp(1.35rem, 7vw, 2rem);
      line-height: 1;
      text-align: left;
    }

    #journey .infinite-menu-active-description {
      right: clamp(0.75rem, 4vw, 1.25rem);
      width: clamp(5.5rem, 28vw, 7.5rem);
      font-size: clamp(0.68rem, 3.4vw, 0.88rem);
      line-height: 1.45;
      text-align: right;
    }

    #journey .infinite-menu[data-moving="true"] .infinite-menu-active-title,
    #journey .infinite-menu[data-moving="true"] .infinite-menu-active-description {
      transform: translateY(calc(-50% + 8px));
    }
  }
</style>
```

- [x] **Step 4: Run automated verification**

Run:

```powershell
& 'C:\Users\hao\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' test
& 'C:\Users\hao\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' build
```

Expected: all tests pass and Vite exits with code 0.

- [x] **Step 5: Verify responsive behavior**

At 390 × 844:

- Confirm the active title’s computed `top` is the gallery midpoint and its left edge remains inside the viewport.
- Confirm the active description’s computed `top` is the gallery midpoint and its right edge remains inside the viewport.
- Confirm neither label overlaps the center point of the canvas.
- Confirm the section title remains at the top and the canvas is still visible.

At a desktop viewport:

- Confirm the new style block is inactive and the existing title/description positions are unchanged.

- [ ] **Step 6: Commit and publish**

```powershell
git add -- index.html tests/html-integrity.test.mjs docs/superpowers/plans/2026-07-29-mobile-portfolio-side-labels.md
git commit -m "Fix mobile portfolio label layout"
git push origin main
```
