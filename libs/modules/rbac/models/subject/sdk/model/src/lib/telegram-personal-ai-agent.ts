export const TELEGRAM_PERSONAL_AI_AGENT_SLUG_PREFIX =
  "telegram-personal-ai-agent" as const;

export function getTelegramPersonalAiAgentSlug(ownerRbacSubjectId: string) {
  const normalizedOwnerRbacSubjectId = ownerRbacSubjectId.trim();

  if (!normalizedOwnerRbacSubjectId) {
    throw new Error(
      "Validation error. Telegram personal AI agent owner rbac.subject id is required.",
    );
  }

  return `${TELEGRAM_PERSONAL_AI_AGENT_SLUG_PREFIX}-${normalizedOwnerRbacSubjectId}`;
}

export function isTelegramPersonalAiAgentSlug(value: unknown) {
  return (
    typeof value === "string" &&
    value.startsWith(`${TELEGRAM_PERSONAL_AI_AGENT_SLUG_PREFIX}-`)
  );
}
