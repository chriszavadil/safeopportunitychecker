import test from "node:test";
import assert from "node:assert/strict";
import {
  RISK_RULES,
  analyzeOpportunity,
  classifyScore,
  scoreFromMatchedRules
} from "../src/index.js";

const RULE_SAMPLES = Object.freeze({
  document_control: "We will keep your passport during the job.",
  upfront_fees: "Please pay visa fee first to proceed.",
  debt_or_bond: "The travel loan is deducted from wages and you cannot leave.",
  controlled_movement: "You are not allowed to leave the site.",
  controlled_housing_or_transport: "Housing will be provided by the employer.",
  isolation_or_contact_limits: "Do not contact family about this offer.",
  secrecy_or_evasion: "Keep this secret from immigration and family.",
  urgency_pressure: "Urgent, send documents today or lose your spot.",
  unrealistic_pay: "Earn $500 per day with simple work.",
  sexualized_or_intimate_work: "Hostess work with private VIP clients.",
  age_or_minor_risk: "Teen applicants welcome, no id needed.",
  sensitive_data_request: "Send your bank account first to proceed.",
  off_platform_private_channel: "Move to Telegram and delete messages.",
  wage_withholding: "We hold back your wages until the season ends.",
  threats_or_penalties: "We will blacklist you if you leave."
});

test("every configured rule has a synthetic coverage sample", () => {
  const ruleIds = RISK_RULES.map((rule) => rule.id).sort();
  const sampleIds = Object.keys(RULE_SAMPLES).sort();
  assert.deepEqual(sampleIds, ruleIds);
});

for (const [ruleId, sample] of Object.entries(RULE_SAMPLES)) {
  test(`rule ${ruleId} is detected`, () => {
    const result = analyzeOpportunity({ text: sample, jurisdiction: "US", locale: "en-US" });
    const matchedIds = result.matchedRules.map((rule) => rule.id);
    assert.ok(matchedIds.includes(ruleId), `Expected ${ruleId}; matched ${matchedIds.join(", ")}`);
  });
}

test("score classification boundaries are exact", () => {
  assert.equal(classifyScore(0), "low");
  assert.equal(classifyScore(14), "low");
  assert.equal(classifyScore(15), "caution");
  assert.equal(classifyScore(39), "caution");
  assert.equal(classifyScore(40), "elevated");
  assert.equal(classifyScore(69), "elevated");
  assert.equal(classifyScore(70), "urgent");
  assert.equal(classifyScore(100), "urgent");
});

test("score is capped to the schema maximum", () => {
  const score = scoreFromMatchedRules([
    { weight: 50 },
    { weight: 50 },
    { weight: 50 }
  ]);
  assert.equal(score, 100);
});

test("low-risk text does not create a review suggestion", () => {
  const result = analyzeOpportunity({
    text: "The public library is hiring a part-time assistant. Apply through the city website.",
    jurisdiction: "US",
    locale: "en-US"
  });

  assert.equal(result.score.value, 0);
  assert.equal(result.score.level, "low");
  assert.equal(result.partnerTriage.reviewSuggested, false);
  assert.deepEqual(result.matchedRules, []);
});

test("analysis result does not echo raw submitted text", () => {
  const rawEmail = "private.person@example.com";
  const rawPhone = "202-555-0199";
  const result = analyzeOpportunity({
    text: `${rawEmail} ${rawPhone} We will keep your passport.`,
    jurisdiction: "US",
    locale: "en-US"
  });
  const serialized = JSON.stringify(result);

  assert.equal(serialized.includes(rawEmail), false);
  assert.equal(serialized.includes(rawPhone), false);
  assert.equal(serialized.includes("We will keep your passport"), false);
});

test("jurisdiction pack is normalized without enabling emergency routing", () => {
  const result = analyzeOpportunity({
    text: "Standard retail shift listing.",
    jurisdiction: "United States",
    locale: "en-US"
  });

  assert.equal(result.jurisdictionResourcePack.packId, "US-MVP");
  assert.equal(result.jurisdictionResourcePack.status, "generic_mvp");
  assert.equal(result.jurisdictionResourcePack.emergencyRoutingEnabled, false);
});
