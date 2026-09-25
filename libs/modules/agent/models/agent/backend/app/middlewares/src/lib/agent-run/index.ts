import { createMiddleware } from "hono/factory";
import { MiddlewareHandler } from "hono";
import { runIdHeader } from "@sps/agent/models/agent/sdk/model";
import { logger } from "@sps/backend-utils";

export interface IMiddlewareGeneric {}

type IService = {
  agentRun: {
    markFinished(props: {
      slug: string;
      runId: string;
      result: Record<string, unknown>;
    }): Promise<boolean>;
  };
};

/**
 * Closes the run of an agent that the cron runner dispatched.
 *
 * The runner abandons the request as soon as the dispatch window ends, so the
 * only side that observes the real outcome is this one. The marker is written
 * in a `finally`, which makes a thrown handler finish its run as well.
 */
export class Middleware {
  constructor(private readonly service: IService) {}

  init(): MiddlewareHandler<any, any, {}> {
    return createMiddleware(async (c, next) => {
      const runId = c.req.header(runIdHeader);

      if (!runId) {
        return next();
      }

      const slug = c.req.path.replace(/\/+$/, "").split("/").pop();

      if (!slug) {
        return next();
      }

      let result: Record<string, unknown> = { error: "Unknown error" };

      try {
        await next();

        const status = c.res?.status || 200;

        result =
          status >= 400
            ? {
                status,
                error: `Internal error. Agent responded with ${status}`,
              }
            : { status, ok: true };
      } catch (error: any) {
        result = { error: error?.message || "Unknown error" };

        throw error;
      } finally {
        try {
          await this.service.agentRun.markFinished({ slug, runId, result });
        } catch (error) {
          logger.error(
            `❌ Error during finishing agent run '${runId}' of '${slug}':`,
            error,
          );
        }
      }
    });
  }
}
