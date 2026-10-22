/** Explicit cycling also includes links when Safari's native Tab order skips them. */
export function cycleDialogFocus(container: HTMLElement, backwards = false) {
  const items = Array.from(container.querySelectorAll<HTMLElement>(
    'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]'
  )).filter(node => node.tabIndex >= 0 && !node.closest('[inert]') && node.getClientRects().length > 0 && getComputedStyle(node).visibility !== 'hidden');
  if (!items.length) return false;
  const current = items.indexOf(document.activeElement as HTMLElement);
  const next = current < 0 ? (backwards ? items.length - 1 : 0) : (current + (backwards ? -1 : 1) + items.length) % items.length;
  items[next].focus();
  return true;
}
