import { createServer as createHttpServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { analyzeOpportunity, MAX_TEXT_CHARACTERS } from "../../../packages/risk-engine/src/index.js";
import { safeLogSummary } from "../../../packages/redaction/src/index.js";
import { assertValidAnalysisResult } from "../../../schema/validate-analysis-result.js";

const DEFAULT_PORT = 3000;
const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_RATE_LIMIT = Object.freeze({
  limit: 60,
  windowMs: 60_000
});
const WEB_ROOT = normalize(fileURLToPath(new URL("../../../apps/web", import.meta.url)));
const STATIC_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
});

export function createAnalysisApiServer(options = {}) {
  const onSafeRequestSummary = typeof options.onSafeRequestSummary === "function"
    ? options.onSafeRequestSummary
    : null;
  const rateLimiter = options.rateLimit === false
    ? null
    : createEphemeralRateLimiter(options.rateLimit ?? DEFAULT_RATE_LIMIT);

  return createHttpServer(async (request, response) => {
    try {
      applyBaseHeaders(response);
      await routeRequest(request, response, {
        onSafeRequestSummary,
        rateLimiter
      });
    } catch (error) {
      sendError(response, 500, "internal_error", "The request could not be completed.");
    }
  });
}

async function routeRequest(request, response, context) {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "GET" && url.pathname === "/healthz") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && (url.pathname === "/" || url.pathname.startsWith("/assets/"))) {
    await serveStaticAsset(url.pathname, response);
    return;
  }

  if (request.method === "OPTIONS" && url.pathname === "/v1/analyze") {
    sendEmpty(response, 204);
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/v1/analyze") {
    sendError(response, 404, "not_found", "Route not found.");
    return;
  }

  if (context.rateLimiter) {
    const rateLimit = context.rateLimiter.check(request);
    response.setHeader("ratelimit-limit", String(rateLimit.limit));
    response.setHeader("ratelimit-remaining", String(rateLimit.remaining));
    response.setHeader("ratelimit-reset", String(Math.ceil(rateLimit.resetMs / 1000)));

    if (!rateLimit.allowed) {
      response.setHeader("retry-after", String(Math.ceil(rateLimit.resetMs / 1000)));
      sendError(response, 429, "rate_limited", "Too many requests. Please wait and try again.");
      return;
    }
  }

  const bodyResult = await readJsonBody(request);
  if (bodyResult.tooLarge) {
    sendError(response, 413, "payload_too_large", `Request body must be at most ${MAX_BODY_BYTES} bytes.`);
    return;
  }

  if (bodyResult.error) {
    sendError(response, 400, "invalid_json", "Request body must be valid JSON.");
    return;
  }

  const payload = bodyResult.value;
  const validationError = validateAnalyzePayload(payload);
  if (validationError) {
    sendError(response, validationError.status, validationError.code, validationError.message);
    return;
  }

  if (context.onSafeRequestSummary) {
    context.onSafeRequestSummary(safeLogSummary(payload.text));
  }

  const result = analyzeOpportunity({
    text: payload.text,
    jurisdiction: payload.jurisdiction,
    locale: payload.locale
  });

  assertValidAnalysisResult(result);
  sendJson(response, 200, result);
}

async function serveStaticAsset(pathname, response) {
  const assetPath = pathname === "/" ? "/index.html" : pathname;
  const normalizedAssetPath = normalize(assetPath).replace(/^([/\\])+/, "");
  const absolutePath = normalize(join(WEB_ROOT, normalizedAssetPath));
  const rel = relative(WEB_ROOT, absolutePath);

  if (rel.startsWith("..") || rel.includes(`..${sep}`)) {
    sendError(response, 404, "not_found", "Route not found.");
    return;
  }

  try {
    const body = await readFile(absolutePath);
    const type = STATIC_TYPES[extname(absolutePath).toLowerCase()] ?? "application/octet-stream";
    sendBytes(response, 200, body, type);
  } catch {
    sendError(response, 404, "not_found", "Route not found.");
  }
}

function validateAnalyzePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { status: 400, code: "invalid_payload", message: "Request body must be a JSON object." };
  }

  if (typeof payload.text !== "string") {
    return { status: 400, code: "invalid_text", message: "Field 'text' must be a string." };
  }

  if (payload.text.length > MAX_TEXT_CHARACTERS) {
    return {
      status: 413,
      code: "text_too_large",
      message: `Field 'text' must be at most ${MAX_TEXT_CHARACTERS} characters.`
    };
  }

  if (Object.hasOwn(payload, "jurisdiction") && typeof payload.jurisdiction !== "string") {
    return { status: 400, code: "invalid_jurisdiction", message: "Field 'jurisdiction' must be a string when provided." };
  }

  if (Object.hasOwn(payload, "locale") && typeof payload.locale !== "string") {
    return { status: 400, code: "invalid_locale", message: "Field 'locale' must be a string when provided." };
  }

  return null;
}

function readJsonBody(request) {
  return new Promise((resolve) => {
    let body = "";
    let bytes = 0;
    let tooLarge = false;

    request.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        tooLarge = true;
        return;
      }

      body += chunk;
    });

    request.on("end", () => {
      if (tooLarge) {
        resolve({ tooLarge: true });
        return;
      }

      try {
        resolve({ value: body.length > 0 ? JSON.parse(body) : null });
      } catch {
        resolve({ error: true });
      }
    });

    request.on("error", () => {
      resolve({ error: true });
    });
  });
}

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}

function sendBytes(response, statusCode, body, contentType) {
  response.writeHead(statusCode, {
    "content-type": contentType,
    "content-length": body.byteLength
  });
  response.end(body);
}

function sendEmpty(response, statusCode) {
  response.writeHead(statusCode);
  response.end();
}

function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, {
    error: {
      code,
      message
    }
  });
}

function applyBaseHeaders(response) {
  response.setHeader("cache-control", "no-store");
  response.setHeader("cross-origin-opener-policy", "same-origin");
  response.setHeader("referrer-policy", "no-referrer");
  response.setHeader("x-content-type-options", "nosniff");
  response.setHeader("x-frame-options", "DENY");
  response.setHeader("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.setHeader(
    "content-security-policy",
    "default-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:"
  );
}

function createEphemeralRateLimiter(options) {
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : DEFAULT_RATE_LIMIT.limit;
  const windowMs = Number.isInteger(options.windowMs) && options.windowMs > 0 ? options.windowMs : DEFAULT_RATE_LIMIT.windowMs;
  const salt = randomBytes(32).toString("hex");
  const buckets = new Map();

  return {
    check(request) {
      const now = Date.now();
      const key = hashedClientKey(request, salt);
      const existing = buckets.get(key);

      if (!existing || existing.resetAt <= now) {
        buckets.set(key, {
          count: 1,
          resetAt: now + windowMs
        });
        cleanupExpiredBuckets(buckets, now);

        return {
          allowed: true,
          limit,
          remaining: limit - 1,
          resetMs: windowMs
        };
      }

      existing.count += 1;
      const allowed = existing.count <= limit;

      return {
        allowed,
        limit,
        remaining: Math.max(0, limit - existing.count),
        resetMs: Math.max(0, existing.resetAt - now)
      };
    }
  };
}

function hashedClientKey(request, salt) {
  const remoteAddress = request.socket.remoteAddress ?? "unknown";
  return createHash("sha256")
    .update(salt)
    .update(remoteAddress)
    .digest("hex");
}

function cleanupExpiredBuckets(buckets, now) {
  if (buckets.size < 5000) {
    return;
  }

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const server = createAnalysisApiServer();
  server.requestTimeout = 15_000;
  server.headersTimeout = 16_000;
  server.listen(port, () => {
    console.log(`Safe Opportunity Checker API listening on http://localhost:${port}`);
  });
}
