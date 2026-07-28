import { getHttpErrorType } from "@sps/backend-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../../../../../../../../service";
import { requireParam } from "./helpers";

export class Handler {
  constructor(readonly service: Service) {}

  async execute(c: Context): Promise<Response> {
    try {
      const targetSocialModuleProfileId = requireParam(
        c,
        "targetSocialModuleProfileId",
      );
      const socialModuleSkillId = requireParam(c, "socialModuleSkillId");
      const relations = await this.service.socialModule.profilesToSkills.find({
        params: {
          filters: {
            and: [
              {
                column: "profileId",
                method: "eq",
                value: targetSocialModuleProfileId,
              },
              { column: "skillId", method: "eq", value: socialModuleSkillId },
            ],
          },
        },
      });

      await Promise.all(
        (relations || [])
          .filter((relation) => Boolean(relation.id))
          .map((relation) =>
            this.service.socialModule.profilesToSkills.delete({
              id: relation.id,
            }),
          ),
      );

      return c.json({ data: true });
    } catch (error: unknown) {
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
