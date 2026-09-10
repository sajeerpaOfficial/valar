/**
 * One viewport height that a phone's address bar cannot move.
 *
 * `window.innerHeight` follows the visual viewport, so it shrinks and grows by
 * 60-odd pixels as the bar slides away and comes back. Anything scroll-driven
 * that divides by it therefore steps sideways while the page itself has not
 * moved at all — the scroll position is unchanged, the denominator is not, and
 * the section jumps. On a laptop the bug is invisible, because there is nothing
 * to slide.
 *
 * The sections here are cut in `svh` — the viewport with the bar counted in,
 * which holds still — so that is the number the timelines are measured
 * against. It is read from a probe so the browser resolves the unit for us,
 * cached, and re-read only when a resize actually changes it: a bar sliding
 * fires `resize` too, and that one must not be allowed to disturb anything.
 */
let unit = 0;
const listeners = new Set<() => void>();
let bound = false;

const measure = () => {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);
  const h = probe.getBoundingClientRect().height;
  probe.remove();
  // no svh (pre-2022 browsers): innerHeight is the best available, and those
  // engines have no dynamic toolbar to go with it
  unit = h || window.innerHeight;
};

const bind = () => {
  if (bound) return;
  bound = true;
  window.addEventListener("resize", () => {
    const was = unit;
    measure();
    if (unit !== was) for (const fn of listeners) fn();
  });
};

/** The stable viewport height in px. Cheap — measured once, then cached. */
export const viewportUnit = () => {
  if (!unit) {
    measure();
    bind();
  }
  return unit;
};

/**
 * Run `fn` when the stable height genuinely changes — a rotation or a window
 * drag, not a toolbar. Returns an unsubscribe.
 */
export const onViewportChange = (fn: () => void) => {
  viewportUnit();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
