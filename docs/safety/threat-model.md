# Threat Model

## Assets

- User-submitted opportunity text.
- Analysis result integrity.
- Public repository trust.
- Safety-boundary clarity.

## MVP Trust Boundaries

- Browser to same-origin Node server.
- Node server to pure local packages.
- No database.
- No external AI provider.
- No partner or reporting integration.

## Primary Risks

- Private information accidentally committed to the public repo.
- Raw user input appearing in logs, errors, analytics, or browser storage.
- A change adding external enrichment, scraping, search, identification, or reporting.
- User-submitted text treated as instructions.
- User-facing language implying criminal findings.

## Controls

- `node scripts/safety-gate.js` checks for obvious secrets, non-reserved private examples, and weakened runtime boundaries.
- API responses do not include raw submitted text.
- Web UI does not use browser storage.
- API sends `cache-control: no-store`.
- Rate limiting uses ephemeral hashed client keys in memory only.
- Issue templates and PR templates warn against public private-data posting.

## Residual Risks

- Hosting providers may log request metadata.
- Browser extensions or local devices may observe user text.
- Regex-based gates cannot prove absence of all private data.
- Deterministic rules can miss or over-match indicators.
