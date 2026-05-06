# Public Alpha Privacy Notice Draft

This draft describes the current MVP behavior. It is not a substitute for final legal review before a public launch.

## Current MVP Behavior

- Text submitted to the checker is processed in memory.
- The analysis response does not include the raw submitted text.
- The MVP does not intentionally store raw submissions.
- The MVP does not intentionally log raw submissions.
- The MVP does not use external AI providers.
- The MVP does not send automated reports to police, immigration, employers, platforms, partners, or support organizations.

## Hosting Caveat

A deployment platform or reverse proxy may keep request metadata such as timestamps, IP-derived metadata, user agent strings, or error logs. Do not deploy with request body logging enabled.

## User Safety Caveat

The tool cannot control browser extensions, shared devices, workplace monitoring, network monitoring, or screenshots. People should use a device and network they trust when possible.

## Before Public Launch

Add a reviewed privacy policy, terms, abuse contact route, and takedown process before promoting the tool beyond public alpha.
