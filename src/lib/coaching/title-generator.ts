import { type CoachingIntent } from "@/lib/ai/schemas";

/**
 * Common prefixes to strip when generating clean conversation titles from user prompts
 */
const PREFIX_REGEX =
  /^(can you help me with|help me with|how do i|how to|i want to|i need to|i need help with|i'm struggling with|im struggling with|i feel like|tell me how to|please help me|what should i do about|i have a|i have an)\s+/i;

/**
 * Topic pattern rules for high-precision title generation
 */
const TOPIC_RULES: Array<{
  pattern: RegExp;
  title: string;
}> = [
  {
    pattern: /\b(salary|raise|compensation|bonus|equity|counteroffer|counter-offer|pay)\b/i,
    title: "Salary negotiation before review",
  },
  {
    pattern: /\b(interview|interviewer|mock interview|behavioral|star method|recruiter screen)\b/i,
    title: "Interview preparation",
  },
  {
    pattern: /\b(difficult manager|toxic manager|bad boss|manager conflict|boss micromanag\w*|managing up)\b/i,
    title: "Handling a difficult manager",
  },
  {
    pattern: /\b(confidence|meeting|speak up|interrupted|second-guess|imposter|fraud|unqualified)\b/i,
    title: "Building confidence in meetings",
  },
  {
    pattern: /\b(career change|career pivot|transition|new industry|switch career|break into)\b/i,
    title: "Career transition strategy",
  },
  {
    pattern: /\b(burnout|overworked|overworking|work-life|work life|boundaries|working weekends|60 hours)\b/i,
    title: "Setting boundaries & work-life balance",
  },
  {
    pattern: /\b(promotion|promoted|staff engineer|director|lead role|executive presence)\b/i,
    title: "Navigating leadership & promotion",
  },
  {
    pattern: /\b(presentation|public speaking|slides|keynote|stage fright)\b/i,
    title: "Presentation & public speaking prep",
  },
  {
    pattern: /\b(conflict|coworker|teammate|disagreement|pushback|stakeholder)\b/i,
    title: "Navigating workplace conflict",
  },
];

/**
 * Fallback intent-based titles when specific patterns are absent
 */
const INTENT_FALLBACK_TITLES: Record<CoachingIntent, string> = {
  salary: "Salary & compensation strategy",
  interview: "Interview preparation & practice",
  career_change: "Career pivot & transition",
  leadership: "Leadership & assertive communication",
  confidence: "Building confidence & overcoming self-doubt",
  balance: "Work-life balance & boundaries",
  general: "Career & confidence coaching",
};

/**
 * Cleans and capitalizes raw snippet text for conversational titles
 */
function cleanRawSnippet(text: string): string {
  // Strip question marks, quotes, leading/trailing whitespace
  let cleaned = text.replace(/^[#\s"'`]+|[#\s"'`]+$/g, "").trim();

  // Strip conversational conversational openings
  cleaned = cleaned.replace(PREFIX_REGEX, "");

  // Take first sentence or first 6-8 words
  const firstSentence = cleaned.split(/[.?!;\n]/)[0] ?? cleaned;
  const words = firstSentence.trim().split(/\s+/).slice(0, 7);
  const result = words.join(" ").trim();

  if (!result || result.length < 3) {
    return "New Coaching Session";
  }

  // Capitalize first letter
  return result.charAt(0).toUpperCase() + result.slice(1);
}

/**
 * Generates a clean, professional, concise conversation title
 * based on the user's initial prompt and detected intent.
 *
 * @param message The initial message sent by the user
 * @param intent Optional detected coaching intent
 * @returns Clean title string (max 60 characters)
 */
export function generateConversationTitle(message: string, intent?: CoachingIntent): string {
  if (!message || typeof message !== "string") {
    return "New Coaching Session";
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return "New Coaching Session";
  }

  // 1. Check direct topic pattern matches
  for (const rule of TOPIC_RULES) {
    if (rule.pattern.test(trimmed)) {
      return rule.title;
    }
  }

  // 2. If intent is provided and not general, use intent-specific title
  if (intent && intent !== "general" && INTENT_FALLBACK_TITLES[intent]) {
    return INTENT_FALLBACK_TITLES[intent];
  }

  // 3. Generate from message snippet
  const snippetTitle = cleanRawSnippet(trimmed);
  if (snippetTitle.length > 55) {
    return snippetTitle.slice(0, 52).trim() + "...";
  }

  return snippetTitle;
}
