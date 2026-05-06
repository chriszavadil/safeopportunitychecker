import { RISK_RULES } from "./rules.js";
import { SCORE_BOUNDARIES, SCORE_MAX, classifyScore, scoreFromMatchedRules } from "./score.js";

export { RISK_RULES } from "./rules.js";
export { SCORE_BOUNDARIES, SCORE_MAX, classifyScore, scoreFromMatchedRules } from "./score.js";

export const MAX_TEXT_CHARACTERS = 20000;
export const ANALYSIS_SCHEMA_VERSION = "1.0.0";

const ANALYZER = Object.freeze({
  name: "safe-opportunity-checker-mvp",
  mode: "deterministic-rules",
  externalAiUsed: false,
  persistentStorageUsed: false,
  rawInputLogged: false
});

const SAFETY_BOUNDARIES = Object.freeze({
  noExternalAiCalls: true,
  noPersistentStorage: true,
  noRawInputLogging: true,
  noSuspectSearch: true,
  noDoxxing: true,
  noScraping: true,
  noBaiting: true,
  noFacialRecognition: true,
  noAutomatedReporting: true,
  noCriminalAccusationLanguage: true,
  userTextTreatedAsUntrusted: true
});

export function analyzeOpportunity(input) {
  assertAnalysisInput(input);

  const text = input.text;
  if (text.length > MAX_TEXT_CHARACTERS) {
    throw new RangeError(`Text exceeds ${MAX_TEXT_CHARACTERS} characters.`);
  }

  const searchableText = normalizeForSearch(text);
  const matchedRules = findMatchedRules(searchableText);
  const scoreValue = scoreFromMatchedRules(matchedRules);
  const level = classifyScore(scoreValue);
  const jurisdictionResourcePack = buildJurisdictionResourcePack(input.jurisdiction);

  return {
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    analyzer: ANALYZER,
    inputSummary: {
      textCharacters: text.length,
      wasTruncated: false,
      locale: normalizeLocale(input.locale),
      jurisdictionProvided: isNonEmptyString(input.jurisdiction)
    },
    score: {
      value: scoreValue,
      max: SCORE_MAX,
      level,
      boundaries: SCORE_BOUNDARIES
    },
    matchedRules,
    guidance: buildGuidance(level, matchedRules),
    partnerTriage: buildPartnerTriage(level),
    evidencePackaging: {
      status: "metadata_only_mvp",
      consentRequired: true,
      rawInputStored: false,
      includedRawInput: false
    },
    jurisdictionResourcePack,
    restrictedPatternIntelligence: {
      enabled: false,
      used: false,
      reason: "Disabled in the MVP; only deterministic public safety rules were applied."
    },
    safety: SAFETY_BOUNDARIES
  };
}

export function findMatchedRules(searchableText) {
  const text = normalizeForSearch(searchableText);

  return RISK_RULES.map((rule) => {
    const signals = rule.signals
      .filter((signal) => signal.pattern.test(text))
      .map((signal) => signal.label);

    if (signals.length === 0) {
      return null;
    }

    return {
      id: rule.id,
      title: rule.title,
      category: rule.category,
      severity: rule.severity,
      weight: rule.weight,
      signals,
      guidance: rule.guidance
    };
  }).filter(Boolean);
}

export function normalizeForSearch(text) {
  return String(text)
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function assertAnalysisInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Analysis input must be an object.");
  }

  if (typeof input.text !== "string") {
    throw new TypeError("Analysis input requires a text string.");
  }
}

function buildGuidance(level, matchedRules) {
  const matchedTitles = matchedRules.map((rule) => rule.title);
  const summaryByLevel = {
    low: "No major MVP risk indicators were found in the submitted text.",
    caution: "Some risk indicators were found. Slow down and verify before making commitments.",
    elevated: "Multiple or significant risk indicators were found. Consider trusted support before proceeding.",
    urgent: "Serious risk indicators were found. Prioritize your immediate safety and trusted support."
  };

  const nextSteps = [
    "Pause before sharing money, identity documents, location, travel plans, or banking access.",
    "Verify the organization, role, pay, address, and contact details through independent channels.",
    "Keep copies of messages in your own control if it is safe and legal for you to do so.",
    "Talk with a trusted person or local support service before making travel or housing commitments."
  ];

  if (level === "urgent") {
    nextSteps.unshift("If you feel in immediate danger, consider emergency services or a trusted local hotline only if it is safe for you.");
  }

  return {
    summary: summaryByLevel[level],
    matchedIndicatorTitles: matchedTitles,
    nextSteps,
    hotlineSuggestion: "Use local survivor support, labor rights, legal aid, or emergency resources only when it is safe for you.",
    disclaimer: "This tool provides deterministic safety indicators, not legal advice or investigative findings."
  };
}

function buildPartnerTriage(level) {
  const urgencyByLevel = {
    low: "routine",
    caution: "soon",
    elevated: "priority",
    urgent: "immediate_safety"
  };

  return {
    reviewSuggested: level !== "low",
    urgency: urgencyByLevel[level],
    consentRequired: true,
    automatedReferralCreated: false
  };
}

function buildJurisdictionResourcePack(jurisdiction) {
  const code = normalizeJurisdiction(jurisdiction);

  return {
    packId: `${code}-MVP`,
    status: "generic_mvp",
    emergencyRoutingEnabled: false
  };
}

function normalizeJurisdiction(jurisdiction) {
  if (!isNonEmptyString(jurisdiction)) {
    return "GLOBAL";
  }

  const normalized = jurisdiction.trim().toLowerCase();
  const known = new Map([
    ["us", "US"],
    ["usa", "US"],
    ["u.s.", "US"],
    ["united states", "US"],
    ["uk", "GB"],
    ["u.k.", "GB"],
    ["great britain", "GB"],
    ["united kingdom", "GB"],
    ["canada", "CA"],
    ["ca", "CA"],
    ["mexico", "MX"],
    ["mx", "MX"]
  ]);

  if (known.has(normalized)) {
    return known.get(normalized);
  }

  const cleaned = jurisdiction
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return cleaned || "GLOBAL";
}

function normalizeLocale(locale) {
  if (!isNonEmptyString(locale)) {
    return "und";
  }

  const trimmed = locale.trim();
  return /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(trimmed) ? trimmed : "und";
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}
