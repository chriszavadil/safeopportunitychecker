# Data Classification

User-submitted opportunity text may contain sensitive personal data. It is classified as untrusted and sensitive.

MVP handling:

- Analyze in memory only.
- Do not persist raw input.
- Do not log raw input.
- Mask common PII patterns before any optional human-readable summary.
- Do not return raw text in analysis results.
