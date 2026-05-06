# Contributing

Safe Opportunity Checker is public, survivor-safe infrastructure. Contributions are welcome when they preserve these gates.

## Required Gates

Run before opening a pull request:

```powershell
node scripts/ci.js
```

Do not commit:

- Real survivor, witness, recruiter, employer, platform, police, immigration, or partner information.
- Screenshots, exports, logs, emails, phone numbers, addresses, names, case notes, or portal records from real people or organizations.
- Secrets, tokens, keys, `.env` files, credentials, private URLs, or internal account identifiers.
- Code that searches for suspects, identifies people, scrapes sources, baits anyone, performs facial recognition, or sends automated reports.

Use reserved examples only:

- Emails: `person@example.com`.
- Phone numbers: `202-555-0100` through `202-555-0199`.
- IP addresses: `192.0.2.0/24`, `198.51.100.0/24`, or `203.0.113.0/24`.
- Payment cards: official provider test numbers only.

## Pull Request Expectations

Every pull request should explain:

- Which safety boundary it touches, if any.
- Whether user-submitted text is handled.
- Whether any logs, storage, network calls, or external services were added.
- How the change was tested.

If a change adds a new risk rule, include a synthetic fixture and a short non-accusatory guidance string.

The CI command is just `node --test` followed by `node scripts/safety-gate.js`; running the wrapper keeps it portable across shells.
