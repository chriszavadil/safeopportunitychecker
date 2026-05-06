# MVP Risk Checker Requirements

- Analyze user-provided opportunity text with deterministic rules only.
- Return non-accusatory risk indicators, score, guidance, and safety boundary metadata.
- Do not store or log raw user text.
- Provide PII masking and safe log summaries.
- Expose `POST /v1/analyze`.
- Ensure successful output validates against `schema/analysis-result.schema.json`.
- Cover each rule, score boundary, redaction behavior, and prompt-injection-like input with tests.
