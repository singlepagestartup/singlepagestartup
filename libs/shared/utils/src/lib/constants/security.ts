export const securityEventKinds = [
  "password-failed",
  "password-limited",
  "password-recovered",
  "auth-limited",
  "operator-mismatch",
  "operator-limited",
  "api-limited",
] as const;

export const securityNotificationTopicSlug = "security";
export const securityNotificationTemplateSlugs = {
  telegram: "security-summary-telegram",
  email: "security-summary-email",
} as const;
