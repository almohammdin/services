# Hiring workspace

Static Arabic-first hiring workspace published at /services/hiring/.

Public source includes the application shell and a synthetic demo only. Candidate records must never be committed to this repository. Live records are stored in public.hiring_workspaces in the existing Supabase project, protected by row-level security and authenticated verified email ownership. The first update claims ownership with the authenticated user ID. Optimistic revision checks prevent overwriting another browser session.

Features: multiple advertisements and reusable templates; numbered bilingual candidates and source links; schedule proposals in Asia/Riyadh; manual qualification and pipeline stages; independent interview rounds with criterion snapshots, evidence, and reviewer recommendations; normalized complete-only weighted scores; local HTML and JSON export.

Scoring normalization adapted from AgentATS TalentRubric.gs (MIT). See LICENSE-AgentATS.txt. Workflow design references Odoo recruitment and Frappe HRMS. Interview guidance references OPM and CIPD.

Validation: JavaScript syntax, incomplete/complete/invalid scoring, Unicode and public-source privacy scan, and transactional RLS ownership/cross-account/anonymous/revision checks. Browser verification is performed on the published app and synthetic demo. Actual account confirmation and initial private-data import require the owner.
