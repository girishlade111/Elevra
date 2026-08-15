import type { CoachingIntent } from "./schemas";
import { COACHING_INTENTS } from "./schemas";

// ---------------------------------------------------------------------------
// Weighted Keyword Dictionaries for Local Intent Classification
// ---------------------------------------------------------------------------

interface KeywordRule {
  intent: CoachingIntent;
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

const INTENT_RULES: KeywordRule[] = [
  {
    intent: "salary",
    weight: 1.5,
    keywords: [
      "salary",
      "compensation",
      "pay raise",
      "raise",
      "counteroffer",
      "counter-offer",
      "equity",
      "rsus",
      "stock options",
      "bonus",
      "market rate",
      "underpaid",
      "negotiate an offer",
      "negotiate my offer",
      "negotiating pay",
      "asking for more money",
      "base pay",
      "total comp",
      "promotion package",
    ],
    patterns: [
      /\b(negotiat(e|ing)|ask(ing)? for)\b.*\b(raise|salary|compensation|equity|more money|pay)\b/i,
      /\b(how much|counter(\s|-)?offer|lowball(ed)?|comp review)\b/i,
    ],
  },
  {
    intent: "interview",
    weight: 1.5,
    keywords: [
      "interview",
      "interviewing",
      "interviewer",
      "behavioral round",
      "mock interview",
      "recruiter screen",
      "hiring manager",
      "panel interview",
      "star method",
      "tell me about yourself",
      "onsite",
      "on-site interview",
      "final round",
      "technical screen",
      "portfolio review",
      "case study interview",
    ],
    patterns: [
      /\b(interview|interviews|interviewing|interviewed)\b/i,
      /\b(prep(are|aring)? for|practice)\b.*\b(questions?|round|recruiter|panel)\b/i,
      /\b(tell me about yourself|weakness question|behavioral question)\b/i,
    ],
  },
  {
    intent: "career_change",
    weight: 1.4,
    keywords: [
      "career change",
      "career pivot",
      "pivot",
      "pivoting",
      "transitioning to",
      "transition into",
      "switching fields",
      "switch careers",
      "new industry",
      "transferable skills",
      "break into",
      "breaking into",
      "change tracks",
      "non-traditional background",
      "starting over",
      "reinvent my career",
    ],
    patterns: [
      /\b(pivot(ing)?|switch(ing)?|transition(ing)?)\b.*\b(career|industry|field|role|domain)\b/i,
      /\b(break into|breaking into)\b.*\b(tech|pm|leadership|consulting|new field)\b/i,
      /\btransferable skills?\b/i,
    ],
  },
  {
    intent: "leadership",
    weight: 1.3,
    keywords: [
      "leadership",
      "manage up",
      "managing up",
      "executive presence",
      "assertiveness",
      "assertive",
      "direct reports",
      "speaking up in meetings",
      "interrupted",
      "interrupted in meetings",
      "stakeholder management",
      "holding boundaries",
      "pushback",
      "push back on",
      "director",
      "team lead",
      "decision authority",
      "delegating",
      "delegation",
      "conflict with peer",
    ],
    patterns: [
      /\b(speak(ing)? up|hold(ing)? ground|assert(ive|iveness)?)\b.*\b(meeting|executives?|leadership|boss|stakeholder)\b/i,
      /\b(manag(e|ing) (up|people|a team)|direct reports?|executive presence)\b/i,
      /\b(interrupted|talked over|credit stolen)\b/i,
    ],
  },
  {
    intent: "confidence",
    weight: 1.3,
    keywords: [
      "imposter syndrome",
      "impostor syndrome",
      "self-doubt",
      "self doubt",
      "second-guessing",
      "second guessing",
      "feel like a fraud",
      "not qualified",
      "not good enough",
      "afraid to speak up",
      "hesitant",
      "hesitation",
      "intimidated",
      "confidence rating",
      "low confidence",
      "overthinking",
      "fear of failing",
      "fear of looking stupid",
      "anxious about speaking",
    ],
    patterns: [
      /\b(impost[eo]r syndrome|fraud|unqualified|not good enough)\b/i,
      /\b(second(\s|-)?guess(ing)?|self(\s|-)?doubt|insecure|intimidated)\b/i,
      /\b(build|gain|boost|lack)\b.*\bconfidence\b/i,
    ],
  },
  {
    intent: "balance",
    weight: 1.3,
    keywords: [
      "burnout",
      "burned out",
      "work-life balance",
      "work life balance",
      "overworking",
      "working 60 hours",
      "working weekends",
      "exhausted",
      "exhaustion",
      "overwhelmed",
      "guilt logging off",
      "after hours",
      "after-hours emails",
      "unsustainable",
      "drained",
      "setting boundaries with time",
      "too many hours",
      "rest",
    ],
    patterns: [
      /\b(burn(\s|-)?out|exhaust(ed|ion)|overwhelm(ed)?)\b/i,
      /\b(work(\s|-)?life balance|working late|weekend emails?)\b/i,
      /\b(log(ging)? off|disconnect(ing)?|sustainable pace)\b/i,
    ],
  },
];

export interface LocalIntentResult {
  intent: CoachingIntent;
  confidenceScore: number;
  isConfident: boolean;
  matchedRules: string[];
}

/**
 * Fast-path local keyword and regex scoring for intent detection.
 * Avoids latency and cost of LLM calls for obvious messages.
 */
export function detectIntentLocal(message: string): LocalIntentResult {
  if (!message || message.trim().length === 0) {
    return {
      intent: "general",
      confidenceScore: 0,
      isConfident: true,
      matchedRules: [],
    };
  }

  const normalized = message.toLowerCase();
  const scores: Record<CoachingIntent, number> = {
    salary: 0,
    interview: 0,
    career_change: 0,
    leadership: 0,
    confidence: 0,
    balance: 0,
    general: 0,
  };
  const matchedRulesMap: Record<CoachingIntent, string[]> = {
    salary: [],
    interview: [],
    career_change: [],
    leadership: [],
    confidence: [],
    balance: [],
    general: [],
  };

  for (const rule of INTENT_RULES) {
    // 1. Keyword check
    for (const keyword of rule.keywords) {
      if (normalized.includes(keyword)) {
        scores[rule.intent] += rule.weight;
        matchedRulesMap[rule.intent].push(`keyword:"${keyword}"`);
      }
    }

    // 2. Regex pattern check (higher precision)
    for (const pattern of rule.patterns) {
      if (pattern.test(normalized)) {
        scores[rule.intent] += rule.weight * 1.5;
        matchedRulesMap[rule.intent].push(`pattern:${pattern.source}`);
      }
    }
  }

  // Find top scoring category
  let topIntent: CoachingIntent = "general";
  let maxScore = 0;

  for (const intent of COACHING_INTENTS) {
    if (intent === "general") continue;
    const score = scores[intent];
    if (score > maxScore) {
      maxScore = score;
      topIntent = intent;
    }
  }

  // Confidence threshold: at least 1.3 score required for local classification
  const isConfident = maxScore >= 1.3;

  return {
    intent: isConfident ? topIntent : "general",
    confidenceScore: maxScore,
    isConfident,
    matchedRules: isConfident ? matchedRulesMap[topIntent] : [],
  };
}

/**
 * Lightweight prompt for fallback LLM intent classification
 */
export const FALLBACK_INTENT_SYSTEM_PROMPT = `Analyze the user message and classify it into EXACTLY ONE of the following 7 categories:
1. salary (compensation, raises, equity, offers, negotiation)
2. interview (interview prep, answering questions, behavioral/technical rounds)
3. career_change (pivoting fields, changing industries, transferable skills)
4. leadership (assertiveness, managing teams/stakeholders, speaking up in executive rooms)
5. confidence (imposter syndrome, self-doubt, fear of failure, second-guessing)
6. balance (work-life balance, burnout, overworking, after-hours boundaries)
7. general (broad career advice not fitting above categories)

Respond strictly with a JSON object: {"intent": "category_name"}`;
