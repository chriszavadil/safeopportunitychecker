import { createServer as createHttpServer } from "node:http";
import { pathToFileURL } from "node:url";
import { analyzeOpportunity, MAX_TEXT_CHARACTERS } from "../../../packages/risk-engine/src/index.js";
import { safeLogSummary } from "../../../packages/redaction/src/index.js";
import { assertValidAnalysisResult } from "../../../schema/validate-analysis-result.js";

const DEFAULT_PORT = 3000;
const MAX_BODY_BYTES = 64 * 1024;

export function createAnalysisApiServer(options = {}) {
  const onSafeRequestSummary = typeof options.onSafeRequestSummary === "function"
    ? options.onSafeRequestSummary
    : null;

  return createHttpServer(async (request, response) => {
    try {
      await routeRequest(request, response, onSafeRequestSummary);
    } catch (error) {
      sendError(response, 500, "internal_error", "The request could not be completed.");
    }
  });
}

async function routeRequest(request, response, onSafeRequestSummary) {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "GET" && url.pathname === "/healthz") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method !== "POST" || url.pathname !== "/v1/analyze") {
    sendError(response, 404, "not_found", "Route not found.");
    return;
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

  if (onSafeRequestSummary) {
    onSafeRequestSummary(safeLogSummary(payload.text));
  }

  const result = analyzeOpportunity({
    text: payload.text,
    jurisdiction: payload.jurisdiction,
    locale: payload.locale
  });

  assertValidAnalysisResult(result);
  sendJson(response, 200, result);
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
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(body)
  });
  response.end(body);
}

function sendError(response, statusCode, code, message) {
  sendJson(response, statusCode, {
    error: {
      code,
      message
    }
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const server = createAnalysisApiServer();
  server.listen(port, () => {
    console.log(`Safe Opportunity Checker API listening on http://localhost:${port}`);
  });
}
