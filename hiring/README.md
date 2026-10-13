# Private owner hiring workspace

This static application is published at /services/hiring/. Public source contains no candidate records, owner activation token, or administrative secret. There is no public signup route in the application.

The dedicated hiring-owner-auth Edge Function accepts only the configured owner identity. Initial account activation requires a 256-bit invitation delivered privately to the owner, expires after 24 hours, and is consumed once. The owner chooses the password in the site. The temporary bootstrap route was removed. Other application accounts in the shared Supabase project cannot access hiring data.

Data access requires both the immutable owner user ID and a server-created session grant. Only the auth gateway can create a session grant after checking owner credentials. Grants are checked by row-level security and are revoked on logout.

Autosave is the primary persistence flow. Save/export/import toolbar controls were removed at the owner request. The local HTML companion is generated separately and kept outside this public repository.

The footer follows the canonical services footer: a single Naif logo and the existing X, LinkedIn, Snapchat, and Linktree icons.

All visible numbers use Latin digits. Date and time inputs use a custom Gregorian calendar and text fields, avoiding native browser date controls that can substitute Arabic-Indic digits.

Scoring normalization is adapted from AgentATS (MIT); see LICENSE-AgentATS.txt. Validation covers date parsing and leap dates, incomplete scoring, source privacy, JavaScript syntax, owner-only session grants, rejection of other-account signup, and rejection of invalid activation tokens.
