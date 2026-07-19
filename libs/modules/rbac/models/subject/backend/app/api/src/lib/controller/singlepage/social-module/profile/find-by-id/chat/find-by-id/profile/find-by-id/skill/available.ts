import { getHttpErrorType } from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../service";
import { findProfileSkillIds, parsePagination, requireParam } from "./helpers";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const targetSocialModuleProfileId = requireParam(
        c,
        "targetSocialModuleProfileId",
      );
      const { limit, offset = 0 } = parsePagination(c);
      const search = c.req.query("search")?.trim().toLocaleLowerCase();
      const linkedIds = new Set(
        await findProfileSkillIds({
          service: this.service,
          targetSocialModuleProfileId,
        }),
      );
      const skills = await this.service.socialModule.skill.find({
        params: {
          orderBy: {
            and: [
              { column: "title", method: "asc" },
              { column: "createdAt", method: "asc" },
            ],
          },
        },
      });
      const available = (skills || []).filter((skill) => {
        if (linkedIds.has(skill.id)) {
          return false;
        }

        if (!search) {
          return true;
        }

        return [skill.title, skill.slug, skill.description].some((value) =>
          String(value || "")
            .toLocaleLowerCase()
            .includes(search),
        );
      });

      return c.json({
        data: available.slice(
          offset,
          limit === undefined ? undefined : offset + limit,
        ),
      });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
