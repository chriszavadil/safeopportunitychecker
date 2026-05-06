import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createAnalysisApiServer } from "../src/server.js";
import { validateAnalysisResult } from "../../../schema/validate-analysis-result.js";

test("POST /v1/analyze returns a schema-valid analysis result", async () => {
  const safeSummaries = [];
  const server = createAnalysisApiServer({
    onSafeRequestSummary(summary) {
      safeSummaries.push(summary);
    }
  });

  server.listen(0);
  await once(server, "listening");

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/v1/analyze`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        text: "Contact alice@example.com. We will keep your passport and you must not tell family.",
        jurisdiction: "US",
        locale: "en-US"
      })
    });

    assert.equal(response.status, 200);
    const result = await response.json();
    const validation = validateAnalysisResult(result);
    assert.equal(validation.valid, true, validation.errors.join("\n"));
    assert.equal(result.analyzer.externalAiUsed, false);
    assert.equal(result.analyzer.persistentStorageUsed, false);
    assert.equal(result.analyzer.rawInputLogged, false);
    assert.equal(JSON.stringify(result).includes("alice@example.com"), false);
    assert.equal(safeSummaries.length, 1);
    assert.equal(safeSummaries[0].omittedRawInput, true);
    assert.equal(safeSummaries[0].redactedPreview, null);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("POST /v1/analyze rejects invalid JSON without echoing body", async () => {
  const server = createAnalysisApiServer();
  server.listen(0);
  await once(server, "listening");

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/v1/analyze`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: "{not json with private.person@example.com"
    });

    const body = await response.text();
    assert.equal(response.status, 400);
    assert.equal(body.includes("private.person@example.com"), false);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("GET / serves the no-storage web UI with security headers", async () => {
  const server = createAnalysisApiServer({ rateLimit: false });
  server.listen(0);
  await once(server, "listening");

  try {
    const port = server.address().port;
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const body = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
    assert.match(body, /Safe Opportunity Checker/);
    assert.doesNotMatch(body, /localStorage|sessionStorage|indexedDB/);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("POST /v1/analyze applies an ephemeral in-memory rate limit", async () => {
  const server = createAnalysisApiServer({
    rateLimit: {
      limit: 1,
      windowMs: 60_000
    }
  });
  server.listen(0);
  await once(server, "listening");

  try {
    const port = server.address().port;
    const request = () => fetch(`http://127.0.0.1:${port}/v1/analyze`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        text: "Pay visa fee first.",
        jurisdiction: "GLOBAL",
        locale: "en-US"
      })
    });

    const first = await request();
    const second = await request();
    const body = await second.text();

    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.equal(body.includes("Pay visa fee first"), false);
    assert.equal(second.headers.get("ratelimit-limit"), "1");
  } finally {
    server.close();
    await once(server, "close");
  }
});
