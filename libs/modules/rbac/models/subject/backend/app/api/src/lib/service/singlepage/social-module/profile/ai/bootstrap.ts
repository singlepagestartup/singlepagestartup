import { api as rbacSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { IModel as IRbacSubject } from "@sps/rbac/models/subject/sdk/model";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import type { ISocialModule } from "../../../../../di";

export interface IExecuteProps {
  ownerRbacSubject: IRbacSubject;
  socialModuleChatId: string;
  slug: string;
  socialModuleProfile?: ISocialModuleProfile;
  title: string;
  adminTitle?: string;
  titleTranslations?: Record<string, string>;
  relationVariant: string;
}

export interface IResult {
  rbacModuleSubject: IRbacSubject;
  socialModuleProfile: ISocialModuleProfile;
}

type IFindSubjects = (props?: any) => Promise<IRbacSubject[] | null>;

export interface IConstructorProps {
  findSubjects: IFindSubjects;
  socialModule: ISocialModule;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
  ensureKnowledgeAccess: (props: {
    ownerRbacSubjectId: string;
    socialModuleProfileId: string;
  }) => Promise<unknown>;
}

export class Service {
  protected findSubjects: IFindSubjects;
  protected socialModule: ISocialModule;
  protected subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
  protected ensureKnowledgeAccess: IConstructorProps["ensureKnowledgeAccess"];

  constructor(props: IConstructorProps) {
    this.findSubjects = props.findSubjects;
    this.socialModule = props.socialModule;
    this.subjectsToSocialModuleProfiles = props.subjectsToSocialModuleProfiles;
    this.ensureKnowledgeAccess = props.ensureKnowledgeAccess;
  }

  protected getSdkHeaders() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    return {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    };
  }

  protected getCreatedAtTimestamp(value: unknown) {
    const timestamp = value ? new Date(String(value)).getTime() : Number.NaN;

    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }

  protected sortByCreatedAt<T extends { id?: string; createdAt?: unknown }>(
    values: T[],
  ) {
    return [...values].sort((a, b) => {
      const timestampDifference =
        this.getCreatedAtTimestamp(a.createdAt) -
        this.getCreatedAtTimestamp(b.createdAt);

      if (timestampDifference !== 0) {
        return timestampDifference;
      }

      return String(a.id || "").localeCompare(String(b.id || ""));
    });
  }

  protected async findAgentSubject(slug: string) {
    const subjects = await this.findSubjects({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: slug,
            },
          ],
        },
        limit: 2,
      },
    });

    if ((subjects?.length || 0) > 1) {
      throw new Error(
        "Internal error. Multiple personal AI rbac.subject records found for one identity.",
      );
    }

    return subjects?.[0] || null;
  }

  protected async resolveAgentSubject(props: {
    ownerRbacSubject: IRbacSubject;
    slug: string;
    headers: Record<string, string>;
  }) {
    const existingSubject = await this.findAgentSubject(props.slug);

    if (existingSubject) {
      if (existingSubject.variant !== "agent") {
        throw new Error(
          'Validation error. AI rbac.subject must have variant="agent".',
        );
      }

      return existingSubject;
    }

    return rbacSubjectApi.create({
      data: {
        variant: "agent",
        slug: props.slug,
      },
      options: {
        headers: props.headers,
      },
    });
  }

  protected async findAgentProfile(slug: string) {
    const profiles = await this.socialModule.profile.find({
      params: {
        filters: {
          and: [
            {
              column: "slug",
              method: "eq",
              value: slug,
            },
            {
              column: "variant",
              method: "eq",
              value: "artificial-intelligence",
            },
          ],
        },
        limit: 2,
      },
    });

    if ((profiles?.length || 0) > 1) {
      throw new Error(
        "Internal error. Multiple personal AI social.profile records found for one identity.",
      );
    }

    return (profiles?.[0] as ISocialModuleProfile | undefined) || null;
  }

  protected async resolveAgentProfile(props: {
    ownerRbacSubject: IRbacSubject;
    agentRbacSubject: IRbacSubject;
    slug: string;
    socialModuleProfile?: ISocialModuleProfile;
    headers: Record<string, string>;
    title: string;
    adminTitle?: string;
    titleTranslations?: Record<string, string>;
    relationVariant: string;
  }) {
    let profile =
      props.socialModuleProfile || (await this.findAgentProfile(props.slug));

    if (profile && profile.variant !== "artificial-intelligence") {
      throw new Error(
        'Validation error. AI social.profile must have variant="artificial-intelligence".',
      );
    }

    if (!profile) {
      profile = await socialModuleProfileApi.create({
        data: {
          variant: "artificial-intelligence",
          className: "",
          adminTitle: props.adminTitle || props.title,
          slug: props.slug,
          title: props.titleTranslations || {
            en: props.title,
            ru: props.title,
          },
          subtitle: {},
          description: {},
          allowedMcpServerIds: ["singlepagestartup"],
        },
        options: {
          headers: props.headers,
        },
      });
    }

    const profileSubjectRelations =
      await this.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: profile.id,
              },
            ],
          },
        },
      });
    const foreignSubjectRelation = profileSubjectRelations?.find(
      (relation) =>
        relation.subjectId !== props.agentRbacSubject.id &&
        !(
          relation.subjectId === props.ownerRbacSubject.id &&
          relation.variant === "assistant"
        ),
    );

    if (foreignSubjectRelation) {
      throw new Error(
        "Authorization error. AI social.profile belongs to another rbac.subject.",
      );
    }

    const currentSubjectRelations = this.sortByCreatedAt(
      profileSubjectRelations?.filter(
        (relation) => relation.subjectId === props.agentRbacSubject.id,
      ) || [],
    );

    if (!currentSubjectRelations.length) {
      await subjectsToSocialModuleProfilesApi.create({
        data: {
          subjectId: props.agentRbacSubject.id,
          socialModuleProfileId: profile.id,
          variant: props.relationVariant,
        },
        options: {
          headers: props.headers,
        },
      });
    } else if (currentSubjectRelations.length > 1) {
      throw new Error(
        "Data integrity error. Duplicate subject-to-profile relations found",
      );
    }

    return profile;
  }

  protected async ensureProfileConnectedToChat(props: {
    socialModuleProfileId: string;
    socialModuleChatId: string;
    headers: Record<string, string>;
    relationVariant: string;
  }) {
    const relations = this.sortByCreatedAt(
      (await this.socialModule.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: props.socialModuleProfileId,
              },
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      })) || [],
    );

    if (!relations.length) {
      await socialModuleProfilesToChatsApi.create({
        data: {
          profileId: props.socialModuleProfileId,
          chatId: props.socialModuleChatId,
          variant: props.relationVariant,
        },
        options: {
          headers: props.headers,
        },
      });
      return;
    }

    if (relations.length > 1) {
      throw new Error(
        "Data integrity error. Duplicate profile-to-chat relations found",
      );
    }
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!props.ownerRbacSubject?.id) {
      throw new Error(
        "Validation error. AI agent owner rbac.subject is required.",
      );
    }

    if (!props.socialModuleChatId?.trim()) {
      throw new Error(
        "Validation error. AI agent social-module chat id is required.",
      );
    }

    const headers = this.getSdkHeaders();
    const slug = props.slug;
    const rbacModuleSubject = await this.resolveAgentSubject({
      ownerRbacSubject: props.ownerRbacSubject,
      slug,
      headers,
    });
    const socialModuleProfile = await this.resolveAgentProfile({
      ownerRbacSubject: props.ownerRbacSubject,
      agentRbacSubject: rbacModuleSubject,
      slug,
      socialModuleProfile: props.socialModuleProfile,
      headers,
      title: props.title,
      adminTitle: props.adminTitle,
      titleTranslations: props.titleTranslations,
      relationVariant: props.relationVariant,
    });

    await this.ensureKnowledgeAccess({
      ownerRbacSubjectId: props.ownerRbacSubject.id,
      socialModuleProfileId: socialModuleProfile.id,
    });

    await this.ensureProfileConnectedToChat({
      socialModuleProfileId: socialModuleProfile.id,
      socialModuleChatId: props.socialModuleChatId,
      headers,
      relationVariant: props.relationVariant,
    });

    return {
      rbacModuleSubject,
      socialModuleProfile,
    };
  }
}
