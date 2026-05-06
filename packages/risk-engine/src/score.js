export const SCORE_MAX = 100;

export const SCORE_BOUNDARIES = Object.freeze([
  { level: "low", min: 0, max: 14 },
  { level: "caution", min: 15, max: 39 },
  { level: "elevated", min: 40, max: 69 },
  { level: "urgent", min: 70, max: 100 }
]);

export function clampScore(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(SCORE_MAX, Math.round(value)));
}

export function classifyScore(value) {
  const score = clampScore(value);
  const boundary = SCORE_BOUNDARIES.find((item) => score >= item.min && score <= item.max);
  return boundary?.level ?? "low";
}

export function scoreFromMatchedRules(matchedRules) {
  const rawScore = matchedRules.reduce((total, rule) => total + rule.weight, 0);
  return clampScore(rawScore);
}
