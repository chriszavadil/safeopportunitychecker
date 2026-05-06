import test from "node:test";
import assert from "node:assert/strict";
import { maskPii, safeLogSummary } from "../src/index.js";

test("maskPii masks common PII patterns", () => {
  const input = [
    "Email alice@example.com",
    "Phone 202-555-0199",
    "SSN 000-00-0000",
    "Card 4111 1111 1111 1111",
    "IP 192.0.2.1",
    "DOB: 01/02/1990",
    "Passport number: A1234567",
    "Address 123 Main St"
  ].join("\n");

  const result = maskPii(input);
  assert.equal(result.containsPii, true);
  assert.equal(result.redactedText.includes("alice@example.com"), false);
  assert.equal(result.redactedText.includes("202-555-0199"), false);
  assert.equal(result.redactedText.includes("000-00-0000"), false);
  assert.equal(result.redactedText.includes("4111 1111 1111 1111"), false);
  assert.equal(result.redactedText.includes("192.0.2.1"), false);
  assert.equal(result.redactedText.includes("01/02/1990"), false);
  assert.equal(result.redactedText.includes("A1234567"), false);
  assert.equal(result.redactedText.includes("123 Main St"), false);

  const types = result.findings.map((finding) => finding.type).sort();
  assert.deepEqual(types, [
    "date_of_birth",
    "email",
    "government_id",
    "ip_address",
    "payment_card",
    "phone",
    "ssn",
    "street_address"
  ]);
});

test("safeLogSummary omits raw input and redacted preview by default", () => {
  const input = "Contact alice@example.com or 202-555-0199 about the job.";
  const summary = safeLogSummary(input);
  const serialized = JSON.stringify(summary);

  assert.equal(summary.omittedRawInput, true);
  assert.equal(summary.redactedPreview, null);
  assert.equal(serialized.includes("alice@example.com"), false);
  assert.equal(serialized.includes("202-555-0199"), false);
  assert.equal(summary.piiFindingCounts.email, 1);
  assert.equal(summary.piiFindingCounts.phone, 1);
});

test("safeLogSummary optional preview is redacted and bounded", () => {
  const summary = safeLogSummary("Email alice@example.com and then pay visa fee first.", {
    includeRedactedPreview: true,
    previewCharacters: 30
  });

  assert.equal(summary.redactedPreview.includes("alice@example.com"), false);
  assert.ok(summary.redactedPreview.includes("[EMAIL]"));
  assert.ok(summary.redactedPreview.length <= 30);
});

test("redaction rejects non-string input", () => {
  assert.throws(() => maskPii(null), /string/);
  assert.throws(() => safeLogSummary({ text: "hello" }), /string/);
});
