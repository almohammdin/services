# Masar tools directory
The public catalog uses each tool's `url`. A selected client uses `clientUrl` when provided, with only the stable opaque client ID in the URL.
The public questionnaire remains generic; it does not automatically transmit answers to Masar.

The authority matrix uses `workspaceField` to find its existing matrix records.
The questionnaire uses `workspaceKind: 'client-consultation'`: its private record is saved under the existing client object's `consultation` property in `pricingClients_v1.clients`. The original JSON source is retained unchanged and displayed against the questionnaire's question schema. Source values are escaped before rendering.

Private reads and writes use the existing verified owner account and `users/{uid}` workspace. The transaction rereads the client, checks the expected questionnaire revision, preserves other clients and fields, and enforces the existing 850 KB document budget. No changes to Firestore permissions are required.

The questionnaire viewer supports file or pasted JSON import, preview before save, source export, print, received/reviewed status, and sending/receipt dates. Clear private views on logout and reject stale asynchronous responses. Never include private answers or client names in the public repository.
