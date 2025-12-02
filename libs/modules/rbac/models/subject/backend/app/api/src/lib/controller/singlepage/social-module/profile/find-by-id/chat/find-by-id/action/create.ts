import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";
import { api as socialModuleProfilesToActionsApi } from "@sps/social/relations/profiles-to-actions/sdk/server";
import { api as socialModuleActionApi } from "@sps/social/models/action/sdk/server";
import { api as socialModuleProfilesApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleChatsToActionsApi } from "@sps/social/relations/chats-to-actions/sdk/server";
import { api } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";
import { getHttpErrorType } from "@sps/backend-utils";
import { IModel as ISocialModuleAction } from "@sps/social/models/action/sdk/model";
import { api as notificationModuleTemplateApi } from "@sps/notification/models/template/sdk/server";

const DEGUG = false;
export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_JWT_SECRET) {
        throw new Error("Configuration error. RBAC_JWT_SECRET not set");
      }

      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      const id = c.req.param("id");

      if (!id) {
        throw new Error("Validation error. No id provided");
      }

      const socialModuleProfileId = c.req.param("socialModuleProfileId");

      if (!socialModuleProfileId) {
        throw new Error("Validation error. No socialModuleProfileId provided");
      }

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      const body = await c.req.parseBody();

      if (typeof body["data"] !== "string") {
        throw new Error(
          "Invalid body. Expected body['data'] with type of JSON.stringify(...). Got: " +
            typeof body["data"],
        );
      }

      let data;
      try {
        data = JSON.parse(body["data"]);
      } catch (error) {
        throw new Error(
          "Validation error. Invalid JSON in body['data']. Got: " +
            body["data"],
        );
      }

      const socialMouleAction = await socialModuleActionApi.create({
        data,
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      await socialModuleChatsToActionsApi.create({
        data: {
          actionId: socialMouleAction.id,
          chatId: socialModuleChatId,
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          },
        },
      });

      socialModuleProfilesToActionsApi
        .create({
          data: {
            actionId: socialMouleAction.id,
            profileId: socialModuleProfileId,
          },
          options: {
            headers: {
              "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            },
          },
        })
        .then(() => {
          // this.notifyOtherSubjectsInChat({
          //   id,
          //   socialModuleChatId,
          //   socialModuleMessage: socialMouleMessage,
          //   socialModuleProfileId,
          // });
        });

      return c.json({
        data: socialMouleAction,
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  // async notifyOtherSubjectsInChat(props: {
  //   id: string;
  //   socialModuleChatId: string;
  //   socialModuleMessage: ISocialModuleMessage;
  //   socialModuleProfileId: string;
  // }) {
  //   if (!RBAC_SECRET_KEY) {
  //     throw new Error("Configuration error. RBAC_SECRET_KEY not set");
  //   }

  //   const socialModuleProfilesToChats =
  //     await socialModuleProfilesToChatsApi.find({
  //       params: {
  //         filters: {
  //           and: [
  //             {
  //               column: "chatId",
  //               method: "eq",
  //               value: props.socialModuleChatId,
  //             },
  //             {
  //               column: "profileId",
  //               method: "ne",
  //               value: props.socialModuleProfileId,
  //             },
  //           ],
  //         },
  //       },
  //       options: {
  //         headers: {
  //           "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
  //           "Cache-Control": "no-store",
  //         },
  //       },
  //     });

  //   if (!socialModuleProfilesToChats?.length) {
  //     return;
  //   }

  //   const subjectsToSocialModuleProfiles =
  //     await subjectsToSocialModuleProfilesApi.find({
  //       params: {
  //         filters: {
  //           and: [
  //             {
  //               column: "socialModuleProfileId",
  //               method: "inArray",
  //               value: socialModuleProfilesToChats.map(
  //                 (socialModuleProfileToChat) =>
  //                   socialModuleProfileToChat.profileId,
  //               ),
  //             },
  //           ],
  //         },
  //       },
  //       options: {
  //         headers: {
  //           "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
  //           "Cache-Control": "no-store",
  //         },
  //       },
  //     });

  //   if (!subjectsToSocialModuleProfiles?.length) {
  //     return;
  //   }

  //   const socialModuleProfiles = await socialModuleProfilesApi.find({
  //     params: {
  //       filters: {
  //         and: [
  //           {
  //             column: "id",
  //             method: "inArray",
  //             value: socialModuleProfilesToChats.map(
  //               (profileToChat) => profileToChat.profileId,
  //             ),
  //           },
  //         ],
  //       },
  //     },
  //     options: {
  //       headers: {
  //         "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
  //         "Cache-Control": "no-store",
  //       },
  //     },
  //   });

  //   if (!socialModuleProfiles?.length) {
  //     return;
  //   }

  //   const filteredSubjectsToSocialModuleProfiles =
  //     subjectsToSocialModuleProfiles.filter((subjectToSocialModuleProfile) =>
  //       socialModuleProfiles.some(
  //         (profile) =>
  //           profile.id === subjectToSocialModuleProfile.socialModuleProfileId,
  //       ),
  //     );

  //   const subjects = await api.find({
  //     params: {
  //       filters: {
  //         and: [
  //           {
  //             column: "id",
  //             method: "inArray",
  //             value: filteredSubjectsToSocialModuleProfiles.map(
  //               (subjectToSocialModuleProfile) =>
  //                 subjectToSocialModuleProfile.subjectId,
  //             ),
  //           },
  //         ],
  //       },
  //     },
  //     options: {
  //       headers: {
  //         "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
  //       },
  //     },
  //   });

  //   const socialModuleGenerateSocialModuleMessageCreatedTemplates =
  //     await notificationModuleTemplateApi.find({
  //       params: {
  //         filters: {
  //           and: [
  //             {
  //               column: "variant",
  //               method: "ilike",
  //               value: "-social-module-message-created",
  //             },
  //           ],
  //         },
  //       },
  //     });

  //   if (
  //     subjects?.length &&
  //     socialModuleGenerateSocialModuleMessageCreatedTemplates?.length
  //   ) {
  //     for (const subject of subjects) {
  //       const subjectToSocialModuleProfiles =
  //         subjectsToSocialModuleProfiles.filter(
  //           (subjectToSocialModuleProfile) =>
  //             subjectToSocialModuleProfile.subjectId === subject.id,
  //         );

  //       if (!subjectToSocialModuleProfiles.length) {
  //         continue;
  //       }

  //       const subjectsWithProfiles =
  //         await this.service.socialModuleChatSubjectsWithSocialModuleProfiles({
  //           socialModuleChatId: props.socialModuleChatId,
  //         });

  //       DEGUG &&
  //         console.log(
  //           "🚀 ~ Handler ~ notifyOtherSubjectsInChat ~ subjectsWithProfiles:",
  //           subjectsWithProfiles,
  //           "from",
  //           props.id,
  //           "to",
  //           subject.id,
  //         );

  //       const chatHasManInTheLoop = subjectsWithProfiles.some((entity) => {
  //         return entity.socialModuleProfiles.length > 1;
  //       });

  //       const messageIsFromProfileWithAI = subjectsWithProfiles.some(
  //         (entity) => {
  //           return entity.socialModuleProfiles.some(
  //             (socialModuleProfile) =>
  //               socialModuleProfile?.variant === "artificial-intelligence" &&
  //               props.socialModuleProfileId === socialModuleProfile.id,
  //           );
  //         },
  //       );

  //       DEGUG &&
  //         console.log(
  //           "🚀 ~ Handler ~ notifyOtherSubjectsInChat ~ messageIsFromProfileWithAI:",
  //           messageIsFromProfileWithAI,
  //         );

  //       DEGUG &&
  //         console.log(
  //           "🚀 ~ Handler ~ notifyOtherSubjectsInChat ~ chatHasManInTheLoop:",
  //           chatHasManInTheLoop,
  //         );

  //       for (const socialModuleGenerateSocialModuleMessageCreatedTemplate of socialModuleGenerateSocialModuleMessageCreatedTemplates) {
  //         const method =
  //           socialModuleGenerateSocialModuleMessageCreatedTemplate.variant
  //             .replace("-social-module-message-created", "")
  //             .replace("generate-", ""); // e.g., "telegram"

  //         const notificationServiceNotifications = await api.notify({
  //           id: subject.id,
  //           data: {
  //             notification: {
  //               topic: {
  //                 slug: "information",
  //               },
  //               template: {
  //                 variant:
  //                   socialModuleGenerateSocialModuleMessageCreatedTemplate.variant,
  //               },
  //               notification: {
  //                 method: method,
  //                 data: JSON.stringify({
  //                   socialModule: {
  //                     message: props.socialModuleMessage,
  //                   },
  //                 }),
  //               },
  //             },
  //           },
  //           options: {
  //             headers: {
  //               "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
  //             },
  //           },
  //         });

  //         const notificationServiceNotificationSourceSystemId =
  //           notificationServiceNotifications?.notificationService.notifications?.find(
  //             (notification) => notification.sourceSystemId,
  //           )?.sourceSystemId;

  //         if (notificationServiceNotificationSourceSystemId) {
  //           await socialModuleMessageApi.update({
  //             id: props.socialModuleMessage.id,
  //             data: {
  //               ...props.socialModuleMessage,
  //               sourceSystemId: notificationServiceNotificationSourceSystemId,
  //             },
  //             options: {
  //               headers: {
  //                 "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
  //               },
  //             },
  //           });
  //         }

  //         // for (const subjectToSocialModuleProfile of subjectToSocialModuleProfiles) {
  //         //   api.socialModuleProfileFindByIdChatFindByIdMessageFindByIdReact({
  //         //     id: subject.id,
  //         //     socialModuleProfileId:
  //         //       subjectToSocialModuleProfile.socialModuleProfileId,
  //         //     socialModuleChatId: props.socialModuleChatId,
  //         //     socialModuleMessageId: props.socialModuleMessage.id,
  //         //     data: {},
  //         //     options: {
  //         //       headers: {
  //         //         "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
  //         //       },
  //         //     },
  //         //   });
  //         // }
  //       }
  //     }
  //   }
  // }
}
