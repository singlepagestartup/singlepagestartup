import {
  AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES,
  HOST_SERVICE_URL,
  RBAC_SECRET_KEY,
} from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { getHttpErrorType, logger } from "@sps/backend-utils";
import { internationalization } from "@sps/shared-configuration";
import { runIdHeader } from "@sps/agent/models/agent/sdk/model";

export const PAGE_CACHE_SUPERSEDE_CHECK_INTERVAL_IN_MILLISECONDS = 60000;

export type IPageCacheStopReason = "superseded" | "failures";

export class Handler {
  service: Service;
  protected supersedeCheckedAt = 0;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("Configuration error. RBAC_SECRET_KEY not set");
      }

      logger.info("Host module page cache started");

      const runId = c.req.header(runIdHeader);
      const slug = c.req.path.replace(/\/+$/, "").split("/").pop() || "";

      this.supersedeCheckedAt = Date.now();

      const urls = await this.service.hostModule.page.urls();
      const hostServiceUrl = HOST_SERVICE_URL.replace(/\/+$/, "");

      let consecutiveFailures = 0;
      let stopped: IPageCacheStopReason | undefined;

      if (urls?.length) {
        for (const url of urls) {
          if (await this.isRunSuperseded({ slug, runId })) {
            stopped = "superseded";
            break;
          }

          for (const language of internationalization.languages) {
            const code =
              language.code === internationalization.defaultLanguage.code
                ? ""
                : language.code;
            const urlPath = url.url.replace(/^\/+|\/+$/g, "");
            const localizedPath = [code, urlPath].filter(Boolean).join("/");
            const rootSuffix = !urlPath && localizedPath ? "/" : "";

            const path = `${hostServiceUrl}/${localizedPath}${rootSuffix}`;

            try {
              await this.revalidatePage(path);

              const res = await fetch(path, {
                method: "GET",
              });

              if (!res.ok) {
                throw new Error("Internal error. Failed to fetch page");
              }

              consecutiveFailures = 0;
            } catch (err) {
              consecutiveFailures += 1;

              logger.error(path + " - Failed to fetch page", {
                page: path,
                error: err,
              });
            }

            if (
              consecutiveFailures >= AGENT_PAGE_CACHE_MAX_CONSECUTIVE_FAILURES
            ) {
              stopped = "failures";
              break;
            }
          }

          if (stopped) {
            break;
          }
        }
      }

      if (stopped) {
        logger.info("Host module page cache stopped", {
          reason: stopped,
          slug,
          runId,
        });

        return c.json({ data: { ok: false, stopped } });
      }

      logger.info("Host module page cache finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      const { status, message, details } = getHttpErrorType(error);

      throw new HTTPException(status, { message, cause: details });
    }
  }

  /**
   * A run that no longer owns its slug keeps loading Host for nothing, so the
   * marker is re-read between URLs, at most once per check interval.
   */
  async isRunSuperseded(props: {
    slug: string;
    runId?: string;
  }): Promise<boolean> {
    if (!props.runId) {
      return false;
    }

    const now = Date.now();

    if (
      now - this.supersedeCheckedAt <
      PAGE_CACHE_SUPERSEDE_CHECK_INTERVAL_IN_MILLISECONDS
    ) {
      return false;
    }

    this.supersedeCheckedAt = now;

    try {
      return await this.service.agentRun.isRunSuperseded({
        slug: props.slug,
        runId: props.runId,
      });
    } catch (error) {
      logger.error("Internal error. Failed to read the agent run marker", {
        error,
      });

      return false;
    }
  }

  async revalidatePage(path: string) {
    const res = await fetch(
      HOST_SERVICE_URL + `/api/revalidate?path=${path}&type=page`,
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Internal error. Failed to revalidate page");
        }
      })
      .catch((err) => {
        logger.error("Internal error. Failed to revalidate page", {
          error: err,
        });
      });

    return res;
  }
}
