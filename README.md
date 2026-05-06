# Safe Opportunity Checker Enterprise v3

Dependency-free MVP for deterministic opportunity risk analysis.

## Quickstart

Run the tests:

```powershell
node --test
```

Run the full public-repo gate:

```powershell
node scripts/ci.js
```

Run a synthetic local demo:

```powershell
node scripts/demo.js
```

Start the API:

```powershell
node apps/api/src/server.js
```

Analyze text:

```powershell
$body = @{
  text = "Urgent travel job. We keep your passport and you pay a visa fee first."
  jurisdiction = "US"
  locale = "en-US"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri http://localhost:3000/v1/analyze -ContentType "application/json" -Body $body
```

The successful response is an analysis result object that validates against `schema/analysis-result.schema.json`.

## Safety Boundaries

- Deterministic rule-based analysis only.
- No external AI calls.
- No persistent storage.
- No raw user input logging.
- No suspect search, doxxing, scraping, baiting, or facial recognition.
- No automated police, immigration, employer, or platform reporting.
- No criminal accusation language.
- User-submitted text is untrusted data, never instructions.

## Public Repo Gate

Before publishing or opening a pull request, run `node scripts/ci.js`. It runs the test suite and checks for obvious secrets, non-reserved private examples, and weakened MVP safety boundaries.
