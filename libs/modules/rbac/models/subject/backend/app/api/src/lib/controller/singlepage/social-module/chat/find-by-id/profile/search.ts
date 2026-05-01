import { RBAC_JWT_SECRET, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";
import { internationalization } from "@sps/shared-configuration";
import { IModel as ISocialModuleProfile } from "@sps/social/models/profile/sdk/model";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  private normalizeLimit(value: string | undefined) {
    const parsedLimit = Number.parseInt(value || "20", 10);

    if (Number.isNaN(parsedLimit)) {
      return 20;
    }

    return Math.min(Math.max(parsedLimit, 1), 50);
  }

  private profileSearchColumns() {
    return [
      "slug",
      "adminTitle",
      ...internationalization.languages.flatMap((language) => {
        return [`title->>${language.code}`, `subtitle->>${language.code}`];
      }),
    ];
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

      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      await this.service.socialModuleChatLifecycleAssertSubjectOwnsChat({
        subjectId: id,
        socialModuleChatId,
      });

      const query = c.req.query("q")?.trim() || "";
      const limit = this.normalizeLimit(c.req.query("limit"));

      if (query.length < 2) {
        return c.json({
          data: [],
        });
      }

      const socialModuleProfilesToChats =
        await this.service.socialModule.profilesToChats.find({
          params: {
            filters: {
              and: [
                {
                  column: "chatId",
                  method: "eq",
                  value: socialModuleChatId,
                },
              ],
            },
          },
        });
      const currentProfileIds = new Set(
        (socialModuleProfilesToChats || [])
          .map((relation: any) => {
            return relation.profileId;
          })
          .filter((profileId: unknown): profileId is string => {
            return typeof profileId === "string" && Boolean(profileId);
          }),
      );
      const profilesById = new Map<string, ISocialModuleProfile>();

      for (const column of this.profileSearchColumns()) {
        const socialModuleProfiles =
          await this.service.socialModule.profile.find({
            params: {
              limit,
              orderBy: {
                and: [
                  {
                    column: "slug",
                    method: "asc",
                  },
                ],
              },
              filters: {
                and: [
                  {
                    column,
                    method: "ilike",
                    value: query,
                  },
                ],
              },
            },
          });

        for (const socialModuleProfile of socialModuleProfiles || []) {
          if (!socialModuleProfile?.id) {
            continue;
          }

          if (currentProfileIds.has(socialModuleProfile.id)) {
            continue;
          }

          profilesById.set(socialModuleProfile.id, socialModuleProfile);

          if (profilesById.size >= limit) {
            break;
          }
        }

        if (profilesById.size >= limit) {
          break;
        }
      }

      return c.json({
        data: Array.from(profilesById.values()).slice(0, limit),
      });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
