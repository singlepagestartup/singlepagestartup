import { Service as Bootstrap } from "./ai/bootstrap";
import { Service as Documents } from "./documents";
import { Service as Skills } from "./skills";
import type { Service as SubjectService } from "../../index";
import { api as profileApi } from "@sps/social/models/profile/sdk/server";
import { api as subjectProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import type { IModel as IProfile } from "@sps/social/models/profile/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";

export interface ICreateProps {
  subjectId: string;
  data: {
    variant: "default" | "artificial-intelligence";
    title: Record<string, string | undefined>;
  };
}

export interface IFindProps {
  subjectId: string;
  params?: Record<string, any>;
}

export class Service {
  constructor(readonly service: SubjectService) {}

  async create(props: ICreateProps): Promise<IProfile> {
    if (!RBAC_SECRET_KEY)
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    const owner = await this.service.findById({ id: props.subjectId });
    if (!owner || owner.variant === "anonymous")
      throw new Error("Authorization error. Sign in to create a profile");
    const identities = await this.service.subjectsToIdentities.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: props.subjectId }],
        },
        limit: 1,
      },
    });
    if (!identities?.length)
      throw new Error("Authorization error. Sign in to create a profile");
    const { data } = props;
    if (!data || !["default", "artificial-intelligence"].includes(data.variant))
      throw new Error("Validation error. Unsupported profile variant");
    if (data.variant === "default")
      throw new Error(
        "Validation error. The personal profile is created during registration",
      );
    if (
      !data.title ||
      typeof data.title !== "object" ||
      Array.isArray(data.title) ||
      Object.values(data.title).some((value) => typeof value !== "string")
    )
      throw new Error("Validation error. Invalid profile title");
    const title = (
      data.title.en || Object.values(data.title).find(Boolean)
    )?.trim();
    if (!title || title.length > 200)
      throw new Error(
        "Validation error. Profile title must contain 1 to 200 characters",
      );
    const skills = new Skills(this.service.socialModule);
    const options = {
      headers: {
        "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        "Cache-Control": "no-store",
      },
    };
    const profile = await profileApi.create({
      data: {
        variant: data.variant,
        title: data.title,
        ...(data.variant === "artificial-intelligence"
          ? { allowedMcpServerIds: ["singlepagestartup"] }
          : {}),
      },
      options,
    });
    try {
      await skills.ensure(profile.id);
    } catch (error) {
      await profileApi.delete({ id: profile.id, options });
      throw error;
    }
    const context =
      await this.service.socialModuleChatLifecycleCreateChatWithDefaultThread({
        subjectId: props.subjectId,
        data: { title, variant: "ai-chat" },
        autoBootstrapProfile: true,
      });
    const agent = await new Bootstrap({
      findSubjects: (findProps) => this.service.find(findProps),
      socialModule: this.service.socialModule,
      subjectsToSocialModuleProfiles:
        this.service.subjectsToSocialModuleProfiles,
      ensureKnowledgeAccess: (accessProps) =>
        this.service.socialModuleProfileKnowledgeAccessEnsure(accessProps),
    }).execute({
      ownerRbacSubject: owner,
      socialModuleChatId: context.socialModuleChat.id,
      slug: `profile-${context.socialModuleChat.id}`,
      socialModuleProfile: profile,
      title,
      relationVariant: "default",
    });
    await subjectProfilesApi.create({
      data: {
        subjectId: props.subjectId,
        socialModuleProfileId: agent.socialModuleProfile.id,
        variant: "assistant",
      },
      options,
    });
    await new Documents(this.service.socialModule).execute({
      profileId: agent.socialModuleProfile.id,
      chatId: context.socialModuleChat.id,
      initialThread: context.socialModuleDefaultThread,
    });
    return agent.socialModuleProfile;
  }

  async find(props: IFindProps): Promise<IProfile[]> {
    const relations = await this.service.subjectsToSocialModuleProfiles.find({
      params: {
        filters: {
          and: [{ column: "subjectId", method: "eq", value: props.subjectId }],
        },
      },
    });
    const ownIds = [
      ...new Set<string>((relations || []).map((r) => r.socialModuleProfileId)),
    ];
    if (!ownIds.length) return [];
    const profileIds = ownIds;
    const profiles = await this.service.socialModule.profile.find({
      params: {
        ...props.params,
        filters: {
          ...props.params?.filters,
          and: [
            ...(props.params?.filters?.and || []),
            { column: "id", method: "inArray", value: profileIds },
          ],
        },
      },
    });
    const allowed = new Set(profileIds);
    return (profiles || []).filter((profile: IProfile) =>
      allowed.has(profile.id),
    );
  }
}
