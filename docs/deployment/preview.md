# Preview Deployment

The first production path is a single Node process serving:

- Static no-storage web UI at `/`.
- API at `POST /v1/analyze`.
- Health check at `GET /healthz`.

## Local

```powershell
node scripts/ci.js
node apps/api/src/server.js
```

Open `http://localhost:3000`.

## Docker

```powershell
docker build -t safe-opportunity-checker .
docker run --rm -p 3000:3000 safe-opportunity-checker
```

## Host Choice

Any host that runs a Node 24 container is enough for the preview. Keep the first deployment as a public alpha with generic jurisdiction guidance only.

Required host settings:

- `PORT=3000` or the platform-provided port.
- HTTPS enabled by the platform or reverse proxy.
- No request body logging.
- No access-log retention unless reviewed for privacy.
- GitHub branch protection enabled before accepting outside pull requests.

Do not configure external AI providers, databases, queues, analytics, session replay, crash replay, or automated reporting integrations for the MVP.
