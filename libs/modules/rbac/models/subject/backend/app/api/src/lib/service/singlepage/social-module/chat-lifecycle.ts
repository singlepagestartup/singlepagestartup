import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleThreadApi } from "@sps/social/models/thread/sdk/server";
import { IModel as ISocialModuleThread } from "@sps/social/models/thread/sdk/model";
import { api as socialModuleChatsToThreadsApi } from "@sps/social/relations/chats-to-threads/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Service } from "../index";

export class ChatLifecycleService {
  private service: Service;

  constructor(service: Service) {
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
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const socialModuleProfileId = await this.resolveSubjectProfileId({
      subjectId: props.subjectId,
      requestedSocialModuleProfileId: props.requestedSocialModuleProfileId,
      autoBootstrapProfile: props.autoBootstrapProfile,
    });

    const socialModuleChat = await socialModuleChatApi.create({
      data: props.data,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    await socialModuleProfilesToChatsApi.create({
      data: {
        profileId: socialModuleProfileId,
        chatId: socialModuleChat.id,
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
        },
      },
    });

    const socialModuleDefaultThread = await this.ensureDefaultThreadForChat({
      socialModuleChatId: socialModuleChat.id,
    });

    return {
      socialModuleChat,
      socialModuleProfileId,
      socialModuleDefaultThread,
    };
  }

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
      await this.service.socialModule.profilesToChats.find({
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
      await this.service.socialModule.profilesToChats.find({
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
      await this.service.socialModule.chatsToThreads.find({
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
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY not set");
    }

    const secretKey = RBAC_SECRET_KEY;
    const socialModuleChat = await this.service.socialModule.chat.findById({
      id: props.socialModuleChatId,
    });

    if (!socialModuleChat?.id) {
      throw new Error(
        "Validation error. Requested social-module chat does not exist",
      );
    }

    const socialModuleChatsToThreads =
      await this.service.socialModule.chatsToThreads.find({
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
      const socialModuleThreads = await this.service.socialModule.thread.find({
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
      });

      const defaultSocialModuleThreads =
        socialModuleThreads?.filter((socialModuleThread) => {
          return socialModuleThread.variant === "default";
        }) || [];

      if (defaultSocialModuleThreads.length > 1) {
        throw new Error(
          "Validation error. Requested social-module chat has multiple default threads",
        );
      }

      if (defaultSocialModuleThreads.length === 1) {
        return defaultSocialModuleThreads[0];
      }
    }

    const socialModuleDefaultThread = await socialModuleThreadApi.create({
      data: {
        variant: "default",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": secretKey,
        },
      },
    });

    if (!socialModuleDefaultThread?.id) {
      throw new Error(
        "Internal server error. Failed to create default thread for chat",
      );
    }

    const persistedDefaultThread = await socialModuleThreadApi.findById({
      id: socialModuleDefaultThread.id,
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": secretKey,
        },
      },
    });

    if (!persistedDefaultThread?.id) {
      throw new Error(
        "Internal server error. Created default thread was not found",
      );
    }

    try {
      await socialModuleChatsToThreadsApi.create({
        data: {
          chatId: props.socialModuleChatId,
          threadId: persistedDefaultThread.id,
          variant: "default",
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": secretKey,
          },
        },
      });
    } catch {
      throw new Error(
        `Internal server error. Failed to link default thread to chat. chatId=${props.socialModuleChatId}; threadId=${persistedDefaultThread.id}`,
      );
    }

    return persistedDefaultThread;
  }

  private async resolveSubjectProfileId(props: {
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
        await this.service.socialModule.profile.findById({
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
      const socialModuleProfiles = await this.service.socialModule.profile.find(
        {
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
        },
      );

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

  private async getSubjectLinkedProfileIds(props: {
    subjectId: string;
    requireAny?: boolean;
  }): Promise<string[]> {
    const subjectToProfiles =
      await this.service.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
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

  private async isSubjectAdmin(subjectId: string): Promise<boolean> {
    const subjectToRoles = await this.service.subjectsToRoles.find({
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

    const roles = await this.service.role.find({
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
