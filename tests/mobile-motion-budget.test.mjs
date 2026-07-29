import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCanvasMotionBudget,
  installMobileMotionBudget,
  markMobileInteractive
} from '../src/mobileMotionBudget.js';

class FakeEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(type, listener) {
    this.listeners.get(type)?.delete(listener);
  }

  emit(type, event = {}) {
    this.listeners.get(type)?.forEach((listener) => listener({ type, ...event }));
  }
}

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeElement {
  constructor(rect = { left: 0, top: 0, width: 100, height: 100 }) {
    this.dataset = {};
    this.classList = new FakeClassList();
    this.rect = rect;
    this.style = {
      values: new Map(),
      setProperty: (name, value) => this.style.values.set(name, value),
      removeProperty: (name) => this.style.values.delete(name)
    };
  }

  getBoundingClientRect() {
    return this.rect;
  }
}

function createQuery(matches) {
  const query = new FakeEventTarget();
  query.matches = matches;
  return query;
}

test('mobile motion budget activates visible sections and cleans every state', () => {
  const root = new FakeElement();
  const firstSection = new FakeElement();
  const secondSection = new FakeElement();
  const documentTarget = new FakeEventTarget();
  documentTarget.visibilityState = 'visible';
  const mobileQuery = createQuery(true);
  const reducedMotionQuery = createQuery(false);
  let observerCallback;
  let disconnected = false;

  const cleanup = installMobileMotionBudget({
    root,
    documentTarget,
    sections: [firstSection, secondSection],
    mobileQuery,
    reducedMotionQuery,
    createObserver(callback) {
      observerCallback = callback;
      return {
        observe() {},
        disconnect() {
          disconnected = true;
        }
      };
    }
  });

  assert.equal(root.dataset.mobileMotionTier, 'balanced');
  assert.equal(root.dataset.mobilePageVisible, 'true');

  observerCallback([
    { target: firstSection, isIntersecting: true },
    { target: secondSection, isIntersecting: false }
  ]);

  assert.equal(firstSection.dataset.mobileMotionActive, 'true');
  assert.equal('mobileMotionActive' in secondSection.dataset, false);

  documentTarget.visibilityState = 'hidden';
  documentTarget.emit('visibilitychange');
  assert.equal(root.dataset.mobilePageVisible, 'false');

  cleanup();

  assert.equal('mobileMotionTier' in root.dataset, false);
  assert.equal('mobilePageVisible' in root.dataset, false);
  assert.equal('mobileMotionActive' in firstSection.dataset, false);
  assert.equal(disconnected, true);
});

test('touch feedback only decorates declared interactive elements', () => {
  const root = new FakeElement();
  const section = new FakeElement();
  const documentTarget = new FakeEventTarget();
  documentTarget.visibilityState = 'visible';
  const mobileQuery = createQuery(true);
  const reducedMotionQuery = createQuery(false);
  const interactive = new FakeElement({ left: 10, top: 20, width: 200, height: 100 });
  const dragOnly = new FakeElement();
  const interactiveChild = {
    closest(selector) {
      return selector === '[data-mobile-interactive]' ? interactive : null;
    }
  };
  const dragChild = {
    closest() {
      return null;
    }
  };

  const cleanup = installMobileMotionBudget({
    root,
    documentTarget,
    sections: [section],
    mobileQuery,
    reducedMotionQuery,
    createObserver() {
      return { observe() {}, disconnect() {} };
    }
  });

  documentTarget.emit('pointerdown', {
    pointerId: 7,
    pointerType: 'touch',
    clientX: 110,
    clientY: 70,
    target: interactiveChild
  });

  assert.equal(interactive.classList.contains('is-mobile-pressed'), true);
  assert.equal(interactive.style.values.get('--mobile-tap-x'), '50%');
  assert.equal(interactive.style.values.get('--mobile-tap-y'), '50%');

  documentTarget.emit('pointerup', { pointerId: 7 });
  assert.equal(interactive.classList.contains('is-mobile-pressed'), false);

  documentTarget.emit('pointerdown', {
    pointerId: 8,
    pointerType: 'touch',
    clientX: 10,
    clientY: 10,
    target: dragChild
  });

  assert.equal(dragOnly.classList.contains('is-mobile-pressed'), false);
  cleanup();
});

test('reduced motion leaves mobile enhancements disabled', () => {
  const root = new FakeElement();
  const documentTarget = new FakeEventTarget();
  documentTarget.visibilityState = 'visible';

  installMobileMotionBudget({
    root,
    documentTarget,
    sections: [new FakeElement()],
    mobileQuery: createQuery(true),
    reducedMotionQuery: createQuery(true),
    createObserver() {
      throw new Error('observer should not be created');
    }
  });

  assert.equal('mobileMotionTier' in root.dataset, false);
});

test('interactive marking is limited to the explicitly selected safe elements', () => {
  const safeCard = new FakeElement();
  const safeButton = new FakeElement();
  const dragOnlyPhoto = new FakeElement();

  const cleanup = markMobileInteractive([safeCard, safeButton]);

  assert.equal(safeCard.dataset.mobileInteractive, 'true');
  assert.equal(safeButton.dataset.mobileInteractive, 'true');
  assert.equal('mobileInteractive' in dragOnlyPhoto.dataset, false);

  cleanup();

  assert.equal('mobileInteractive' in safeCard.dataset, false);
  assert.equal('mobileInteractive' in safeButton.dataset, false);
});

test('coarse mobile pointers use a cheaper canvas budget than desktop pointers', () => {
  assert.deepEqual(
    getCanvasMotionBudget({ coarsePointer: true }),
    { fps: 30, maximumDpr: 1.5 }
  );
  assert.deepEqual(
    getCanvasMotionBudget({ coarsePointer: false }),
    { fps: 60, maximumDpr: 2 }
  );
});
