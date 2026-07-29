export function installAboutPhotoDragGuard(stack) {
  if (!stack) return () => {};

  const preventNativeDrag = (event) => event.preventDefault();

  stack.querySelectorAll('img').forEach((photo) => {
    photo.draggable = false;
  });
  stack.addEventListener('dragstart', preventNativeDrag);

  return () => stack.removeEventListener('dragstart', preventNativeDrag);
}
