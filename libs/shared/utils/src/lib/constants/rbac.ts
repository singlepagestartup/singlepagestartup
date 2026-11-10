const emailAndPassword = "/rbac/subject/authentication/email-and-password";

export const RBAC_EMAIL_PASSWORD_PATHS = {
  authentication: emailAndPassword,
  registration: `${emailAndPassword}/registration`,
  "forgot-password": `${emailAndPassword}/forgot-password`,
  "reset-password": `${emailAndPassword}/reset-password`,
} as const;

export type IEmailPasswordAction = keyof typeof RBAC_EMAIL_PASSWORD_PATHS;
