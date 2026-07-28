import { IRepository } from "@sps/shared-backend-api";
import { RBAC_SECRET_KEY } from "@sps/shared-utils";
import { api as socialModuleProfileApi } from "@sps/social/models/profile/sdk/server";
import { api as socialModuleProfilesToChatsApi } from "@sps/social/relations/profiles-to-chats/sdk/server";
import { api as subjectsToSocialModuleProfilesApi } from "@sps/rbac/relations/subjects-to-social-module-profiles/sdk/server";

export type IExecuteProps = {
  socialModuleChatId: string;
};

export class Service {
  repository: IRepository;

  constructor(repository: IRepository) {
    this.repository = repository;
  }

  async execute(props: IExecuteProps) {
    if (!RBAC_SECRET_KEY) {
      throw new Error(
        "Configuration error. RBAC_SECRET is not defined in the service",
      );
    }

    const socialModuleProfilesToChats =
      await socialModuleProfilesToChatsApi.find({
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
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!socialModuleProfilesToChats?.length) {
      throw new Error(
        "Validation error. No profiles found for the given chat ID",
      );
    }

    const socialModuleProfiles = await socialModuleProfileApi.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: socialModuleProfilesToChats.map(
                (entity) => entity.profileId,
              ),
            },
          ],
        },
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
          "Cache-Control": "no-store",
        },
      },
    });

    if (!socialModuleProfiles?.length) {
      throw new Error(
        "Validation error. No social module profiles found for the given chat ID",
      );
    }

    const subjectsToSocialModuleProfiles =
      await subjectsToSocialModuleProfilesApi.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "inArray",
                value: socialModuleProfiles.map((entity) => entity.id),
              },
            ],
          },
        },
        options: {
          headers: {
            "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY,
            "Cache-Control": "no-store",
          },
        },
      });

    if (!subjectsToSocialModuleProfiles?.length) {
      throw new Error(
        "Validation error. No subjects found for the given social module profile IDs",
      );
    }

    const subjectsIds = new Set(
      subjectsToSocialModuleProfiles.map((entity) => entity.subjectId),
    );

    const subjectsWithProfiles = Array.from(subjectsIds).map((subjectsId) => {
      return {
        id: subjectsId,
        socialModuleProfiles: subjectsToSocialModuleProfiles
          .filter((entity) => entity.subjectId === subjectsId)
          .map((entity) =>
            socialModuleProfiles.find(
              (profile) => profile.id === entity.socialModuleProfileId,
            ),
          ),
      };
    });

    return subjectsWithProfiles;
  }
}
