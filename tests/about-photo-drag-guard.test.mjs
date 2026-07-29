import assert from 'node:assert/strict';
import test from 'node:test';

async function loadGuard() {
  try {
    return await import('../src/aboutPhotoDragGuard.js');
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND') return {};
    throw error;
  }
}

test('about photo stack prevents native image dragging without blocking card gestures', async () => {
  const { installAboutPhotoDragGuard } = await loadGuard();

  assert.equal(typeof installAboutPhotoDragGuard, 'function');

  const stack = new EventTarget();
  const photos = [{ draggable: true }, { draggable: true }];
  stack.querySelectorAll = () => photos;

  const cleanup = installAboutPhotoDragGuard(stack);
  const dragEvent = new Event('dragstart', { cancelable: true });

  assert.equal(stack.dispatchEvent(dragEvent), false);
  assert.equal(dragEvent.defaultPrevented, true);
  assert.deepEqual(photos.map((photo) => photo.draggable), [false, false]);

  cleanup();

  const eventAfterCleanup = new Event('dragstart', { cancelable: true });
  assert.equal(stack.dispatchEvent(eventAfterCleanup), true);
});
