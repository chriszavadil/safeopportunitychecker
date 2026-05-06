# Codex Start Here

Start with the MVP risk checker:

1. Read the product and safety documents.
2. Keep the analyzer deterministic and dependency-light.
3. Implement pure analysis in `packages/risk-engine`.
4. Implement PII masking and safe summaries in `packages/redaction`.
5. Expose `POST /v1/analyze` in `apps/api`.
6. Validate successful analysis responses against `schema/analysis-result.schema.json`.
7. Add tests for every rule, score boundary, redaction behavior, and prompt-injection-like input.

Do not add storage, external services, crawling, identity resolution, or report-sending behavior.
