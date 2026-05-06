# Repository Settings Checklist

These settings cannot be fully enforced from source code, but they should be enabled before inviting outside contributors.

## Branch Protection

Protect `main`:

- Require pull requests before merge.
- Require status checks to pass.
- Require the `Safety Gate` workflow.
- Require the `CodeQL` workflow once it has run successfully on `main`.
- Require conversation resolution.
- Block force pushes.
- Block branch deletion.

## GitHub Security

Enable:

- Secret scanning.
- Push protection for secrets.
- Dependabot alerts.
- Code scanning when the repository adds dependencies or compiled languages.

## Public Issue Hygiene

Keep blank issues disabled. Use issue forms that require the public privacy check. Move any report containing private information out of public issues immediately and remove the public content.

## Maintainer Practice

- Never ask for survivor details in public.
- Never request screenshots, logs, exports, or case notes in public.
- Never accept a pull request that adds real-world identifying examples.
- Prefer synthetic fixtures and reserved examples.
