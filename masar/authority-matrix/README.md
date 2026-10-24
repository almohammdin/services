# Masar authority matrix storage

The integration reuses the existing Firebase project `mesraah-a2dfc` and the same private `users/{uid}` document as quotes and clients. No new database, collection, provider or rules deployment is needed. Preserve the current server-side authorization protecting that workspace. The application also limits its private UI to the verified Google account `naif123456@gmail.com`.

Matrices are in `authorityMatrices_v1.matrices[stableClientId]`, with matrix JSON, private client context, status, revision and ISO creation/update dates. The revision is a concurrency check, not a retained version history. Each save reads the latest user document in a transaction and merges only the authority field. Existing quotes, clients and other clients' matrices are preserved. Stable IDs survive client renames.

Before saving, the application checks approximate total document size with a safety margin below Firestore's 1 MiB limit. An oversized save is rejected with an Arabic message and JSON export remains available; nothing is truncated or removed. Private context is excluded from PDF/JSON exports. Public editing has no automatic local persistence; legacy local data can be explicitly restored by the owner.

Validation: DOM tests for complete quote/output lists, money formatting and matrix views; transaction tests for stable IDs, rename continuity, stale-write rejection and preservation of unrelated fields; offline PDF rendering with real Hatta fonts for long documents and large matrices. Real Google sign-in and server permissions were not exercised in this development session; these remain the existing Masar authentication and authorization.
