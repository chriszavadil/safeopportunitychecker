# Public Repository Gates

This repository is open source so communities can inspect, reuse, and improve survivor-safe opportunity checking. That openness only works if the public repo never becomes a place where private data, unsafe tactics, or accusation language can land.

## Gate 1: Privacy

Before commit, verify that the change contains no real:

- Names, phone numbers, emails, addresses, screenshots, notes, exports, or case records.
- Recruiter, employer, platform, police, immigration, hotline, partner, or survivor identifiers.
- Secrets, API keys, auth tokens, `.env` files, portal URLs, or private account details.

Use reserved examples from `CONTRIBUTING.md` only.

## Gate 2: Product Safety

Block any change that adds:

- External AI analysis of submitted text.
- Persistent storage of raw submissions.
- Raw input logging.
- Suspect search, doxxing, scraping, baiting, or facial recognition.
- Automated reports to police, immigration, employers, platforms, or partners.
- Criminal accusation language in results.

## Gate 3: Determinism

Risk analysis must be pure and deterministic. A rule may match submitted text; it must not enrich, investigate, browse, infer identity, or decide whether a person committed a crime.

## Gate 4: Consent and Future Architecture

Partner triage, evidence packaging, jurisdiction packs, and restricted pattern intelligence remain architecture lanes only until explicit consent, review, access control, and retention policies exist.

## Gate 5: CI

Every pull request must pass:

```powershell
node scripts/ci.js
```

Failures are release blockers, not advisory warnings.
