# حتى أسطول — v1.0.0

Arabic RTL local-first release within https://almohammdin.github.io/services/fleet/.
No build step or CDN JavaScript dependencies. Existing Hatta fonts and identity.

## Working now
- Individuals / organizations workspace settings; vehicle categories, VIN/model/engine/market, main image and odometer.
- Recurring maintenance by elapsed months and/or km, whichever comes first. Unknown baseline remains unknown, not healthy. Date arithmetic clamps to the end of the month.
- Record work, costs, workshop, notes, up to six compressed images; linked records advance only their own rule. Historical odometer consistency checks.
- In-app due/soon alerts; configurable thresholds; ICS export for calendar reminders.
- Store source PDF/image/text locally; import JSON, edit extracted rows and explicitly approve before saving.
- IndexedDB persistence and full JSON backup/restore including attachments.
- Local people/assignment register, explicitly not authentication or secure sharing.

## Explicit release boundaries
- No backend, account invitations, role enforcement, cloud synchronization, or background email/push notifications is enabled. IndexedDB is per browser/profile and is not encrypted. Any user of that browser profile can access it.
- AI is not connected by default. The UI provides a tested-format integration boundary and review step, not a claim of live AI. Optional server code is included; live provider extraction still needs deployment and an operator-provided server secret/API subscription.
- No automatic manufacturer database exists. Users must verify applicability and provenance. Do not treat interval examples as factory recommendations.
- Only constant recurring km/month schedules are represented. First-service exceptions, fixed calendar milestones, nonrecurring items, engine hours, irregular intervals need a future richer rule model. Do not approximate them as recurring rules.
- Backup includes private vehicle information and images. Never commit real vehicle files or personal VINs to this public repository.

## Optional AI extraction
Run `server/extract.mjs` on Node 22+ behind HTTPS, with 16 MB request limit and network rate limiting. Supply `OPENAI_API_KEY`, `OPENAI_MODEL` (a currently enabled vision/structured-output model), `FLEET_EXTRACT_TOKEN` (random private-service token, >=32 characters), and optionally `FLEET_ORIGIN` / `PORT` in server environment, never source control. Request: `POST /extract`, multipart `file` and `vehicle`; Authorization Bearer private-service token. Allowed web origin defaults to `https://almohammdin.github.io`. In-memory limit 10 authenticated requests/hour/instance; this private single-operator service is not a multi-tenant auth solution. For production organizations replace with verified per-user auth, durable quotas and membership checks before exposure.

Enter the deployed HTTPS endpoint in settings. The UI asks for the service access token for each request and does not persist it. It never requests the OpenAI API key. The service sends the selected document to OpenAI with `store:false`, without logging document contents. This does not override provider retention policy. Source files and vehicle metadata are untrusted data; the prompt prohibits following embedded instructions. Responses are validated and reviewed by the user before use.

Response: `{ "rules": [{"name":"...","action":"فحص","km":10000,"months":6,"source":"Publication","page":"42","condition":"عادي"}], "warnings": [] }`.
Numbers above illustrate format only. Uncertain/unsupported intervals are returned as warnings and must not be silently approved.

Provider references: https://developers.openai.com/api/docs/guides/file-inputs and https://developers.openai.com/api/docs/guides/structured-outputs .

## Verification
`node fleet/domain.test.mjs` from repository root. Syntax: `node --check fleet/app.js` and `node --check fleet/server/extract.mjs`.
Browser QA: creation, persistence, rule due state, recording completion, empty states, navigation, local backup and photo/file workflows. No live AI provider test has been performed without credentials.

## Next backend phase
Use vehicle-scoped memberships enforced by the database/server, verified invitations and audit log. Separate ownership, assignment and permissions. Store images in private object storage with short-lived access URLs. Import existing local backups with explicit review. Do not use local role selectors as authorization.

## v1.1 — Languages and removable examples
- Arabic, English and French UI; a header selector persists the language per browser. Arabic uses RTL; English/French use LTR, localized dates and numbers. Vehicle names, notes and imported source data are never passed through automatic UI translation. Stable Arabic enum values remain unchanged in saved data for compatibility; option labels are localized.
- Three clearly marked fictional Saudi-market examples: Camry 2026, Hilux 2020 petrol and Corolla 2015. Mileage, ownership and costs are illustrative. General inspection items and the 10,000 km visit pattern reference Toyota KSA's general maintenance page and Jameel program; they are not verified VIN/model-year-specific schedules. No new engine specifications, personal VINs or real invoice data are included.
- The Settings action removes original sample data once. Edited entities and user-created dependent records are preserved; vehicles with those records are retained and detached from the demo. The `examplesDeleted` flag is backed up and restored; sample data never reappears automatically in that workspace after deletion. Clearing the entire browser storage creates a new workspace. Explicitly restoring an older backup restores that backup's sample state.
- Tests: `node fleet/i18n.test.mjs`, `node fleet/demo.test.mjs`, and existing `node fleet/domain.test.mjs`.
