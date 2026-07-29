import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMobileDragDecision,
  installMobilePortfolioDragGate,
  isInsideCenteredCircle
} from '../src/mobilePortfolioDragGate.js';

test('center hit circle uses the expanded 64 percent diameter', () => {
  const rect = { left: 0, top: 0, width: 400, height: 600 };

  assert.equal(isInsideCenteredCircle({ x: 200, y: 300 }, rect), true);
  assert.equal(isInsideCenteredCircle({ x: 327, y: 300 }, rect), true);
  assert.equal(isInsideCenteredCircle({ x: 329, y: 300 }, rect), false);
});

test('default six pixel threshold activates horizontal dragging quickly', () => {
  const decision = createMobileDragDecision();

  decision.begin({ x: 200, y: 300 });
  assert.equal(decision.move({ x: 204, y: 302 }), 'pending');
  assert.equal(decision.move({ x: 207, y: 302 }), 'horizontal');
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

function createPointerTarget() {
  const listeners = new Map();
  const events = [];
  let capturedPointerId = null;

  return {
    events,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
    dispatchEvent(event) {
      events.push(event);
      listeners.get(event.type)?.(event);
      return true;
    },
    emit(type, init = {}) {
      const event = {
        type,
        pointerId: 1,
        clientX: 0,
        clientY: 0,
        pointerType: 'touch',
        button: 0,
        buttons: 1,
        pressure: 0.5,
        preventDefault() {
          this.defaultPrevented = true;
        },
        ...init
      };
      listeners.get(type)?.(event);
      return event;
    },
    setPointerCapture(pointerId) {
      capturedPointerId = pointerId;
    },
    hasPointerCapture(pointerId) {
      return capturedPointerId === pointerId;
    },
    releasePointerCapture(pointerId) {
      if (capturedPointerId === pointerId) capturedPointerId = null;
    }
  };
}

test('accepted horizontal drag is forwarded until release, even outside the center', () => {
  const gallery = {
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 400, height: 600 })
  };
  const canvas = createPointerTarget();
  const handle = createPointerTarget();
  const cleanup = installMobilePortfolioDragGate({
    gallery,
    canvas,
    handle,
    mediaQuery: { matches: true },
    createPointerEvent: (type, init) => ({ type, ...init })
  });

  handle.emit('pointerdown', { clientX: 200, clientY: 300 });
  const activation = handle.emit('pointermove', { clientX: 218, clientY: 304 });
  handle.emit('pointermove', { clientX: 390, clientY: 20 });
  handle.emit('pointerup', { clientX: 390, clientY: 20, buttons: 0 });

  assert.deepEqual(canvas.events.map(({ type }) => type), [
    'pointerdown',
    'pointermove',
    'pointermove',
    'pointerup'
  ]);
  assert.equal(activation.defaultPrevented, true);

  const eventCount = canvas.events.length;
  handle.emit('pointerdown', { clientX: 390, clientY: 20 });
  handle.emit('pointermove', { clientX: 350, clientY: 20 });
  assert.equal(canvas.events.length, eventCount);

  cleanup();
});

test('vertical movement inside the center does not rotate the gallery', () => {
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
  const verticalMove = handle.emit('pointermove', { clientX: 204, clientY: 318 });

  assert.equal(canvas.events.length, 0);
  assert.equal(verticalMove.type, 'pointermove');
});
