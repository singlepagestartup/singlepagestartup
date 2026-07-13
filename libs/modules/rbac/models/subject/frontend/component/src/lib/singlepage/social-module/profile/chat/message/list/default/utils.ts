import { ISocialModuleMessagesAndActionsQuery } from "./interface";
import { KnowledgeMentionOption, ProfileSummary, SocialSkill } from "./types";
import { internationalization } from "@sps/shared-configuration";
import { saveLanguageContext } from "@sps/shared-utils";
import type { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";

export const scrollBottomThreshold = 120;

export const knowledgeChatCommands = [
  {
    value: "/learn",
    insertValue: "@knowledge /learn",
    title: "Learn",
    description:
      "Add this message and text or markdown attachments to this AI profile knowledge base.",
  },
];

export const knowledgeMentionOption: KnowledgeMentionOption = {
  slug: "knowledge",
  title: "Knowledge",
  description: "Search profile knowledge with RAG for this message.",
};

export function getFallbackProfile(label = "Unknown profile"): ProfileSummary {
  return {
    id: "unknown",
    slug: label,
    href: "#",
    initial: label.charAt(0).toUpperCase(),
  };
}

export function getFallbackSocialModuleProfile(
  label = "Unknown profile",
): ISocialModuleProfile {
  return {
    id: "unknown",
    createdAt: new Date(0),
    updatedAt: new Date(0),
    className: null,
    variant: "default",
    title: {},
    subtitle: {},
    description: {},
    allowedMcpServerIds: [],
    adminTitle: label,
    slug: label,
  };
}

export function getProfileSummary(
  profile: { id: string; slug: string },
  language: string,
) {
  const href = saveLanguageContext(
    `/social/profiles/${profile.slug}`,
    language,
    internationalization.languages,
  );

  return {
    id: profile.id,
    slug: profile.slug,
    href,
    initial: profile.slug.charAt(0).toUpperCase() || "?",
  };
}

export function getTimelineSignature(
  socialModuleThreadId: string,
  items: ISocialModuleMessagesAndActionsQuery = [],
) {
  const lastItem = items[items.length - 1];

  // updatedAt is intentionally excluded: editing an existing message must not
  // change the signature, otherwise the scroll-to-bottom effect fires on edit.
  return [
    socialModuleThreadId,
    items.length,
    lastItem?.type || "",
    lastItem?.data.id || "",
    lastItem?.data.createdAt || "",
  ].join(":");
}

export function getSkillMentionMatch(value?: string | null) {
  const match = (value || "").match(/(^|\s)@([a-zA-Z0-9._-]*)$/);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    query: match[2] || "",
    startIndex: match.index + match[1].length,
  };
}

export function getKnowledgeCommandMatch(value?: string | null) {
  const match = (value || "").match(/(^|\s)\/([a-zA-Z0-9._-]*)$/);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    query: match[2] || "",
    startIndex: match.index + match[1].length,
  };
}

export function filterSkillMentionOptions(
  profileSkills: SocialSkill[],
  description?: string | null,
) {
  const skillMentionMatch = getKnowledgeCommandMatch(description);

  if (!skillMentionMatch) {
    return [];
  }

  const normalizedQuery = skillMentionMatch.query.toLowerCase();

  return profileSkills.filter((skill) => {
    const haystack = [
      skill.slug,
      skill.title,
      skill.adminTitle,
      skill.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedQuery);
  });
}

export function shouldShowKnowledgeMentionOption(description?: string | null) {
  const skillMentionMatch = getSkillMentionMatch(description);

  if (!skillMentionMatch) {
    return false;
  }

  return knowledgeMentionOption.slug.includes(
    skillMentionMatch.query.toLowerCase(),
  );
}

export function hasKnowledgeMention(value?: string | null) {
  return /(^|\s)@knowledge(?=\s|$)/i.test(value || "");
}

export function getMentionedSkillSlugs(value?: string | null) {
  const matches = (value || "").matchAll(/(^|\s)\/([a-zA-Z0-9._-]+)(?=\s|$)/g);

  return new Set(
    Array.from(matches)
      .map((match) => {
        return match[2].toLowerCase();
      })
      .filter((slug) => {
        return !["learn", "new"].includes(slug);
      }),
  );
}
