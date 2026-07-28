import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../service";
import { getHttpErrorType } from "@sps/backend-utils";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  protected normalizeLimit(value: string | undefined) {
    const parsedLimit = Number.parseInt(value || "20", 10);

    if (Number.isNaN(parsedLimit)) {
      return 20;
    }

    return Math.min(Math.max(parsedLimit, 1), 50);
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
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
        return c.json({ data: [] });
      }

      const existingAgentSubjectIds = await this.findAgentSubjectIdsInChat({
        socialModuleChatId,
      });
      const subjects = await this.service.find({
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
                column: "variant",
                method: "eq",
                value: "agent",
              },
              {
                column: "slug",
                method: "ilike",
                value: query,
              },
            ],
          },
        },
      });

      return c.json({
        data: (subjects || [])
          .filter((subject) => {
            return !existingAgentSubjectIds.has(subject.id);
          })
          .slice(0, limit),
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }

  private async findAgentSubjectIdsInChat(props: {
    socialModuleChatId: string;
  }) {
    const profileChatRelations =
      await this.service.socialModule.profilesToChats.find({
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
    const profileIds =
      profileChatRelations
        ?.map((relation) => relation.profileId)
        .filter((profileId): profileId is string => Boolean(profileId)) || [];

    if (!profileIds.length) {
      return new Set<string>();
    }

    const subjectProfileRelations =
      await this.service.subjectsToSocialModuleProfiles.find({
        params: {
          filters: {
            and: [
              {
                column: "socialModuleProfileId",
                method: "inArray",
                value: profileIds,
              },
            ],
          },
        },
      });
    const subjectIds =
      subjectProfileRelations
        ?.map((relation) => relation.subjectId)
        .filter((subjectId): subjectId is string => Boolean(subjectId)) || [];

    if (!subjectIds.length) {
      return new Set<string>();
    }

    const agentSubjects = await this.service.find({
      params: {
        filters: {
          and: [
            {
              column: "id",
              method: "inArray",
              value: subjectIds,
            },
            {
              column: "variant",
              method: "eq",
              value: "agent",
            },
          ],
        },
      },
    });

    return new Set(
      (agentSubjects || [])
        .map((subject) => subject.id)
        .filter((subjectId): subjectId is string => Boolean(subjectId)),
    );
  }
}
