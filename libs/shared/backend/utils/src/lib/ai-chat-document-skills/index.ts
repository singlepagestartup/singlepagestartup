import { AI_CHAT_DOCUMENTS } from "@sps/shared-utils";

export function getProfileDocumentSkillSlug(
  baseSlug: string,
  profileId: string,
) {
  return `${baseSlug}-${profileId}`;
}

/** Resolve only this profile's profession, including its legacy shared slug. */
export function getAIChatDocumentForSkill(slug: string, profileId: string) {
  return AI_CHAT_DOCUMENTS.find(
    (document) =>
      slug === document.skillSlug ||
      slug === getProfileDocumentSkillSlug(document.skillSlug, profileId),
  );
}

/** Built-in per-profile profession commands are not shared catalogue entries. */
export function getPrivateAIChatSkillProfileId(slug?: string) {
  if (!slug) return undefined;
  for (const document of AI_CHAT_DOCUMENTS) {
    const prefix = `${document.skillSlug}-`;
    if (!slug.startsWith(prefix)) continue;
    const profileId = slug.slice(prefix.length);
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        profileId,
      )
    )
      return profileId;
  }
  return undefined;
}
