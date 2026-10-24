# Masar tools directory

`catalog.js` is the registry of published tools. Add tools only when their public route and private workspace integration are ready. The public directory is rendered before loading authentication, and does not read client records for anonymous users.

Each catalog record defines `id`, `name`, `category`, `description`, `url`, `outputs`, and `workspaceField`. The first tool is the existing authority matrix. Home and shared navigation link to the directory; client cards link with an opaque stable client ID.

Tool contract:
- Public editing works without signing in and has no automatic durable save. Exported files are explicit user actions.
- Private reads/writes use the existing Masar Firebase project and `users/{uid}` workspace, guarded by the verified owner Google account. Preserve current server permissions.
- Use stable client IDs, merge transactions, revision checks, and the shared document-size guard. Preserve unrelated client and quote fields.
- For catalog discovery, expose saved summaries under `[workspaceField].matrices[clientId]` with `clientName`, `revision`, `status`, `updatedAtIso`. If a new tool needs multiple experiments per client, add an explicit adapter and record IDs rather than overwriting a client's work.
- Private context is excluded from public displays and exports unless the owner explicitly chooses it. Clear private state on logout and reject stale async responses.

Adding a registry entry does not automatically implement storage or authorization for a new tool. Implement and test that tool's adapter first.

Authentication is the same shared Masar Google session and owner account across all tools; never create a separate account or identity store for each tool.
