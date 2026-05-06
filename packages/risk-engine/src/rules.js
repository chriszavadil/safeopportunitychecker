export const RISK_RULES = Object.freeze([
  {
    id: "document_control",
    title: "Document or identity control",
    category: "control",
    severity: "critical",
    weight: 18,
    signals: [
      {
        label: "request to hold identity documents",
        pattern: /\b(?:hold|keep|take|retain|confiscate|store)\s+(?:your\s+)?(?:passport|id|identity documents?|visa|work permit)\b/i
      },
      {
        label: "identity documents described as held",
        pattern: /\b(?:passport|id|identity documents?|visa|work permit)\s+(?:will\s+be\s+)?(?:held|kept|retained|stored)\b/i
      }
    ],
    guidance: "Keep identity documents in your own control and verify requirements through independent official channels."
  },
  {
    id: "upfront_fees",
    title: "Upfront fee or deposit pressure",
    category: "money",
    severity: "high",
    weight: 14,
    signals: [
      {
        label: "fee requested before work or details",
        pattern: /\b(?:pay|send|wire|deposit)\s+(?:a\s+)?(?:fee|deposit|processing fee|visa fee|travel fee|placement fee|recruitment fee|training fee)\s+(?:first|upfront|before|to start|to proceed)\b/i
      },
      {
        label: "informal payment rail tied to fees",
        pattern: /\b(?:western union|moneygram|gift card|crypto|bitcoin)\b.*\b(?:fee|deposit|processing|visa|travel)\b/i
      }
    ],
    guidance: "Pause before sending money and verify the opportunity through trusted channels that do not depend on the sender."
  },
  {
    id: "debt_or_bond",
    title: "Debt, bond, or repayment control",
    category: "money",
    severity: "critical",
    weight: 18,
    signals: [
      {
        label: "debt must be worked off",
        pattern: /\b(?:debt|bond|loan)\b.*\b(?:work it off|repay|deducted from wages|owe us|cannot leave)\b/i
      },
      {
        label: "repayment tied to travel or placement",
        pattern: /\b(?:you owe|owe us|repay us)\b.*\b(?:travel|housing|training|visa|placement)\b/i
      }
    ],
    guidance: "Avoid agreements that make leaving dependent on repaying unclear or employer-controlled costs."
  },
  {
    id: "controlled_movement",
    title: "Movement restrictions",
    category: "control",
    severity: "critical",
    weight: 18,
    signals: [
      {
        label: "not allowed to leave or move freely",
        pattern: /\b(?:cannot|can't|must not|not allowed to)\s+(?:leave|go out|travel|move)\b/i
      },
      {
        label: "transport controlled by another person",
        pattern: /\b(?:escort|driver|manager)\s+(?:will|must)\s+(?:take|bring|move|transport)\s+you\b/i
      },
      {
        label: "must stay inside assigned place",
        pattern: /\b(?:stay|remain)\s+(?:inside|at)\s+(?:the house|housing|compound|site)\b/i
      }
    ],
    guidance: "Be cautious with any arrangement that limits your ability to leave, travel, or choose transportation."
  },
  {
    id: "controlled_housing_or_transport",
    title: "Housing or transport controlled by the offer",
    category: "dependency",
    severity: "medium",
    weight: 8,
    signals: [
      {
        label: "housing or transport controlled by offer source",
        pattern: /\b(?:housing|room|apartment|transport|ride)\s+(?:is|will be)\s+(?:provided|arranged|controlled)\s+by\s+(?:us|the employer|the agency|management)\b/i
      },
      {
        label: "must live where assigned",
        pattern: /\b(?:live|stay)\s+where\s+(?:we|the employer|the agency|management)\s+(?:tell|assign|place)\s+you\b/i
      }
    ],
    guidance: "Check whether you can choose where to live, leave freely, and arrange independent transportation."
  },
  {
    id: "isolation_or_contact_limits",
    title: "Isolation or contact limits",
    category: "control",
    severity: "critical",
    weight: 18,
    signals: [
      {
        label: "told not to contact trusted people",
        pattern: /\b(?:do not|don't|cannot|can't|must not)\s+(?:tell|contact|call|message)\s+(?:family|friends|anyone|others)\b/i
      },
      {
        label: "outside contact restricted",
        pattern: /\b(?:no visitors|no outside contact|keep away from family|limited phone access)\b/i
      }
    ],
    guidance: "Treat limits on contacting trusted people as a serious safety concern."
  },
  {
    id: "secrecy_or_evasion",
    title: "Secrecy or evasion requests",
    category: "verification",
    severity: "high",
    weight: 12,
    signals: [
      {
        label: "asked to keep details from officials or trusted people",
        pattern: /\b(?:keep this|do not mention|don't mention|say nothing|secret|confidential)\b.*\b(?:police|immigration|border|authorities|family|friends|employer)\b/i
      },
      {
        label: "asked to misstate purpose or identity",
        pattern: /\b(?:use a different name|say you are visiting|say you are a tourist|avoid questions)\b/i
      }
    ],
    guidance: "Independent verification is harder when an offer asks you to hide details or use a false explanation."
  },
  {
    id: "urgency_pressure",
    title: "Urgent pressure to decide, pay, travel, or send documents",
    category: "pressure",
    severity: "medium",
    weight: 7,
    signals: [
      {
        label: "urgent action tied to money, travel, or documents",
        pattern: /\b(?:urgent|immediately|today only|limited time|act now|right now|within\s+\d+\s+(?:hours|hrs|days))\b.*\b(?:send|pay|travel|decide|accept|documents?)\b/i
      },
      {
        label: "loss pressure",
        pattern: /\b(?:lose your spot|offer expires|last chance)\b/i
      }
    ],
    guidance: "Slow down before making irreversible commitments under time pressure."
  },
  {
    id: "unrealistic_pay",
    title: "Unusually high pay for vague or simple work",
    category: "verification",
    severity: "medium",
    weight: 7,
    signals: [
      {
        label: "high daily or weekly pay claim",
        pattern: /\b(?:earn|make|paid?)\s+(?:up to\s+)?(?:\$|usd\s*)?\d{3,6}\s*(?:per|\/)\s*(?:day|week)\b/i
      },
      {
        label: "no experience with high guaranteed income",
        pattern: /\b(?:no experience)\b.*\b(?:high pay|huge pay|guaranteed income|earn thousands)\b/i
      },
      {
        label: "large weekly pay for easy work",
        pattern: /\b(?:\$|usd\s*)?\d{4,6}\s*(?:weekly|per week)\b.*\b(?:no experience|easy work|simple work)\b/i
      }
    ],
    guidance: "Verify compensation, employer identity, work duties, and payment timing through independent sources."
  },
  {
    id: "sexualized_or_intimate_work",
    title: "Sexualized, intimate, or ambiguous personal-service expectations",
    category: "work_conditions",
    severity: "high",
    weight: 12,
    signals: [
      {
        label: "private client-facing intimate work language",
        pattern: /\b(?:escort|date|massage|hostess|model)\b.*\b(?:private|vip|clients?|men|customers?)\b/i
      },
      {
        label: "intimacy expectation",
        pattern: /\b(?:must be comfortable|expected)\s+(?:with\s+)?(?:intimacy|touching|dates?|private parties)\b/i
      }
    ],
    guidance: "Clarify duties, boundaries, pay, location, and the right to refuse before agreeing to private client-facing work."
  },
  {
    id: "age_or_minor_risk",
    title: "Age or minor-related concern",
    category: "eligibility",
    severity: "critical",
    weight: 20,
    signals: [
      {
        label: "minor or underage language",
        pattern: /\b(?:under\s*18|minor|teen|young girls?|young boys?|no id needed)\b/i
      },
      {
        label: "age checks dismissed",
        pattern: /\b(?:age does not matter|no age check)\b/i
      }
    ],
    guidance: "Do not proceed when age checks are dismissed or underage participation is suggested."
  },
  {
    id: "sensitive_data_request",
    title: "Sensitive data requested before verification",
    category: "privacy",
    severity: "high",
    weight: 12,
    signals: [
      {
        label: "sensitive identifier requested early",
        pattern: /\b(?:send|upload|share|provide)\s+(?:your\s+)?(?:ssn|social security|bank account|routing number|passport|id|visa|birth certificate)\b.*\b(?:before|first|immediately|to proceed|to reserve)\b/i
      },
      {
        label: "bank login or PIN requested",
        pattern: /\b(?:bank login|online banking password|pin number)\b/i
      }
    ],
    guidance: "Do not share sensitive identifiers or banking access until the need and recipient are independently verified."
  },
  {
    id: "off_platform_private_channel",
    title: "Move to private or disappearing messages",
    category: "verification",
    severity: "low",
    weight: 5,
    signals: [
      {
        label: "switch to private messaging",
        pattern: /\b(?:switch|move|continue)\s+(?:to|on)\s+(?:whatsapp|telegram|signal|wechat|snapchat)\b/i
      },
      {
        label: "delete or disappearing messages",
        pattern: /\b(?:delete (?:the )?messages|disappearing messages|vanish mode)\b/i
      }
    ],
    guidance: "Keep your own copies of important messages if it is safe and legal for you to do so."
  },
  {
    id: "wage_withholding",
    title: "Pay withheld or delayed by the offer source",
    category: "money",
    severity: "high",
    weight: 12,
    signals: [
      {
        label: "pay or wages held back",
        pattern: /\b(?:withhold|hold back|keep)\s+(?:your\s+)?(?:pay|wages|salary)\b/i
      },
      {
        label: "payment delayed until completion",
        pattern: /\b(?:paid after|payment after)\s+(?:you finish|the season|contract ends)\b/i
      },
      {
        label: "unpaid period before wages",
        pattern: /\b(?:no pay|unpaid)\s+(?:until|during)\s+(?:training|probation)\b/i
      }
    ],
    guidance: "Ask for clear written pay terms, timing, deductions, and what happens if you leave."
  },
  {
    id: "threats_or_penalties",
    title: "Threats, penalties, or retaliation language",
    category: "control",
    severity: "critical",
    weight: 20,
    signals: [
      {
        label: "penalty tied to leaving or asking questions",
        pattern: /\b(?:fine|penalty|punish|report you|blacklist|deport)\b.*\b(?:if|when)\s+you\s+(?:leave|quit|refuse|complain|ask questions)\b/i
      },
      {
        label: "harm, reporting, or blacklisting threat",
        pattern: /\b(?:we will|they will)\s+(?:hurt|harm|report|deport|blacklist)\s+you\b/i
      }
    ],
    guidance: "Prioritize immediate safety and trusted support if an offer uses threats or penalties to control choices."
  }
]);
