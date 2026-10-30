# MA France Trans — review and delivery 2.1

## Objective
Execute and track a 90-day marketing plan to win profitable return loads from Barcelona to Morocco. Madrid is a gated expansion decision; France follows confirmed capacity and owner approval. Operational and financial records support this objective. Targets are proposals, not actual results.

## Implemented
- Marketing-first home, 13 weekly action groups, 19 plan tasks plus two ongoing operations tasks; adjustable owners, dates, status and completion evidence.
- Hassan oversees priorities and commercial decisions; Faiza prioritizes drivers and vehicle availability, with approved time for prospecting; Saadia maintains financial follow-up.
- Extended prospects, dated contact history and quotes; editable multilingual copy. No automatic outreach or invented company contacts.
- Extended return-trip details, status and completion dates, load and equipment fields, total/empty distance, quote and booking references.
- Trip-linked invoices and expenses, partial payments, balances and separate EUR/MAD calculations. Margin is recorded revenue minus recorded expenses, before tax; incomplete costs are provisional. This is not certified accounting or audited net profit.
- Rolling 7/30-day activity comparisons, distinct companies contacted, outcomes, sent quotes and won clients based on recorded dates. Undated legacy data is not assigned fabricated dates.
- Recoverable deletion, local snapshots (up to five), validated JSON imports, local action history and conflict refusal when another tab changed saved data.
- Arabic RTL, French, Spanish and English; language changes preserve recorded data and copy drafts.

## Not activated
No central database, authentication, enforced per-user permissions, secure server audit, cross-device sync or remote backup. Declared editor names and approval statuses are records only, not authenticated authorization. Local snapshots share the same device failure risks as the primary data. noindex is not access control. Do not treat this release as a secure shared production system.

Backend activation requires an identified company-owned Firebase project, authorized management access, the three users' email addresses, an approved permission matrix and a selected backup/recovery policy. No passwords are requested. Security rules, identities, cross-device conflicts, backups and restores must be tested before group production use.

A separate commercial draft is retained in commercial/index.html, unlinked and noindex, pending confirmed company identity, contacts, services and owner approval. Its form only prepares copyable text; it does not deliver enquiries. Launch and SEO are deferred so the 90-day execution plan remains the priority.

## Verification
Automated: domain.test.cjs (currency separation, partial payments, trip margin, distinct contacts, period boundaries, dates/IDs/numbers); render.test.cjs (40 localized views, initial 21 tasks); storage.test.cjs (save, soft delete/restore, valid and invalid imports, snapshots, rollback and conflicting tab writes).
Browser: prospect creation, contact activity, sent quote, linked invoice and partial payment (2000 EUR invoice, 500 paid, 1500 outstanding); reload persistence; Arabic weekly plan and language switching; desktop dashboard focus and collapsed supporting finance.
No claim of exhaustive device coverage or backend/security verification. Cloud, multi-account and remote restore tests remain pending. QA records are browser-local and are not included in repository data.

## Design references
Organizational concepts informed by Frappe CRM, Atomic CRM and Plane. No application source from those repositories was integrated, and no claim of endorsement or accreditation is made. Company logo is the supplied reference. No unconfirmed fleet, certification, insurance or route claims are published.
