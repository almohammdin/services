# Authority matrix cloud activation

Project: `mesraah-a2dfc`. Public editing, JSON export and PDF do not depend on cloud activation.
`authority-matrix/config.js` intentionally keeps cloud reads/writes disabled until server rules are verified.

1. Authenticate Firebase CLI as the project administrator. Inspect the live database edition and export its current security rules. Back them up.
2. Merge `authority-matrix.rules` inside the existing `match /databases/{database}/documents`. Check for overlapping recursive allow rules: Firestore grants access if ANY matching rule allows it.
3. Audit existing `/users/{uid}` rules. Masar stores clients and quotes there. Enforce the verified Google owner account for this private workspace without weakening rules protecting other applications. The front-end email guard is not a server security boundary.
4. Test deny cases: anonymous, other email, unverified email, non-Google provider, other uid, changed owner/client/createdAt, skipped revision, missing/mismatched immutable version, extra fields, oversized strings, deletions. Test owner creation/update/read and transaction conflicts.
5. Deploy the merged rules, test with the real authorized Google account and a different account. Confirm existing Masar workflows and other project apps still work. Only then set `CLOUD_ENABLED=true` and publish.

Schema: `masarAuthority/{ownerUid}/matrices/{stableClientId}` plus immutable `versions/{revision}`. Matrix content uses the validated version 1 JSON format. `memory` is private client context and is excluded from PDF/JSON exports. Clients gain opaque stable IDs within the existing `pricingClients_v1` array using transactions. Renames preserve IDs. A revision mismatch prevents overwriting a newer matrix.

Do not include service-account credentials or Firebase admin tokens in the repository. The Firebase web config is public configuration, not an admin credential.
