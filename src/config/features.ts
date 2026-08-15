/**
 * Feature Flags Configuration
 */

export const FEATURE_FLAGS = {
  enableResendEmail: true,
  enableGmailSmtpEmail: true,
  enableWeeklyCron: true,
  enableVoiceCoaching: false,
  enableAdvancedAnalytics: true,
  enableMultiLanguageCoaching: false,
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[flag] ?? false;
};
