const privateSkillPrefixes = [
  "ai-chat-account-manager-",
  "ai-chat-strategist-",
  "ai-chat-communication-strategist-",
  "ai-chat-brand-designer-",
  "ai-chat-business-analyst-",
];
const storeEmployeeSkillPrefix = "store-employee-";
const storeEmployeeSkillPattern =
  /^store-employee-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-([\s\S]+)$/i;

export function storeEmployeeSkillSlug(profileId: string, slug: string) {
  if (!/^[a-z0-9._-]{1,80}$/i.test(slug)) {
    throw new Error(
      "Validation error. Use up to 80 Latin letters, digits, dots, underscores or dashes in a skill command",
    );
  }
  return `${storeEmployeeSkillPrefix}${profileId}-${slug}`;
}

export function storeEmployeeSkillCommand(slug: string) {
  return storeEmployeeSkillPattern.exec(slug)?.[2] ?? slug;
}

/** Private skill commands include their owner profile ID. */
export function getPrivateAIChatSkillProfileId(slug?: string) {
  const employeeProfileId = slug && storeEmployeeSkillPattern.exec(slug)?.[1];
  if (employeeProfileId) {
    return employeeProfileId;
  }
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
