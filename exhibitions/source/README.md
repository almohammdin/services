# منصة الاستفادة من المعارض والمؤتمرات

Version 3.0.0. Arabic RTL workspace for exhibition and conference participation.

## Development

```sh
npm ci
npm run dev
```

Open `/services/exhibitions/` on the Vite development server.

```sh
npm test
npm run build
```

Production output is in `release/`. Publish its contents to the parent `exhibitions/` directory. Preserve `source/` for future development. Base path and PWA scope are `/services/exhibitions/`.

## Data model

IndexedDB (Dexie) stores participations, tasks, contacts with optional card images, and appointments locally in this browser. Revisions prevent a stale tab silently overwriting another tab. JSON backups preserve all records; imports retain existing records and merge new identifiers. The previous `hatta-exhibitions-v1` localStorage key remains untouched while drafts and saved evaluations migrate to the new model.

No cloud account or server is required. Card OCR runs in a local worker. The worker is bundled; Tesseract core 6.1.2 and Arabic/English language data download on first use. QR decoding uses locally hosted ZXing WASM. Uploaded card images are processed on device.

Calendar wall times use the participation timezone. ICS export converts them to UTC. Dates can display Gregorian, Hijri, or both. Scores separate answered-weight coverage, subjective fit, attached sources, and organizer statements. Goal-specific weights are guidance, not an empirical predictive model.

## Dependencies and licenses

React, Vite, Papa Parse, and FullCalendar standard plugins use MIT licenses. Dexie uses Apache-2.0. Lucide is ISC. Tesseract.js and tesseract.js-core are Apache-2.0. zxing-wasm is MIT, with zxing-cpp Apache-2.0. See `THIRD_PARTY_NOTICES.txt` and upstream package licenses. Pinned resolved versions are in `package-lock.json`.

The supplied platform identity is reused as an image sprite; Hatta and Naif assets retain their original artwork. Thmanyah fonts are existing owner-provided site assets. Their rights remain with their owners.
