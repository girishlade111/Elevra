/**
 * Design Tokens
 * Strict adherence to the AI Confidence Coach visual design system.
 */

export const DESIGN_TOKENS = {
  colors: {
    background: "#0d0d0d",
    panel: "#161616",
    secondarySurface: "#1c1c1c",
    hoverSurface: "#242424",
    border: "#2a2a2a",
    primaryText: "#e8e8e8",
    secondaryText: "#8a8a8a",
    mutedText: "#5c5c5c",
    accent: "#e07856",
    accentHover: "#cf6a49",
    success: "#3ecf5e",
    danger: "#e5484d",
  },
  typography: {
    fontFamily:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    body: "13.5px",
    h1: "22px",
    h2: "18px",
    h3: "15px",
    sectionLabels: "12.5px",
    fieldLabels: "13.5px",
    descriptions: "12.5px",
    tableHeaders: "12px",
  },
  layout: {
    sidebarWidth: "260px",
    mainPaddingHorizontal: "36px",
    borderRadius: "6px",
  },
} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
