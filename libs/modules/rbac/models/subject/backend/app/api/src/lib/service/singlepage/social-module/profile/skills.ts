import {
  AI_CHAT_DOCUMENTS,
  AI_CHAT_DOCUMENT_SKILL_TEMPLATES,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { getProfileDocumentSkillSlug } from "@sps/backend-utils";
import { api as skillApi } from "@sps/social/models/skill/sdk/server";
import { api as linksApi } from "@sps/social/relations/profiles-to-skills/sdk/server";
import type { IModel as ISkill } from "@sps/social/models/skill/sdk/model";
import type { ISocialModule } from "../../../../di";

export interface IForDocumentProps {
  socialModuleProfileId: string;
  documentKey: string;
}

export class Service {
  constructor(
    readonly socialModule: Pick<ISocialModule, "skill" | "profilesToSkills">,
  ) {}

  async ensure(profileId: string): Promise<ISkill[]> {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    const options = {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        "Cache-Control": "no-store",
      },
    };
    const slugs = AI_CHAT_DOCUMENTS.map((document) =>
      getProfileDocumentSkillSlug(document.skillSlug, profileId),
    );
    const existing: ISkill[] = await this.socialModule.skill.find({
      params: {
        filters: { and: [{ column: "slug", method: "inArray", value: slugs }] },
      },
    });
    const links = await this.socialModule.profilesToSkills.find({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: profileId }],
        },
      },
    });
    const result: ISkill[] = [];
    const createdSkills: string[] = [];
    const createdLinks: string[] = [];
    try {
      for (const [orderIndex, document] of AI_CHAT_DOCUMENTS.entries()) {
        const slug = slugs[orderIndex];
        let skill = existing.find((record) => record.slug === slug);
        if (!skill) {
          const template = AI_CHAT_DOCUMENT_SKILL_TEMPLATES[document.key];
          skill = await skillApi.create({
            data: {
              ...template,
              slug,
              adminTitle: template.title,
              variant: "default",
            },
            options,
          });
          createdSkills.push(skill.id);
        }
        if (!skill.description.trim())
          throw new Error(
            `Configuration error. Document skill ${slug} has empty instructions.`,
          );
        if (!links.some((link) => link.skillId === skill.id)) {
          const link = await linksApi.create({
            data: {
              profileId,
              skillId: skill.id,
              orderIndex,
              variant: "default",
            },
            options,
          });
          createdLinks.push(link.id);
        }
        result.push(skill);
      }
      return result;
    } catch (error) {
      // Roll back only records created by this attempt; retain manually edited skills.
      for (const id of createdLinks) await linksApi.delete({ id, options });
      for (const id of createdSkills) await skillApi.delete({ id, options });
      throw error;
    }
  }

  async forDocument(profileId: string, key: string): Promise<ISkill> {
    const definition = AI_CHAT_DOCUMENTS.find(
      (document) => document.key === key,
    );
    if (!definition)
      throw new Error("Validation error. Unknown AI Chat document");
    const ownedSlug = getProfileDocumentSkillSlug(
      definition.skillSlug,
      profileId,
    );
    const links = await this.socialModule.profilesToSkills.find({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: profileId }],
        },
      },
    });
    const skillIds = links.map((link) => link.skillId);
    const skills: ISkill[] = skillIds.length
      ? await this.socialModule.skill.find({
          params: {
            filters: {
              and: [
                { column: "id", method: "inArray", value: skillIds },
                {
                  column: "slug",
                  method: "inArray",
                  value: [ownedSlug, definition.skillSlug],
                },
              ],
            },
          },
        })
      : [];
    // Legacy profiles remain usable until their shared links are migrated.
    const skill =
      skills.find((record) => record.slug === ownedSlug) ||
      skills.find((record) => record.slug === definition.skillSlug);
    if (!skill?.description.trim())
      throw new Error(
        `Configuration error. Document skill ${definition.skillSlug} is missing.`,
      );
    return skill;
  }
}
