import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();

const SKIPPED_DIRS = new Set([
  ".git",
  ".idea",
  ".vscode",
  "coverage",
  "dist",
  "build",
  "node_modules",
  "tmp",
  "temp"
]);

const TEXT_EXTENSIONS = new Set([
  "",
  ".cjs",
  ".css",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt",
  ".yml",
  ".yaml"
]);

const FORBIDDEN_FILENAMES = [
  /^\.env(?:\..*)?$/i,
  /^id_rsa$/i,
  /^id_ed25519$/i,
  /.+\.(?:pem|key|p12|pfx)$/i
];

const SECRET_PATTERNS = [
  { label: "private key block", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { label: "OpenAI API key", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  { label: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/ },
  { label: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: "Slack token", pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  { label: "Stripe secret key", pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/ },
  { label: "credentialed database URL", pattern: /\b(?:postgres|postgresql|mysql|mongodb):\/\/[^:\s/]+:[^@\s/]+@/i }
];

const FORBIDDEN_RUNTIME_PATTERNS = [
  { label: "external fetch call", pattern: /\bfetch\s*\(/ },
  { label: "axios client", pattern: /\baxios\b/i },
  { label: "OpenAI client reference", pattern: /\bopenai\b/i },
  { label: "filesystem write", pattern: /\b(?:writeFile|appendFile)(?:Sync)?\s*\(/ },
  { label: "write stream", pattern: /\bcreateWriteStream\s*\(/ },
  { label: "browser storage", pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/ },
  { label: "safety boundary set false", pattern: /\bno(?:ExternalAiCalls|PersistentStorage|RawInputLogging|SuspectSearch|Doxxing|Scraping|Baiting|FacialRecognition|AutomatedReporting|CriminalAccusationLanguage)\s*:\s*false\b/ },
  { label: "unsafe capability marked used", pattern: /\b(?:externalAiUsed|persistentStorageUsed|rawInputLogged|automatedReferralCreated|rawInputStored|includedRawInput|emergencyRoutingEnabled)\s*:\s*true\b/ }
];

const FORBIDDEN_BROWSER_PATTERNS = [
  { label: "browser storage", pattern: /\b(?:localStorage|sessionStorage|indexedDB)\b/ },
  { label: "external browser request", pattern: /\bfetch\s*\(\s*["']https?:\/\//i }
];

const ALLOWED_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "test.invalid"
]);

const ALLOWED_EXACT_IPS = new Set([
  "0.0.0.0",
  "127.0.0.1"
]);

const findings = [];
const files = walk(ROOT);

for (const file of files) {
  const rel = toRepoPath(file);
  const name = rel.split("/").at(-1);

  if (FORBIDDEN_FILENAMES.some((pattern) => pattern.test(name)) && name !== ".env.example") {
    addFinding(rel, 1, "forbidden private or secret-like filename");
    continue;
  }

  if (!isTextFile(file)) {
    continue;
  }

  const text = readFileSync(file, "utf8");
  scanSecrets(rel, text);
  scanPublicPiiExamples(rel, text);

  if (isRuntimeFile(rel)) {
    scanRuntimeBoundaries(rel, text);
  }

  if (isBrowserFile(rel)) {
    scanBrowserBoundaries(rel, text);
  }
}

if (findings.length > 0) {
  console.error("Safety gate failed:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.reason}`);
  }
  process.exitCode = 1;
} else {
  console.log("Safety gate passed: no obvious secrets, private examples, or weakened MVP boundaries found.");
}

function scanSecrets(file, text) {
  for (const { label, pattern } of SECRET_PATTERNS) {
    reportMatches(file, text, pattern, label);
  }
}

function scanRuntimeBoundaries(file, text) {
  for (const { label, pattern } of FORBIDDEN_RUNTIME_PATTERNS) {
    reportMatches(file, text, pattern, label);
  }
}

function scanBrowserBoundaries(file, text) {
  for (const { label, pattern } of FORBIDDEN_BROWSER_PATTERNS) {
    reportMatches(file, text, pattern, label);
  }
}

function scanPublicPiiExamples(file, text) {
  reportMatches(file, text, /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi, "non-reserved email example", (match) => {
    const domain = match.split("@").at(-1).toLowerCase();
    return !ALLOWED_EMAIL_DOMAINS.has(domain);
  });

  reportMatches(file, text, /(?<!\w)(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\w)/g, "non-reserved phone example", (match) => {
    const digits = match.replace(/\D/g, "");
    const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
    return !/^2\d{2}55501\d{2}$/.test(local);
  });

  reportMatches(file, text, /\b\d{3}-\d{2}-\d{4}\b/g, "non-placeholder SSN-like example", (match) => {
    return match !== "000-00-0000";
  });

  reportMatches(file, text, /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g, "non-reserved IP address example", (match) => {
    return !ALLOWED_EXACT_IPS.has(match)
      && !/^(?:192\.0\.2|198\.51\.100|203\.0\.113)\.\d{1,3}$/.test(match);
  });
}

function reportMatches(file, text, pattern, reason, shouldReport = () => true) {
  const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  for (const match of text.matchAll(regex)) {
    if (shouldReport(match[0])) {
      addFinding(file, lineNumberForIndex(text, match.index ?? 0), reason);
    }
  }
}

function addFinding(file, line, reason) {
  findings.push({ file, line, reason });
}

function isRuntimeFile(rel) {
  return rel.startsWith("apps/api/src/")
    || rel.startsWith("packages/risk-engine/src/")
    || rel.startsWith("packages/redaction/src/")
    || rel.startsWith("schema/");
}

function isBrowserFile(rel) {
  return rel.startsWith("apps/web/");
}

function isTextFile(file) {
  const name = file.split(/[\\/]/).at(-1);
  const index = name.lastIndexOf(".");
  const extension = index === -1 ? "" : name.slice(index).toLowerCase();
  return TEXT_EXTENSIONS.has(extension);
}

function lineNumberForIndex(text, index) {
  return text.slice(0, index).split(/\r\n|\r|\n/).length;
}

function toRepoPath(path) {
  return relative(ROOT, path).split(sep).join("/");
}

function walk(path) {
  const stat = statSync(path);
  if (stat.isFile()) {
    return [path];
  }

  const entries = readdirSync(path);
  return entries.flatMap((entry) => {
    if (SKIPPED_DIRS.has(entry)) {
      return [];
    }

    return walk(join(path, entry));
  });
}
