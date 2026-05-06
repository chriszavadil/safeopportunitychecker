import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { analyzeOpportunity } from "../packages/risk-engine/src/index.js";

test("analysis metadata keeps MVP safety boundaries explicit", () => {
  const result = analyzeOpportunity({
    text: "Pay visa fee first. We will keep your passport.",
    jurisdiction: "US",
    locale: "en-US"
  });

  assert.equal(result.analyzer.externalAiUsed, false);
  assert.equal(result.analyzer.persistentStorageUsed, false);
  assert.equal(result.analyzer.rawInputLogged, false);

  for (const [key, value] of Object.entries(result.safety)) {
    assert.equal(value, true, `${key} should remain true`);
  }

  assert.equal(result.partnerTriage.automatedReferralCreated, false);
  assert.equal(result.evidencePackaging.rawInputStored, false);
  assert.equal(result.evidencePackaging.includedRawInput, false);
  assert.equal(result.restrictedPatternIntelligence.enabled, false);
  assert.equal(result.restrictedPatternIntelligence.used, false);
});

test("runtime source does not contain external client calls or persistence writes", () => {
  const runtimeFiles = listRuntimeFiles(process.cwd());
  const combined = runtimeFiles.map((file) => readFileSync(file, "utf8")).join("\n");

  assert.doesNotMatch(combined, /\bfetch\s*\(/);
  assert.doesNotMatch(combined, /\baxios\b/i);
  assert.doesNotMatch(combined, /\bopenai\b/i);
  assert.doesNotMatch(combined, /\bwriteFile(?:Sync)?\s*\(/);
  assert.doesNotMatch(combined, /\bappendFile(?:Sync)?\s*\(/);
  assert.doesNotMatch(combined, /\bcreateWriteStream\s*\(/);
  assert.doesNotMatch(combined, /\b(localStorage|sessionStorage|indexedDB)\b/);
});

function listRuntimeFiles(root) {
  const runtimeRoots = [
    join(root, "apps", "api", "src"),
    join(root, "packages", "risk-engine", "src"),
    join(root, "packages", "redaction", "src"),
    join(root, "schema")
  ];

  return runtimeRoots.flatMap((runtimeRoot) => walk(runtimeRoot))
    .filter((file) => file.endsWith(".js"));
}

function walk(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    return [path];
  }

  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}
