# Waqqe motion improvement plans

| Plan | Title | Severity | Status |
| --- | --- | --- | --- |
| 001 | Clarify signature placement | HIGH | DONE |
| 002 | Unify motion feedback | MEDIUM | DONE |
| 003 | Smooth overlay dragging | HIGH | DONE |

## Recommended order

1. `002-unify-motion-feedback.md` establishes the shared CSS tokens and release
   layer used by both later plans.
2. `001-clarify-signature-placement.md` adds the contextual placement guidance.
3. `003-smooth-overlay-dragging.md` changes direct manipulation and dismisses the
   new guide when interaction begins.

Plans 001 and 003 depend on the CSS layer created by plan 002. No plan requires a
new dependency or publishing step.
