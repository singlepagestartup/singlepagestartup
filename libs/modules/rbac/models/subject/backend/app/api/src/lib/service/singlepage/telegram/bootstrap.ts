import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { IModel as IRbacSubject } from "@sps/rbac/models/subject/sdk/model";
import { IModel as IRbacIdentity } from "@sps/rbac/models/identity/sdk/model";
import { api as rbacModuleIdentityApi } from "@sps/rbac/models/identity/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";
import { IModel as ISocialModuleChat } from "@sps/social/models/chat/sdk/model";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as socialModuleChatApi } from "@sps/social/models/chat/sdk/server";
import { IModel as ISocialModuleAttributeKey } from "@sps/social/models/attribute-key/sdk/model";
import { IModel as ISocialModuleAttribute } from "@sps/social/models/attribute/sdk/model";
import { api as socialModuleAttributeKeyApi } from "@sps/social/models/attribute-key/sdk/server";
import { api as socialModuleAttributeApi } from "@sps/social/models/attribute/sdk/server";
import { api as socialModuleAttributeKeysToAttributesApi } from "@sps/social/relations/attribute-keys-to-attributes/sdk/server";
import { api as socialModuleProfilesToAttributesApi } from "@sps/social/relations/profiles-to-attributes/sdk/server";
import { api as subjectsToIdentitiesApi } from "@sps/rbac/relations/subjects-to-identities/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { IModel as IRbacSubjectsToIdentities } from "@sps/rbac/relations/subjects-to-identities/sdk/model";
import { Service as SubjectsToIdentitiesService } from "@sps/rbac/relations/subjects-to-identities/backend/app/api/src/lib/service";
import { Service as SubjectsToSocialModuleProfilesService } from "@sps/rbac/relations/subjects-to-social-module-profiles/backend/app/api/src/lib/service";

export interface IExecuteProps {
  fromId: string;
  chatId: string;
  messageText?: string;
}

export interface IResult {
  rbacModuleSubject: IRbacSubject;
  socialModuleProfile: ISocialModuleProfile;
  socialModuleChat: ISocialModuleChat;
  registration: boolean;
  isStartCommand: boolean;
  shouldCheckoutFreeSubscription: boolean;
}

type IFindById = (props: { id: string }) => Promise<IRbacSubject | null>;

export interface IConstructorProps {
  findById: IFindById;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;
}

export class Service {
  findById: IFindById;
  subjectsToIdentities: SubjectsToIdentitiesService;
  subjectsToSocialModuleProfiles: SubjectsToSocialModuleProfilesService;

  constructor(props: IConstructorProps) {
    this.findById = props.findById;
    this.subjectsToIdentities = props.subjectsToIdentities;
    this.subjectsToSocialModuleProfiles = props.subjectsToSocialModuleProfiles;
  }

  private getSdkHeaders() {
    if (!RBAC_SECRET_KEY) {
      throw new Error("Configuration error. RBAC_SECRET_KEY is not set");
    }

    return {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
      "Cache-Control": "no-store",
    };
  }

  private parseStartMessage(messageText?: string) {
    const text = typeof messageText === "string" ? messageText.trim() : "";
    const match = text.match(/^\/start(?:\s+(.+))?$/);
    const referralCode = match?.[1]?.trim() || "";

    return {
      isStartCommand: Boolean(match),
      referralCode,
    };
  }

  private getCreatedAtTimestamp(value: unknown) {
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    const parsed = new Date(String(value)).getTime();

    if (Number.isNaN(parsed)) {
      return Number.MAX_SAFE_INTEGER;
    }

    return parsed;
  }

  private async resolveSubjectByIdentityLinks(props: {
    identityId: string;
    links: IRbacSubjectsToIdentities[];
  }) {
    const links = [...props.links].sort(
      (a, b) =>
        this.getCreatedAtTimestamp(a.createdAt) -
        this.getCreatedAtTimestamp(b.createdAt),
    );

    let selectedSubject: IRbacSubject | null = null;
    const duplicateLinkIds: string[] = [];

    for (const link of links) {
      const existingSubject = await this.findById({
        id: link.subjectId,
      });

      if (!selectedSubject && existingSubject) {
        selectedSubject = existingSubject;
        continue;
      }

      duplicateLinkIds.push(link.id);
    }

    for (const duplicateLinkId of duplicateLinkIds) {
      await subjectsToIdentitiesApi.delete({
        id: duplicateLinkId,
        options: {
          headers: this.getSdkHeaders(),
        },
      });
    }

    if (duplicateLinkIds.length) {
      console.warn(
        "telegram/bootstrap: removed duplicate subjects-to-identities links",
        {
          identityId: props.identityId,
          removedLinks: duplicateLinkIds,
        },
      );
    }

    if (!selectedSubject) {
      throw new Error(
        "Internal error. Subject not found for the given identity links",
      );
    }

    return selectedSubject;
  }

  private async resolveIdentityDuplicates(props: {
    account: string;
    provider: string;
    identities: IRbacIdentity[];
    headers: Record<string, string>;
  }) {
    const identities = [...props.identities].sort(
      (a, b) =>
        this.getCreatedAtTimestamp(a.createdAt) -
        this.getCreatedAtTimestamp(b.createdAt),
    );

    const linksByIdentity = new Map<string, IRbacSubjectsToIdentities[]>();

    for (const identity of identities) {
      const links = await this.subjectsToIdentities.find({
        params: {
          filters: {
            and: [
              {
                column: "identityId",
                method: "eq",
                value: identity.id,
              },
            ],
          },
        },
      });

      linksByIdentity.set(identity.id, links ?? []);
    }

    let selectedIdentity = identities[0];

    for (const identity of identities) {
      const links = linksByIdentity.get(identity.id) ?? [];

      if (links.length) {
        selectedIdentity = identity;
        break;
      }
    }

    const selectedLinks = linksByIdentity.get(selectedIdentity.id) ?? [];
    const selectedSubjectIds = new Set(
      selectedLinks.map((link) => link.subjectId),
    );
    const mergedIdentityIds: string[] = [];

    for (const identity of identities) {
      if (identity.id === selectedIdentity.id) {
        continue;
      }

      const identityLinks = linksByIdentity.get(identity.id) ?? [];

      for (const link of identityLinks) {
        if (selectedSubjectIds.has(link.subjectId)) {
          continue;
        }

        await subjectsToIdentitiesApi.create({
          data: {
            subjectId: link.subjectId,
            identityId: selectedIdentity.id,
          },
          options: {
            headers: props.headers,
          },
        });

        selectedSubjectIds.add(link.subjectId);
      }

      await rbacModuleIdentityApi.delete({
        id: identity.id,
        options: {
          headers: props.headers,
        },
      });

      mergedIdentityIds.push(identity.id);
    }

    if (mergedIdentityIds.length) {
      console.warn("telegram/bootstrap: merged duplicate identities", {
        account: props.account,
        provider: props.provider,
        selectedIdentityId: selectedIdentity.id,
        removedIdentityIds: mergedIdentityIds,
      });
    }

    return selectedIdentity;
  }

  async execute(props: IExecuteProps): Promise<IResult> {
    if (!props.fromId) {
      throw new Error("Validation error. 'fromId' is required");
    }

    if (!props.chatId) {
      throw new Error("Validation error. 'chatId' is required");
    }

    const headers = this.getSdkHeaders();
    let registration = false;
    let subject: IRbacSubject | null = null;
    let profile: ISocialModuleProfile | null = null;
    let chat: ISocialModuleChat | null = null;

    const identities = await rbacModuleIdentityApi.find({
      params: {
        filters: {
          and: [
            {
              column: "account",
              method: "eq",
              value: props.fromId,
            },
            {
              column: "provider",
              method: "eq",
              value: "telegram",
            },
          ],
        },
      },
      options: { headers },
    });

    if (identities?.length) {
      const identity =
        identities.length > 1
          ? await this.resolveIdentityDuplicates({
              account: props.fromId,
              provider: "telegram",
              identities,
              headers,
            })
          : identities[0];
      const subjectsToIdentities = await this.subjectsToIdentities.find({
        params: {
          filters: {
            and: [
              {
                column: "identityId",
                method: "eq",
                value: identity.id,
              },
            ],
          },
        },
      });

      if (subjectsToIdentities?.length) {
        subject = await this.resolveSubjectByIdentityLinks({
          identityId: identity.id,
          links: subjectsToIdentities,
        });
      } else {
        subject = await api.create({
          data: {},
          options: { headers },
        });

        await subjectsToIdentitiesApi.create({
          data: {
            subjectId: subject.id,
            identityId: identity.id,
          },
          options: { headers },
        });
      }
    } else {
      const identity = await rbacModuleIdentityApi.create({
        data: {
          account: props.fromId,
          provider: "telegram",
        },
        options: { headers },
      });

      subject = await api.create({
        data: {},
        options: { headers },
      });

      await subjectsToIdentitiesApi.create({
        data: {
          subjectId: subject.id,
          identityId: identity.id,
        },
        options: { headers },
      });

      registration = true;
    }

    const subjectToProfiles = await this.subjectsToSocialModuleProfiles.find({
      params: {
        filters: {
          and: [
            {
              column: "subjectId",
              method: "eq",
              value: subject.id,
            },
          ],
        },
      },
    });

    if (subjectToProfiles?.length) {
      const socialModuleProfiles = await socialModuleProfileApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: subjectToProfiles.map(
                  (item) => item.socialModuleProfileId,
                ),
              },
              {
                column: "variant",
                method: "eq",
                value: "telegram",
              },
            ],
          },
        },
        options: { headers },
      });

      if (socialModuleProfiles?.length) {
        if (socialModuleProfiles.length > 1) {
          throw new Error(
            "Internal error. Multiple social module profiles found for the same subject",
          );
        }

        profile = socialModuleProfiles[0];
      } else {
        profile = await socialModuleProfileApi.create({
          data: {
            variant: "telegram",
          },
          options: { headers },
        });

        await subjectsToSocialModuleProfilesApi.create({
          data: {
            subjectId: subject.id,
            socialModuleProfileId: profile.id,
          },
          options: { headers },
        });
      }
    } else {
      profile = await socialModuleProfileApi.create({
        data: {
          variant: "telegram",
        },
        options: { headers },
      });

      await subjectsToSocialModuleProfilesApi.create({
        data: {
          subjectId: subject.id,
          socialModuleProfileId: profile.id,
        },
        options: { headers },
      });
    }

    const { isStartCommand, referralCode } = this.parseStartMessage(
      props.messageText,
    );

    if (isStartCommand && referralCode) {
      let socialModuleReferrerAttributeKey: ISocialModuleAttributeKey;

      const socialModuleAttributeKeys = await socialModuleAttributeKeyApi.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: "referrer",
              },
            ],
          },
        },
        options: { headers },
      });

      if (socialModuleAttributeKeys?.length) {
        socialModuleReferrerAttributeKey = socialModuleAttributeKeys[0];
      } else {
        socialModuleReferrerAttributeKey =
          await socialModuleAttributeKeyApi.create({
            data: {
              adminTitle: "Referrer",
              title: {
                ru: "Реферрер",
                en: "Referrer",
              },
              slug: "referrer",
            },
            options: { headers },
          });
      }

      let socialModuleReferrerAttribute: ISocialModuleAttribute;

      const socialModuleAttributes = await socialModuleAttributeApi.find({
        params: {
          filters: {
            and: [
              {
                column: "slug",
                method: "eq",
                value: `${profile.id}-invitedby-${referralCode}`,
              },
            ],
          },
        },
        options: { headers },
      });

      if (socialModuleAttributes?.length) {
        socialModuleReferrerAttribute = socialModuleAttributes[0];
      } else {
        socialModuleReferrerAttribute = await socialModuleAttributeApi.create({
          data: {
            adminTitle: `${profile.id} | Referral Code | ${referralCode}`,
            string: {
              ru: referralCode,
              en: referralCode,
            },
            slug: `${profile.id}-invitedby-${referralCode}`,
          },
          options: { headers },
        });
      }

      const socialModuleAttributeKeysToAttributes =
        await socialModuleAttributeKeysToAttributesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "attributeKeyId",
                  method: "eq",
                  value: socialModuleReferrerAttributeKey.id,
                },
                {
                  column: "attributeId",
                  method: "eq",
                  value: socialModuleReferrerAttribute.id,
                },
              ],
            },
          },
          options: { headers },
        });

      if (!socialModuleAttributeKeysToAttributes?.length) {
        await socialModuleAttributeKeysToAttributesApi.create({
          data: {
            attributeKeyId: socialModuleReferrerAttributeKey.id,
            attributeId: socialModuleReferrerAttribute.id,
          },
          options: { headers },
        });
      }

      const socialModuleProfilesToAttributes =
        await socialModuleProfilesToAttributesApi.find({
          params: {
            filters: {
              and: [
                {
                  column: "profileId",
                  method: "eq",
                  value: profile.id,
                },
                {
                  column: "attributeId",
                  method: "eq",
                  value: socialModuleReferrerAttribute.id,
                },
              ],
            },
          },
          options: { headers },
        });

      if (!socialModuleProfilesToAttributes?.length) {
        await socialModuleProfilesToAttributesApi.create({
          data: {
            profileId: profile.id,
            attributeId: socialModuleReferrerAttribute.id,
          },
          options: { headers },
        });
      }
    }

    const socialModuleProfilesToChats =
      await socialModuleProfilesToChatsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: profile.id,
              },
            ],
          },
        },
        options: { headers },
      });

    if (!socialModuleProfilesToChats?.length) {
      chat = await socialModuleChatApi.create({
        data: {
          variant: "telegram",
          sourceSystemId: props.chatId,
        },
        options: { headers },
      });

      await socialModuleProfilesToChatsApi.create({
        data: {
          profileId: profile.id,
          chatId: chat.id,
        },
        options: { headers },
      });
    } else {
      const socialModuleChats = await socialModuleChatApi.find({
        params: {
          filters: {
            and: [
              {
                column: "id",
                method: "inArray",
                value: socialModuleProfilesToChats.map((item) => item.chatId),
              },
              {
                column: "variant",
                method: "eq",
                value: "telegram",
              },
              {
                column: "sourceSystemId",
                method: "eq",
                value: props.chatId,
              },
            ],
          },
        },
        options: { headers },
      });

      if (socialModuleChats?.length) {
        if (socialModuleChats.length > 1) {
          throw new Error(
            "Internal error. Multiple social module chats found for the same profile",
          );
        }

        chat = socialModuleChats[0];
      } else {
        chat = await socialModuleChatApi.create({
          data: {
            variant: "telegram",
            sourceSystemId: props.chatId,
          },
          options: { headers },
        });

        await socialModuleProfilesToChatsApi.create({
          data: {
            profileId: profile.id,
            chatId: chat.id,
          },
          options: { headers },
        });
      }
    }

    const telegramBotAgentSocialModuleProfiles =
      await socialModuleProfileApi.find({
        params: {
          filters: {
            and: [
              {
                column: "variant",
                method: "inArray",
                value: ["agent", "artificial-intelligence"],
              },
            ],
          },
        },
        options: { headers },
      });

    if (telegramBotAgentSocialModuleProfiles?.length) {
      const existingProfileToChats = await socialModuleProfilesToChatsApi.find({
        params: {
          filters: {
            and: [
              {
                column: "chatId",
                method: "eq",
                value: chat.id,
              },
            ],
          },
        },
        options: { headers },
      });

      if (existingProfileToChats?.length) {
        for (const agentProfile of telegramBotAgentSocialModuleProfiles) {
          const exists = existingProfileToChats.find(
            (profileToChat) => profileToChat.profileId === agentProfile.id,
          );

          if (!exists) {
            await socialModuleProfilesToChatsApi.create({
              data: {
                profileId: agentProfile.id,
                chatId: chat.id,
              },
              options: { headers },
            });
          }
        }
      }
    }

    return {
      rbacModuleSubject: subject,
      socialModuleProfile: profile,
      socialModuleChat: chat,
      registration,
      isStartCommand,
      shouldCheckoutFreeSubscription: registration || isStartCommand,
    };
  }
}
