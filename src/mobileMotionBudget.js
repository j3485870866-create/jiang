const INTERACTIVE_SELECTOR = '[data-mobile-interactive]';

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function setPressedPosition(element, clientX, clientY) {
  const rect = element.getBoundingClientRect();
  const x = rect.width ? clamp((clientX - rect.left) / rect.width, 0, 1) * 100 : 50;
  const y = rect.height ? clamp((clientY - rect.top) / rect.height, 0, 1) * 100 : 50;
  element.style.setProperty('--mobile-tap-x', `${Number(x.toFixed(2))}%`);
  element.style.setProperty('--mobile-tap-y', `${Number(y.toFixed(2))}%`);
}

export function installMobileMotionBudget({
  root,
  documentTarget,
  sections = [],
  mobileQuery,
  reducedMotionQuery,
  createObserver = (callback, options) => new IntersectionObserver(callback, options)
} = {}) {
  if (!root || !documentTarget || !mobileQuery || !reducedMotionQuery) {
    return () => {};
  }

  const pressedPointers = new Map();
  let observer = null;
  let enabled = false;

  const clearPressed = (pointerId) => {
    const element = pressedPointers.get(pointerId);
    if (!element) return;
    element.classList.remove('is-mobile-pressed');
    element.style.removeProperty('--mobile-tap-x');
    element.style.removeProperty('--mobile-tap-y');
    pressedPointers.delete(pointerId);
  };

  const clearAllPressed = () => {
    [...pressedPointers.keys()].forEach(clearPressed);
  };

  const onPointerDown = (event) => {
    if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
    const interactive = event.target?.closest?.(INTERACTIVE_SELECTOR);
    if (!interactive) return;
    clearPressed(event.pointerId);
    setPressedPosition(interactive, event.clientX, event.clientY);
    interactive.classList.add('is-mobile-pressed');
    pressedPointers.set(event.pointerId, interactive);
  };

  const onPointerEnd = (event) => {
    clearPressed(event.pointerId);
  };

  const onVisibilityChange = () => {
    root.dataset.mobilePageVisible = String(documentTarget.visibilityState !== 'hidden');
    if (documentTarget.visibilityState === 'hidden') clearAllPressed();
  };

  const disable = () => {
    if (!enabled) return;
    enabled = false;
    observer?.disconnect();
    observer = null;
    clearAllPressed();
    sections.forEach((section) => {
      delete section.dataset.mobileMotionActive;
    });
    delete root.dataset.mobileMotionTier;
    delete root.dataset.mobilePageVisible;
    documentTarget.removeEventListener('pointerdown', onPointerDown);
    documentTarget.removeEventListener('pointerup', onPointerEnd);
    documentTarget.removeEventListener('pointercancel', onPointerEnd);
    documentTarget.removeEventListener('visibilitychange', onVisibilityChange);
  };

  const enable = () => {
    if (enabled) return;
    enabled = true;
    root.dataset.mobileMotionTier = 'balanced';
    onVisibilityChange();

    if (typeof createObserver === 'function') {
      observer = createObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.dataset.mobileMotionActive = 'true';
          } else {
            delete entry.target.dataset.mobileMotionActive;
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '8% 0px 8% 0px'
      });
      sections.forEach((section) => observer?.observe?.(section));
    } else {
      sections.forEach((section) => {
        section.dataset.mobileMotionActive = 'true';
      });
    }

    documentTarget.addEventListener('pointerdown', onPointerDown, { passive: true });
    documentTarget.addEventListener('pointerup', onPointerEnd, { passive: true });
    documentTarget.addEventListener('pointercancel', onPointerEnd, { passive: true });
    documentTarget.addEventListener('visibilitychange', onVisibilityChange);
  };

  const sync = () => {
    if (mobileQuery.matches && !reducedMotionQuery.matches) {
      enable();
    } else {
      disable();
    }
  };

  mobileQuery.addEventListener?.('change', sync);
  reducedMotionQuery.addEventListener?.('change', sync);
  sync();

  return () => {
    disable();
    mobileQuery.removeEventListener?.('change', sync);
    reducedMotionQuery.removeEventListener?.('change', sync);
  };
}
