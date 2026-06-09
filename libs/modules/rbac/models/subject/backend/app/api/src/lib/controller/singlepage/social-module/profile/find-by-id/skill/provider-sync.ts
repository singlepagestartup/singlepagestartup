import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getHttpErrorType } from "@sps/backend-utils";
import { IModel as ISocialModuleSkill } from "@sps/social/models/skill/sdk/model";
import { Service } from "../../../../../../service";
import {
  buildProviderSkillBundle,
  getProviderSkillReference,
  IProviderSkillReference,
  isFreshProviderSkillReference,
  parseProviderSkillProviders,
  ProviderSkillProvider,
  putProviderSkillReference,
  uploadProviderSkill,
} from "./provider-skills";

interface IRequestBody {
  providers?: ProviderSkillProvider[];
  skillIds?: string[];
  force?: boolean;
}

interface ISyncResult {
  skillId: string;
  skillSlug: string;
  provider: ProviderSkillProvider;
  status: "synced" | "unchanged";
  reference: IProviderSkillReference;
}

interface ISkippedResult {
  skillId: string;
  skillSlug: string;
  reason: string;
}

export class Handler {
  service: Service;
  fetcher: typeof fetch;

  constructor(service: Service, props?: { fetcher?: typeof fetch }) {
    this.service = service;
    this.fetcher = props?.fetcher || fetch;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      const socialModuleProfileId = this.requireParam(
        c,
        "socialModuleProfileId",
      );
      const body = await this.parseBody(c);
      const providers = parseProviderSkillProviders(body.providers);
      const requestedSkillIds = this.normalizeSkillIds(body.skillIds);

      await this.assertProfileExists(socialModuleProfileId);

      const linkedSkillIds = await this.findProfileSkillIds({
        socialModuleProfileId,
      });
      const targetSkillIds = requestedSkillIds.length
        ? requestedSkillIds
        : linkedSkillIds;
      const unlinkedSkillIds = targetSkillIds.filter((skillId) => {
        return !linkedSkillIds.includes(skillId);
      });

      if (unlinkedSkillIds.length) {
        throw new Error(
          `Authorization error. Requested social skills are not linked to profile: ${unlinkedSkillIds.join(", ")}`,
        );
      }

      const skills = await this.findSkillsByIds(targetSkillIds);
      const synced: ISyncResult[] = [];
      const skipped: ISkippedResult[] = [];

      for (const skill of skills) {
        if (skill.status === "archived") {
          skipped.push({
            skillId: skill.id,
            skillSlug: skill.slug,
            reason: "archived",
          });
          continue;
        }

        for (const provider of providers) {
          synced.push(
            await this.syncSkillProvider({
              skill,
              provider,
              force: Boolean(body.force),
            }),
          );
        }
      }

      return c.json({
        data: {
          profileId: socialModuleProfileId,
          providers,
          synced,
          skipped,
        },
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private requireParam(c: Context, name: string) {
    const value = c.req.param(name);

    if (!value) {
      throw new Error(`Validation error. No ${name} provided`);
    }

    return value;
  }

  private async parseBody(c: Context): Promise<IRequestBody> {
    const body = await c.req.json().catch(() => {
      return {};
    });

    return body && typeof body === "object" ? (body as IRequestBody) : {};
  }

  private normalizeSkillIds(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value.filter((item): item is string => {
          return typeof item === "string" && Boolean(item.trim());
        }),
      ),
    );
  }

  private async assertProfileExists(socialModuleProfileId: string) {
    const profile = await this.service.socialModule.profile.findById({
      id: socialModuleProfileId,
    });

    if (!profile) {
      throw new Error(
        `Not found error. Social profile ${socialModuleProfileId} was not found`,
      );
    }
  }

  private async findProfileSkillIds(props: { socialModuleProfileId: string }) {
    const relations = await this.service.socialModule.profilesToSkills.find({
      params: {
        filters: {
          and: [
            {
              column: "profileId",
              method: "eq",
              value: props.socialModuleProfileId,
            },
          ],
        },
        orderBy: {
          and: [
            {
              column: "orderIndex",
              method: "asc",
            },
            {
              column: "createdAt",
              method: "asc",
            },
          ],
        },
      },
    });

    return (
      relations
        ?.map((relation: { skillId?: string }) => relation.skillId)
        .filter((skillId: unknown): skillId is string => {
          return typeof skillId === "string" && Boolean(skillId);
        }) || []
    );
  }

  private async findSkillsByIds(skillIds: string[]) {
    if (!skillIds.length) {
      return [];
    }

    const skills = await this.service.socialModule.skill.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: skillIds,
            },
          ],
        },
      },
    });
    const skillsById = new Map(
      (skills || []).map((skill: ISocialModuleSkill) => [skill.id, skill]),
    );

    return skillIds
      .map((skillId) => skillsById.get(skillId))
      .filter((skill): skill is ISocialModuleSkill => Boolean(skill));
  }

  private async syncSkillProvider(props: {
    skill: ISocialModuleSkill;
    provider: ProviderSkillProvider;
    force: boolean;
  }): Promise<ISyncResult> {
    const bundle = buildProviderSkillBundle(props.skill);

    if (
      !props.force &&
      isFreshProviderSkillReference({
        skill: props.skill,
        provider: props.provider,
        bundle,
      })
    ) {
      const reference = getProviderSkillReference({
        skill: props.skill,
        provider: props.provider,
      });

      if (reference) {
        return {
          skillId: props.skill.id,
          skillSlug: props.skill.slug,
          provider: props.provider,
          status: "unchanged",
          reference,
        };
      }
    }

    const upload = await uploadProviderSkill({
      provider: props.provider,
      bundle,
      fetcher: this.fetcher,
    });
    const reference: IProviderSkillReference = {
      provider: props.provider,
      providerSkillId: upload.providerSkillId,
      version: upload.version,
      name: bundle.name,
      sourceSkillId: props.skill.id,
      sourceSkillSlug: props.skill.slug,
      contentHash: bundle.contentHash,
      syncedAt: new Date().toISOString(),
    };
    const metadata = putProviderSkillReference({
      skill: props.skill,
      reference,
    });

    await this.service.socialModule.skill.update({
      id: props.skill.id,
      data: {
        ...props.skill,
        metadata,
      },
    });

    props.skill.metadata = metadata;

    return {
      skillId: props.skill.id,
      skillSlug: props.skill.slug,
      provider: props.provider,
      status: "synced",
      reference,
    };
  }
}
