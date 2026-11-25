import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { withConsistencyTransaction } from "@sps/shared-backend-api";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import {
  IModel as ISocialModuleThread,
  selectPrimaryLinkedThread,
} from "@sps/social/models/thread/sdk/model";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { STORE_EMPLOYEE_CHAT_VARIANT } from "@sps/rbac/models/subject/sdk/model/src/lib/crm-workspace";
import type { Service as SubjectService } from "../../index";
import { storeEmployeeChatSlugPrefix } from "../../crm/workspace/employees";

export class Service {
  protected service: SubjectService;

  constructor(service: SubjectService) {
    this.service = service;
  }

  async createChatWithDefaultThread(props: {
    subjectId: string;
    data: Partial<ISocialModuleChat>;
    requestedSocialModuleProfileId?: string;
    autoBootstrapProfile: boolean;
  }): Promise<{
    socialModuleChat: ISocialModuleChat;
    socialModuleProfileId: string;
    socialModuleDefaultThread: ISocialModuleThread;
  }> {
    if (
      props.data?.variant === STORE_EMPLOYEE_CHAT_VARIANT ||
      (typeof props.data?.slug === "string" &&
        props.data.slug.startsWith(storeEmployeeChatSlugPrefix))
    ) {
      throw new Error(
        "Forbidden error. Store employee conversations are managed by the store workspace",
      );
    }
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const socialModuleProfileId = await this.resolveSubjectProfileId({
      subjectId: props.subjectId,
      requestedSocialModuleProfileId: props.requestedSocialModuleProfileId,
      autoBootstrapProfile: props.autoBootstrapProfile,
    });

    return withConsistencyTransaction(this.service.repository.db, async () => {
      const socialModuleChat = await this.service.chatOwnership.create(
        props.subjectId,
        props.data,
      );
      await this.service.modules.social.profilesToChats.create({
        data: { profileId: socialModuleProfileId, chatId: socialModuleChat.id },
      });
      const socialModuleDefaultThread = await this.ensureDefaultThreadForChat({
        socialModuleChatId: socialModuleChat.id,
      });
      return {
        socialModuleChat,
        socialModuleProfileId,
        socialModuleDefaultThread,
      };
    });
  }

  /** Legacy access check for participants and administrators. Settings writes require chatOwnership.assertOwner. */
  async assertSubjectOwnsChat(props: {
    subjectId: string;
    socialModuleChatId: string;
  }) {
    if (await this.isSubjectAdmin(props.subjectId)) {
      return;
    }

    const socialModuleProfileIds = await this.getSubjectLinkedProfileIds({
      subjectId: props.subjectId,
      requireAny: true,
    });

    const socialModuleProfilesToChats =
      await this.service.modules.social.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "inArray",
                value: socialModuleProfileIds,
              },
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    if (!socialModuleProfilesToChats?.length) {
      throw new Error(
        "Authorization error. Requested social-module chat does not belong to subject",
      );
    }
  }

  async resolveSubjectProfileIdInChat(props: {
    subjectId: string;
    socialModuleChatId: string;
  }): Promise<string> {
    const socialModuleProfileIds = await this.getSubjectLinkedProfileIds({
      subjectId: props.subjectId,
      requireAny: true,
    });

    const socialModuleProfilesToChats =
      await this.service.modules.social.profilesToChats.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "inArray",
                value: socialModuleProfileIds,
              },
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    if (!socialModuleProfilesToChats?.length) {
      if (await this.isSubjectAdmin(props.subjectId)) {
        const fallbackSocialModuleProfileId = socialModuleProfileIds[0];

        if (!fallbackSocialModuleProfileId) {
          throw new Error(
            "Not found error. Requested subject has no social-module profile",
          );
        }

        return fallbackSocialModuleProfileId;
      }

      throw new Error(
        "Authorization error. Requested social-module chat does not belong to subject",
      );
    }

    if (socialModuleProfilesToChats.length > 1) {
      throw new Error(
        "Validation error. Subject has multiple profiles in the requested chat",
      );
    }

    const socialModuleProfileId = socialModuleProfilesToChats[0]?.profileId;

    if (!socialModuleProfileId) {
      throw new Error(
        "Validation error. Requested chat relation has no socialModuleProfileId",
      );
    }

    return socialModuleProfileId;
  }

  async assertThreadBelongsToChat(props: {
    socialModuleChatId: string;
    socialModuleThreadId: string;
  }) {
    const socialModuleChatsToThreads =
      await this.service.modules.social.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
              {
                column: "threadId",
                method: "eq",
                value: props.socialModuleThreadId,
              },
            ],
          },
        },
      });

    if (!socialModuleChatsToThreads?.length) {
      throw new Error(
        "Validation error. Requested thread is not linked to the requested chat",
      );
    }
  }

  async ensureDefaultThreadForChat(props: {
    socialModuleChatId: string;
  }): Promise<ISocialModuleThread> {
    const socialModuleChat = await this.service.modules.social.chat.findById({
      id: props.socialModuleChatId,
    });

    if (!socialModuleChat?.id) {
      throw new Error(
        "Validation error. Requested social-module chat does not exist",
      );
    }

    const socialModuleChatsToThreads =
      await this.service.modules.social.chatsToThreads.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: props.socialModuleChatId,
              },
            ],
          },
        },
      });

    const linkedThreadIds =
      socialModuleChatsToThreads
        ?.map((socialModuleChatToThread) => {
          return socialModuleChatToThread.threadId;
        })
        .filter((threadId): threadId is string => Boolean(threadId)) || [];

    if (linkedThreadIds.length) {
      const socialModuleThreads = await this.service.modules.social.thread.find(
        {
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: linkedThreadIds,
                },
              ],
            },
          },
        },
      );

      const primarySocialModuleThread =
        selectPrimaryLinkedThread<ISocialModuleThread>({
          socialModuleChatsToThreads: socialModuleChatsToThreads || [],
          socialModuleThreads: socialModuleThreads || [],
        });

      if (primarySocialModuleThread) {
        return primarySocialModuleThread;
      }
    }

    const thread = await this.service.modules.social.thread.create({
      data: { variant: "default" },
    });
    await this.service.modules.social.chatsToThreads.create({
      data: {
        chatId: props.socialModuleChatId,
        threadId: thread.id,
        variant: "default",
      },
    });
    return thread;
  }

  protected async resolveSubjectProfileId(props: {
    subjectId: string;
    requestedSocialModuleProfileId?: string;
    autoBootstrapProfile: boolean;
  }): Promise<string> {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const secretKey = RBAC_SECRET_KEY;
    const linkedProfileIds = await this.getSubjectLinkedProfileIds({
      subjectId: props.subjectId,
    });

    if (props.requestedSocialModuleProfileId) {
      const requestedSocialModuleProfile =
        await this.service.modules.social.profile.findById({
          id: props.requestedSocialModuleProfileId,
        });

      if (!requestedSocialModuleProfile?.id) {
        throw new Error(
          "Not found error. Requested social-module profile not found",
        );
      }

      const hasSubjectProfileRelation = linkedProfileIds.includes(
        props.requestedSocialModuleProfileId,
      );

      if (hasSubjectProfileRelation) {
        return props.requestedSocialModuleProfileId;
      }

      if (!props.autoBootstrapProfile) {
        throw new Error(
          "Authorization error. Requested social-module profile does not belong to subject",
        );
      }

      await subjectsToSocialModuleProfilesApi.create({
        data: {
          subjectId: props.subjectId,
          socialModuleProfileId: props.requestedSocialModuleProfileId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": secretKey,
          },
        },
      });

      return props.requestedSocialModuleProfileId;
    }

    if (linkedProfileIds.length) {
      const socialModuleProfiles =
        await this.service.modules.social.profile.find({
          params: {
            filters: {
              and: [
                {
                  column: "id",
                  method: "inArray",
                  value: linkedProfileIds,
                },
              ],
            },
          },
        });

      const existingProfileIds = new Set(
        socialModuleProfiles
          ?.map((socialModuleProfile) => {
            return socialModuleProfile.id;
          })
          .filter((profileId): profileId is string => Boolean(profileId)) || [],
      );

      const firstLinkedExistingProfileId = linkedProfileIds.find(
        (profileId) => {
          return existingProfileIds.has(profileId);
        },
      );

      if (firstLinkedExistingProfileId) {
        return firstLinkedExistingProfileId;
      }
    }

    if (!props.autoBootstrapProfile) {
      throw new Error(
        `Not found error. Requested subject has no social-module profile. subjectId=${props.subjectId}`,
      );
    }

    const socialModuleProfile = await socialModuleProfileApi.create({
      data: {},
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": secretKey,
        },
      },
    });

    await subjectsToSocialModuleProfilesApi.create({
      data: {
        subjectId: props.subjectId,
        socialModuleProfileId: socialModuleProfile.id,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": secretKey,
        },
      },
    });

    return socialModuleProfile.id;
  }

  protected async getSubjectLinkedProfileIds(props: {
    subjectId: string;
    requireAny?: boolean;
  }): Promise<string[]> {
    const subjectToProfiles =
      await this.service.module.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              { column: "variant", method: "eq", value: "default" },
              {
                column: "subjectId",
                method: "eq",
                value: props.subjectId,
              },
            ],
          },
        },
      });

    if (props.requireAny && !subjectToProfiles?.length) {
      throw new Error(
        "Not found error. Requested subject has no social-module profile",
      );
    }

    const linkedProfileIds =
      subjectToProfiles
        ?.map((subjectToProfile) => {
          return subjectToProfile.socialModuleProfileId;
        })
        .filter((profileId): profileId is string => Boolean(profileId)) || [];

    if (props.requireAny && !linkedProfileIds.length) {
      throw new Error(
        "Not found error. Requested subject has no social-module profile",
      );
    }

    return linkedProfileIds;
  }

  async isSubjectAdmin(subjectId: string): Promise<boolean> {
    const subjectToRoles = await this.service.module.subjectsToRoles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subjectId,
            },
          ],
        },
      },
    });

    const roleIds =
      subjectToRoles
        ?.map((subjectToRole) => {
          return subjectToRole.roleId;
        })
        .filter((roleId): roleId is string => Boolean(roleId)) || [];

    if (!roleIds.length) {
      return false;
    }

    const roles = await this.service.module.role.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: roleIds,
            },
          ],
        },
      },
    });

    return Boolean(
      roles?.find((role) => {
        return role.slug === "admin";
      }),
    );
  }
}
