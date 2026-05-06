import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

test("web UI does not use browser persistence or external requests", () => {
  const files = walk(join(process.cwd(), "apps", "web"))
    .filter((file) => /\.(?:html|css|js)$/i.test(file));
  const combined = files.map((file) => readFileSync(file, "utf8")).join("\n");

  assert.doesNotMatch(combined, /\b(?:localStorage|sessionStorage|indexedDB)\b/);
  assert.doesNotMatch(combined, /\bfetch\s*\(\s*["']https?:\/\//i);
  assert.match(combined, /fetch\("\/v1\/analyze"/);
});

function walk(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    return [path];
  }

  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}
