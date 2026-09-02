# 003 — Smooth overlay dragging

- **Status**: DONE
- **Commit**: 2f216cb
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 2 files, medium

## Problem

Each drag pointer event updates normalized coordinates and immediately writes
`left` and `top`. Those properties require layout and paint, which can make the
most important direct-manipulation gesture stutter on large PDFs or mobile
devices.

```js
// waqqe/app.js:249 — current
const move=ev=>{const x=clamp(startX+(ev.clientX-sx),0,r.width-o.nw*r.width),y=clamp(startY+(ev.clientY-sy),0,r.height-o.nh*r.height);o.nx=x/r.width;o.ny=y/r.height;applyOverlay(o)};
```

## Target

- During drag, leave committed `left` and `top` unchanged and write only
  `transform: translate3d(dx, dy, 0)` on the dragged element.
- Preserve the pointer-down grab offset by calculating deltas from the element's
  committed origin; do not snap the signature under the pointer.
- Clamp the visual position within the page on every pointer move.
- On `pointerup` or `pointercancel`, commit final normalized coordinates, clear the
  temporary transform, and call `applyOverlay()` exactly once.
- Add and remove `.is-dragging`; its CSS uses `will-change: transform`,
  `cursor: grabbing`, and a stronger selection shadow. Do not animate the drag.
- Preserve `setPointerCapture()` so the gesture remains interruptible and reliable
  outside the element bounds.

## Repo conventions to follow

- Geometry is stored as page-normalized `nx`, `ny`, `nw`, and `nh` values in
  `waqqe/app.js:201` and committed to pixels by `applyOverlay()` at
  `waqqe/app.js:237-241`.
- Continue using the existing `clamp()` utility from `waqqe/app.js:25` and the
  current pointer event model at `waqqe/app.js:242-268`.
- Drag-specific visual rules belong in `waqqe/motion-v12.css`.

## Steps

1. Refactor only the drag branch in `wireOverlay()` to track pending pixel
   coordinates and update `translate3d()` during pointer movement.
2. Add a single cleanup/commit function shared by pointer-up and pointer-cancel;
   remove listeners, commit coordinates, clear transform, and remove state class.
3. Dismiss the placement guide when drag begins.
4. Add `.overlay-item.is-dragging` styling without a transform transition.
5. Leave resize geometry writes unchanged because it alters actual export bounds;
   mark resize state visually and remove it on release.

## Boundaries

- Do NOT change normalized geometry semantics or PDF export calculations.
- Do NOT add inertia, springs, snapping, or velocity-based dismissal.
- Do NOT animate `left`, `top`, `width`, or `height`.
- Do NOT add dependencies or publish the change.
- If a step doesn't match the code at commit `2f216cb`, STOP and report instead
  of improvising.

## Verification

- **Mechanical**: run `node --check waqqe/app.js` and `git diff --check`; both must
  exit 0. Search the drag move handler and confirm it writes `transform` but does
  not call `applyOverlay()`.
- **Feel check**: drag signatures, stamps, text, and dates at different zoom/page
  sizes, then confirm:
  - the grabbed point stays under the pointer with no initial snap;
  - the item cannot leave the page;
  - releasing commits exactly where the preview stopped;
  - pointer cancel leaves the item at its last valid preview position;
  - export uses the committed final position;
  - reduced motion does not alter or delay direct manipulation.
- **Done when**: drag movement is compositor-only during the gesture and exported
  placement matches the final on-screen location.
