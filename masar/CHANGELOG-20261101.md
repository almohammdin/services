# Masar update — 2026-11-01

Implemented:
- Editor uses one workspace load, no automatic legacy recovery or save on open.
- Serialized, debounced saving with unchanged-data detection, status, failure feedback,
  private per-user local draft recovery and concurrent-edit conflict detection.
- Issued content is preserved on administrative updates and client rename; content edits
  create a new version. Quote date is retained.
- Preview skips unchanged DOM content and defers output-document rendering while hidden.
- Separate optional expertise/impact fields; existing scope text is retained untouched.
- A4 overflow warning and consistent screen/print text width; long documents flow.
- Latest offer first, expandable version history, status filter and client search.
- Compact footer with four linked brand icons; common brand typography.
- Font CSS reduced from 694877 to 1349 characters by extracting nine WOFF2 assets.
- Finance summary collapsed; due follow-ups visible on the dashboard.
- Non-destructive migration planner prepared; cloud migration is NOT activated.
  See MIGRATION.md.

Verification:
- JavaScript syntax checks passed for modified application scripts.
- Node regression tests cover sent snapshots, draft renaming, stable client IDs,
  administrative updates and deterministic migration validation.
- Browser tests on synthetic local data passed: load without save, fork issued quote,
  save/reopen, failed save with retained content, retry, version disclosure, search,
  client rename retaining original sent name/scope, long-text A4 warning,
  and concurrent-tab conflict rejection.
- Mobile viewport 390 px checked: page content remains inside viewport; A4 preview
  scrolls within its own area.
- Native print dialog was invoked, but exported PDF/page count was not inspectable.
- Production Firestore rules/edition, data relocation and measured live performance
  remain unverified. No production records were used for mutation tests.
