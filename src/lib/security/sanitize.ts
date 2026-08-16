/**
 * @fileoverview Sanitization and security encoding utilities.
 * Protects against XSS, HTML injection in email templates, and AI prompt injection.
 * @server-only
 */

/**
 * Escapes characters with special meaning in HTML to prevent XSS / HTML injection.
 */
export function escapeHtml(unsafe: string | null | undefined): string {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes user input before embedding into AI system prompts.
 * Strips dangerous control sequences that attempt to hijack system/assistant roles.
 */
export function sanitizeForPrompt(input: string | null | undefined): string {
  if (!input) return "";

  return input
    // Neutralize standard LLM control tokens
    .replace(/<\|im_start\|>/gi, "")
    .replace(/<\|im_end\|>/gi, "")
    .replace(/\[INST\]/gi, "")
    .replace(/\[\/INST\]/gi, "")
    .replace(/<<SYS>>/gi, "")
    .replace(/<<\/SYS>>/gi, "")
    // Normalize excessive consecutive newlines
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

/**
 * Masks sensitive strings (e.g., API keys, email addresses, tokens) for secure logging.
 */
export function maskSensitive(
  str: string | null | undefined,
  visibleStart = 3,
  visibleEnd = 3
): string {
  if (!str) return "********";
  if (str.length <= visibleStart + visibleEnd) return "********";
  return `${str.slice(0, visibleStart)}***${str.slice(-visibleEnd)}`;
}
