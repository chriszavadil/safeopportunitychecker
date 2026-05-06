import test from "node:test";
import assert from "node:assert/strict";
import { analyzeOpportunity } from "../packages/risk-engine/src/index.js";
import { validateAnalysisResult, validateJsonSchema } from "../schema/validate-analysis-result.js";

test("analysis output validates against schema/analysis-result.schema.json", () => {
  const result = analyzeOpportunity({
    text: "Pay visa fee first. We will keep your passport.",
    jurisdiction: "US",
    locale: "en-US"
  });
  const validation = validateAnalysisResult(result);

  assert.equal(validation.valid, true, validation.errors.join("\n"));
});

test("schema validation rejects additional output fields", () => {
  const result = analyzeOpportunity({ text: "Plain job listing." });
  const invalid = {
    ...result,
    rawText: "Plain job listing."
  };
  const validation = validateAnalysisResult(invalid);

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("$.rawText is not allowed")));
});

test("local JSON schema validator catches const and type violations", () => {
  const validation = validateJsonSchema(
    { enabled: true },
    {
      type: "object",
      additionalProperties: false,
      required: ["enabled"],
      properties: {
        enabled: { const: false }
      }
    }
  );

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("must equal false")));
});
