# Masar storage migration: prepared, not activated

The production reader/writer still uses the existing user document. No cloud records
have been relocated or deleted by this update.

The pure buildMigrationPlan(userId, snapshot) helper in quote-model.js creates a
deterministic, non-destructive plan:
- users/{uid}/masarQuotes/{encoded original quote ID}
- users/{uid}/masarClients/{encoded stable client ID}
- users/{uid}/masarMatrices/{encoded stable client ID}

Quote IDs, series IDs and versions are retained. Existing URL query IDs must be
decoded/resolved by the future storage adapter, so previously shared links remain valid.
Deleted versions are excluded and their tombstones retained in the plan.

Activation prerequisites:
1. Verify Firestore instance edition and inspect the deployed access rules.
2. Export a complete private backup of the user document, including all tool fields.
3. Add owner-only rules for the new collections and test denial for unauthenticated
   users and other users. Do not deploy permissive wildcard rules.
4. Implement a shared storage adapter for editor, offers, clients, dashboards,
   surveys, authority matrices and tools. Search for every direct user-document reader.
5. Run the plan on test data. Compare record counts and every migrated field.
6. Copy records idempotently, verify hashes/counts, then switch the adapter with a
   version marker. Handle concurrent edits and old open tabs before activation.
7. Keep the original snapshot for rollback; do not delete it during migration.

Reason not activated in this release: Firebase administration access and live
rules were not available for verification. GitHub source access alone does not
establish database permissions.

Validation performed for this release is recorded in CHANGELOG-20261101.md.
