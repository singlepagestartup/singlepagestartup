const privateSkillPrefixes = [
  "ai-chat-account-manager-",
  "ai-chat-strategist-",
  "ai-chat-communication-strategist-",
  "ai-chat-brand-designer-",
  "ai-chat-business-analyst-",
];

/** Legacy private Skill commands include their owner Profile ID. */
export function getPrivateAIChatSkillProfileId(slug?: string) {
  const prefix = privateSkillPrefixes.find((value) => slug?.startsWith(value));
  if (!prefix || !slug) {
    return undefined;
  }

  const profileId = slug.slice(prefix.length);
  const isProfileId =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      profileId,
    );
  return isProfileId ? profileId : undefined;
}
