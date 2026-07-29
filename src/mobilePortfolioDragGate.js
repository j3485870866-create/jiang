export function isInsideCenteredCircle(point, rect, diameterRatio = 0.64) {
  const diameter = Math.min(rect.width, rect.height) * diameterRatio;
  const radius = diameter / 2;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return Math.hypot(point.x - centerX, point.y - centerY) <= radius;
}

export function createMobileDragDecision({ threshold = 6 } = {}) {
  let start = null;
  let state = 'pending';

  return {
    begin(point) {
      start = point;
      state = 'pending';
    },

    move(point) {
      if (!start || state === 'dragging') return state;

      const deltaX = point.x - start.x;
      const deltaY = point.y - start.y;

      if (Math.hypot(deltaX, deltaY) < threshold) return 'pending';

      state = 'dragging';
      return state;
    },

    end() {
      start = null;
      state = 'pending';
    }
  };
}

function pointerInit(event, overrides = {}) {
  return {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerId: event.pointerId,
    pointerType: event.pointerType,
    isPrimary: event.isPrimary ?? true,
    clientX: event.clientX,
    clientY: event.clientY,
    button: event.button,
    buttons: event.buttons,
    pressure: event.pressure,
    width: event.width,
    height: event.height,
    ...overrides
  };
}

function defaultCreatePointerEvent(type, init) {
  return new PointerEvent(type, init);
}

export function installMobilePortfolioDragGate({
  gallery,
  canvas,
  handle,
  mediaQuery,
  createPointerEvent = defaultCreatePointerEvent,
  diameterRatio = 0.64,
  threshold = 6
} = {}) {
  if (!gallery || !canvas || !handle || !mediaQuery) return () => {};

  const decision = createMobileDragDecision({ threshold });
  let candidatePointerId = null;
  let startEvent = null;
  let forwarding = false;

  const forward = (type, event, overrides) => {
    canvas.dispatchEvent(createPointerEvent(type, pointerInit(event, overrides)));
  };

  const reset = (event, forwardedType) => {
    if (forwarding && event && forwardedType) {
      forward(forwardedType, event, { buttons: 0, pressure: 0 });
    }
    if (
      event &&
      handle.hasPointerCapture?.(event.pointerId)
    ) {
      handle.releasePointerCapture(event.pointerId);
    }
    forwarding = false;
    candidatePointerId = null;
    startEvent = null;
    decision.end();
  };

  const onPointerDown = (event) => {
    if (!mediaQuery.matches || candidatePointerId !== null) return;

    const point = { x: event.clientX, y: event.clientY };
    if (!isInsideCenteredCircle(point, gallery.getBoundingClientRect(), diameterRatio)) {
      return;
    }

    candidatePointerId = event.pointerId;
    startEvent = event;
    decision.begin(point);
  };

  const onPointerMove = (event) => {
    if (event.pointerId !== candidatePointerId) return;

    const state = decision.move({ x: event.clientX, y: event.clientY });
    if (state !== 'dragging') return;

    if (!forwarding) {
      forwarding = true;
      handle.setPointerCapture?.(event.pointerId);
      forward('pointerdown', startEvent);
    }

    event.preventDefault();
    forward('pointermove', event);
  };

  const onPointerUp = (event) => {
    if (event.pointerId !== candidatePointerId) return;
    reset(event, 'pointerup');
  };

  const onPointerCancel = (event) => {
    if (event.pointerId !== candidatePointerId) return;
    reset(event, 'pointercancel');
  };

  handle.addEventListener('pointerdown', onPointerDown);
  handle.addEventListener('pointermove', onPointerMove, { passive: false });
  handle.addEventListener('pointerup', onPointerUp);
  handle.addEventListener('pointercancel', onPointerCancel);

  return () => {
    reset();
    handle.removeEventListener('pointerdown', onPointerDown);
    handle.removeEventListener('pointermove', onPointerMove);
    handle.removeEventListener('pointerup', onPointerUp);
    handle.removeEventListener('pointercancel', onPointerCancel);
  };
}
