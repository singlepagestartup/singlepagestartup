import { getHttpErrorType } from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../service";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const socialModuleChatId = c.req.param("socialModuleChatId");

      if (!socialModuleChatId) {
        throw new Error("Validation error. No socialModuleChatId provided");
      }

      const chatRelations =
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
      const profileIds = Array.from(
        new Set(
          (chatRelations || [])
            .map((relation: { profileId?: string }) => relation.profileId)
            .filter((id: unknown): id is string => typeof id === "string"),
        ),
      );

      if (!profileIds.length) {
        return c.json({ data: [] });
      }

      const profiles = await this.service.socialModule.profile.find({
        params: {
          filters: {
            and: [
              { column: "id", method: "inArray", value: profileIds },
              {
                column: "variant",
                method: "eq",
                value: "artificial-intelligence",
              },
            ],
          },
        },
      });
      const candidateIds = (profiles || [])
        .map((profile) => profile.id)
        .filter((id: unknown): id is string => typeof id === "string");

      if (!candidateIds.length) {
        return c.json({ data: [] });
      }

      const subjectRelations =
        await this.service.subjectsToSocialModuleProfiles.find({
          params: {
            filters: {
              and: [
                {
                  column: "socialModuleProfileId",
                  method: "inArray",
                  value: candidateIds,
                },
              ],
            },
          },
        });
      const subjectIds = Array.from(
        new Set(
          (subjectRelations || [])
            .map((relation) => relation.subjectId)
            .filter((id): id is string => typeof id === "string"),
        ),
      );
      const agentSubjects = subjectIds.length
        ? await this.service.find({
            params: {
              filters: {
                and: [
                  { column: "id", method: "inArray", value: subjectIds },
                  { column: "variant", method: "eq", value: "agent" },
                ],
              },
            },
          })
        : [];
      const agentSubjectIds = new Set(
        (agentSubjects || []).map((subject) => subject.id),
      );
      const manageableProfileIds = new Set(
        (subjectRelations || [])
          .filter((relation) => agentSubjectIds.has(relation.subjectId))
          .map((relation) => relation.socialModuleProfileId),
      );
      const manageableProfiles = (profiles || [])
        .filter((profile) => manageableProfileIds.has(profile.id))
        .sort((left, right) => {
          const leftTitle = String(left.adminTitle || left.slug || left.id);
          const rightTitle = String(right.adminTitle || right.slug || right.id);

          return (
            leftTitle.localeCompare(rightTitle) ||
            String(left.id).localeCompare(String(right.id))
          );
        });

      return c.json({ data: manageableProfiles });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
