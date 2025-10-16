import { HOST_SERVICE_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Service } from "../../../service";
import { logger } from "@sps/backend-utils";
import { api as hostModulePageApi } from "@sps/host/models/page/sdk/server";
import { internationalization } from "@sps/shared-configuration";

export class Handler {
  service: Service;

  constructor(service: Service) {
    this.service = service;
  }

  async execute(c: Context, next: any): Promise<Response> {
    try {
      if (!RBAC_SECRET_KEY) {
        throw new Error("RBAC_SECRET_KEY not set");
      }

      logger.info("Host module page cache started");

      const urls = await hostModulePageApi.urls({});

      if (urls?.length) {
        for (const [index, url] of urls.entries()) {
          for (const language of internationalization.languages) {
            const code =
              language.code === internationalization.defaultLanguage.code
                ? ""
                : language.code + "/";

            const path = HOST_SERVICE_URL + "/" + code + url.url.join("/");

            logger.info(`🔄 Revalidating page ${index + 1} of ${urls.length}`, {
              page: path,
            });

            try {
              await this.revalidatePage(path);

              const res = await fetch(path, {
                method: "GET",
              });

              if (!res.ok) {
                throw new Error("Failed to fetch page");
              }

              logger.info(
                `✅ Revalidated page ${index + 1} of ${urls.length}`,
                {
                  page: path,
                },
              );
            } catch (err) {
              logger.error(path + " - Failed to fetch page", {
                page: path,
                error: err,
              });
            }
          }
        }
      }

      logger.info("Host module page cache finished");

      return c.json({ data: { ok: true } });
    } catch (error: any) {
      throw new HTTPException(500, {
        message: error.message || "Internal Server Error",
        cause: error,
      });
    }
  }

  async revalidatePage(path: string) {
    const res = await fetch(
      HOST_SERVICE_URL + `/api/revalidate?path=${path}&type=page`,
    )
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to revalidate page");
        }
      })
      .catch((err) => {
        logger.error("Failed to revalidate page", {
          error: err,
        });
      });

    return res;
  }
}
