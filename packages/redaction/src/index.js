const DEFAULT_PREVIEW_CHARACTERS = 120;

const STATIC_PATTERNS = Object.freeze([
  {
    type: "email",
    replacement: "[EMAIL]",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
  },
  {
    type: "ssn",
    replacement: "[SSN]",
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g
  },
  {
    type: "phone",
    replacement: "[PHONE]",
    pattern: /(?<!\w)(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}(?!\w)/g
  },
  {
    type: "ip_address",
    replacement: "[IP_ADDRESS]",
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g
  },
  {
    type: "date_of_birth",
    replacement: "[DATE_OF_BIRTH]",
    pattern: /\b(?:dob|date of birth|birthdate)\s*[:#-]?\s*(?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4}|[A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4})\b/gi
  },
  {
    type: "government_id",
    replacement: "[GOV_ID]",
    pattern: /\b(?:passport|visa|driver'?s license|dl|tax id)\s*(?:number|#|no\.?)?\s*[:#-]\s*[A-Z0-9-]{5,20}\b/gi
  },
  {
    type: "street_address",
    replacement: "[ADDRESS]",
    pattern: /\b\d{1,6}\s+[A-Z0-9.'-]+(?:\s+[A-Z0-9.'-]+){0,4}\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Place|Pl)\b\.?/gi
  }
]);

const CARD_PATTERN = /\b(?:\d[ -]?){13,19}\b/g;

export function maskPii(text) {
  assertString(text);

  const findings = [];
  let redactedText = text;

  for (const piiPattern of STATIC_PATTERNS) {
    let count = 0;
    redactedText = redactedText.replace(piiPattern.pattern, () => {
      count += 1;
      return piiPattern.replacement;
    });

    if (count > 0) {
      findings.push({ type: piiPattern.type, count });
    }
  }

  let cardCount = 0;
  redactedText = redactedText.replace(CARD_PATTERN, (match) => {
    const digits = match.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19 || !passesLuhn(digits)) {
      return match;
    }

    cardCount += 1;
    return "[PAYMENT_CARD]";
  });

  if (cardCount > 0) {
    findings.push({ type: "payment_card", count: cardCount });
  }

  return {
    redactedText,
    findings,
    containsPii: findings.length > 0
  };
}

export function safeLogSummary(text, options = {}) {
  assertString(text);

  const includeRedactedPreview = options.includeRedactedPreview === true;
  const previewCharacters = Number.isInteger(options.previewCharacters)
    ? Math.max(0, Math.min(500, options.previewCharacters))
    : DEFAULT_PREVIEW_CHARACTERS;
  const { redactedText, findings } = maskPii(text);

  return {
    omittedRawInput: true,
    textCharacters: text.length,
    lineCount: countLines(text),
    approximateWordCount: countApproximateWords(text),
    piiFindingCounts: toFindingCounts(findings),
    redactedPreview: includeRedactedPreview ? redactedText.slice(0, previewCharacters) : null
  };
}

export function toFindingCounts(findings) {
  return findings.reduce((counts, finding) => {
    counts[finding.type] = (counts[finding.type] ?? 0) + finding.count;
    return counts;
  }, {});
}

function assertString(text) {
  if (typeof text !== "string") {
    throw new TypeError("Redaction input must be a string.");
  }
}

function countLines(text) {
  if (text.length === 0) {
    return 0;
  }

  return text.split(/\r\n|\r|\n/).length;
}

function countApproximateWords(text) {
  const words = text.trim().match(/\S+/g);
  return words ? words.length : 0;
}

function passesLuhn(digits) {
  let sum = 0;
  let doubleDigit = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let value = Number(digits[index]);
    if (doubleDigit) {
      value *= 2;
      if (value > 9) {
        value -= 9;
      }
    }

    sum += value;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}
