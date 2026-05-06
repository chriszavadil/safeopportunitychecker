# MVP Risk Checker Design

Architecture:

- `packages/risk-engine`: pure deterministic analysis functions.
- `packages/redaction`: deterministic PII masking and log-safe summaries.
- `apps/api`: dependency-free HTTP API.
- `schema`: analysis result JSON schema and local validator.

The MVP reserves structured fields for partner triage, consented evidence packaging, jurisdiction resource packs, and restricted pattern intelligence. These fields are metadata only and do not create referrals, storage, or restricted intelligence workflows.
