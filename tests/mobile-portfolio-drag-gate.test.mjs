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

test('movement below six pixels remains pending', () => {
  const decision = createMobileDragDecision();

  decision.begin({ x: 200, y: 300 });
  assert.equal(decision.move({ x: 204, y: 302 }), 'pending');
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
