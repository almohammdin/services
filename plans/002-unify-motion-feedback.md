# 002 — Unify motion feedback

- **Status**: DONE
- **Commit**: 2f216cb
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens
- **Estimated scope**: 2 files, small

## Problem

Motion values are scattered, generic transitions animate unintended properties,
and most pressable controls do not acknowledge a press. Hover movement is also
applied on touch-capable devices, while reduced-motion handling covers only the
language control.

```css
/* waqqe/style.css:5 — current */
.upload-zone{...transition:.2s}
.page-frame{...transition:.15s}
.toast{...transition:.2s}
```

```css
/* waqqe/patch-v3.css:5-6 — current */
.footer-links a{...transition:.18s ease}
.footer-links a:hover{...transform:translateY(-1px)}
```

```css
/* waqqe/stamp-v11.css:30 — current */
.signature-choice .choice-check{...opacity:0;transform:scale(.75);transition:.18s}
```

## Target

Create one motion layer with these exact tokens:

```css
:root {
  --motion-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  --motion-ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --motion-press: 160ms;
  --motion-ui: 200ms;
}
```

- Press feedback: `transform: scale(.97)` over `160ms` with
  `var(--motion-ease-out)` for enabled buttons and link-like controls.
- Toast and state feedback: list only `opacity`, `transform`, `background-color`,
  `border-color`, and `color`; use `200ms` or `160ms` as appropriate.
- Gate movement on hover behind
  `@media (hover: hover) and (pointer: fine)`.
- Under `prefers-reduced-motion: reduce`, change `html` scroll behavior to `auto`,
  remove positional movement, and keep opacity/color feedback at `160ms`.

## Repo conventions to follow

- The app layers small release CSS files after the base stylesheet; the latest is
  `waqqe/stamp-v11.css`, linked in `waqqe/index.html:25`.
- Preserve the crisp, restrained product tone; do not add bounce or decorative
  loops. The existing spinner is functional constant motion and may remain linear.

## Steps

1. Create `waqqe/motion-v12.css` and define the four shared tokens.
2. Override generic transitions with explicit property lists for the upload zone,
   page state, toast, signature choice, and choice check.
3. Add `.97` active-state feedback to enabled primary and secondary controls.
4. Reset legacy hover transforms by default and re-enable them only for fine
   hover pointers.
5. Add reduced-motion, more-contrast, and reduced-transparency media rules.
6. Link the stylesheet after `stamp-v11.css` with version `0.12.0`.

## Boundaries

- Do NOT alter component colors, spacing, typography, or layout.
- Do NOT introduce keyframe animations for interactive controls.
- Do NOT remove functional focus indicators or disabled states.
- Do NOT add dependencies or publish the change.
- If a step doesn't match the code at commit `2f216cb`, STOP and report instead
  of improvising.

## Verification

- **Mechanical**: run `git diff --check`; it must exit 0. Search the new file for
  `transition: all` and confirm there are no matches.
- **Feel check**: press each major action, toggle a signature choice, trigger a
  toast, and confirm:
  - feedback is immediate and subtle, with no bounce;
  - touch interactions do not retain a hover translation;
  - repeated presses retarget smoothly because transitions are interruptible;
  - at 10% playback, only compositor-safe transform/opacity movement is visible;
  - reduced motion drops movement but retains opacity/color feedback.
- **Done when**: interaction feedback feels consistent and no new motion exceeds
  `200ms` for routine UI.
