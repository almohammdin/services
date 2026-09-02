# 001 — Clarify signature placement

- **Status**: DONE
- **Commit**: 2f216cb
- **Severity**: HIGH
- **Category**: Missed opportunities
- **Estimated scope**: 4 files, small

## Problem

The primary “add signature” path does add a newly saved signature to the active
PDF page, but the only confirmation is a short toast. The modal footer also does
not explain that the signature will appear immediately after saving. On a phone,
this makes the transition from creation to direct manipulation easy to miss.

```html
<!-- waqqe/index.html:132 — current -->
<div class="modal-foot"><button class="save-signature" id="saveSignature" type="button">حفظ التوقيع</button></div>
```

```js
// waqqe/app.js:202 — current
state.overlays.push(o);renderOverlay(o);selectOverlay(o.id);toast('اسحب التوقيع إلى مكانه');
```

## Target

Add two contextual explanations without adding a tutorial:

- In add mode, show a footer hint beside the save button: the existing localized
  `dragSignature` copy. Hide it in management-only save mode.
- After an item is inserted, show a compact status guide directly above the PDF
  stage. Use the existing localized `dragSignature`, `dragStamp`, or `itemAdded`
  text and dismiss it on the first drag/resize or after 5 seconds.
- Give the guide `role="status"` and `aria-live="polite"`. The dismiss button uses
  the existing localized `close` label.
- Introduce it with `opacity` and `translateY(-6px)` over `200ms` using
  `cubic-bezier(0.23, 1, 0.32, 1)`. Under reduced motion, keep the opacity change
  but remove translation.

## Repo conventions to follow

- Visible copy is localized through `window.WaqqeI18n.t()` in
  `waqqe/i18n.js:165`; reuse existing keys rather than adding Arabic-only text.
- Runtime UI coordination already lives in `waqqe/ux-v3.js:10-54`.
- New release-specific visual rules belong in a new versioned CSS layer linked
  after `stamp-v11.css` in `waqqe/index.html:25`.

## Steps

1. In `waqqe/index.html`, add `#signatureActionHint` to the signature modal footer
   and add `#placementHint` between the viewer toolbar and `#pdfStage`.
2. In `waqqe/ux-v3.js`, synchronize the signature footer hint with add/save mode
   and language changes.
3. In `waqqe/app.js`, add a small placement-guide controller, invoke it when an
   overlay is added, and dismiss it on the first drag/resize and when resetting.
4. In the new versioned CSS layer, style the guide and footer hint for desktop,
   mobile, reduced motion, more contrast, and reduced transparency.

## Boundaries

- Do NOT change PDF generation, signature persistence, or the three-step model.
- Do NOT add a tour, tooltip library, or dependency.
- Do NOT publish or push the change.
- If a step doesn't match the code at commit `2f216cb`, STOP and report instead
  of improvising.

## Verification

- **Mechanical**: run `node --check waqqe/app.js`, `node --check waqqe/ux-v3.js`,
  `node --check waqqe/i18n.js`, and `git diff --check`; all must exit 0.
- **Feel check**: open a PDF, choose “أضف التوقيع”, draw a signature, and confirm:
  - the modal explains that saving will place the signature;
  - the signature appears selected on the active page;
  - the contextual guide is visible near the document and disappears after drag;
  - changing language updates both hints;
  - reduced motion removes movement while preserving the status change.
- **Done when**: a first-time user receives an in-context cue from save through
  placement without relying on the toast.
