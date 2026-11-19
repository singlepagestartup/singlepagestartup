import "reflect-metadata";
import { inject, injectable } from "inversify";
import { DI, RESTController } from "@sps/shared-backend-api";
import { Table } from "@sps/agent/models/work-attempt/backend/repository/database";
import { RequestSignedInSubject } from "@sps/rbac/models/subject/backend/app/middlewares";
import { getHttpErrorType } from "@sps/backend-utils";
import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { Service } from "./service";
import { maintenanceScope } from "./service/singlepage/maintenance";

@injectable()
export class Controller extends RESTController<typeof Table.$inferSelect> {
  constructor(@inject(DI.IService) private readonly work: Service) {
    super(work);
    const rbac = work.modules.rbac.subject;
    this.bindHttpRoutes([
      {
        method: "POST",
        path: "/:id/knowledge-index",
        middlewares: [
          new RequestSignedInSubject().init({
            getSubjectId: (token) =>
              rbac.isAuthorizedService.getSubjectId(token),
            isAuthenticated: async (subjectId) =>
              Boolean(
                (await rbac.authenticationMe({ subjectId }))?.authenticated,
              ),
          }),
        ],
        handler: (context) => this.queueIndex(context),
      },
    ]);
  }

  private async queueIndex(context: Context) {
    try {
      const actorId = z.uuid().parse(context.get("signedInSubjectId"));
      const scope = maintenanceScope.parse(
        await context.req.json().catch(() => null),
      );
      const data = await this.work.queueKnowledgeIndex(actorId, scope);
      return context.json({ data }, 202);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new HTTPException(422, {
          message: "Validation error. Invalid maintenance scope",
        });
      }
      const { status, message, details } = getHttpErrorType(error);
      throw new HTTPException(status, { message, cause: details });
    }
  }
}
