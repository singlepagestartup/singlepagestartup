import { HTTPException } from "hono/http-exception";
import { model } from "@sps/sps-website-builder-models-page-backend-model";
import { Context } from "hono";
import { BlankInput, Next } from "hono/types";
import { services } from "../../services";
import { MiddlewaresGeneric } from "@sps/shared-backend-api";

export const handler = async (
  c: Context<MiddlewaresGeneric, string, BlankInput>,
  next: Next,
) => {
  const query = c.req.query("url");
  const sanitizedUrl = query?.split("?")[0];
  let url = sanitizedUrl;

  // Vercel changes url "/" to "index" so we need to change it back
  if (!url || url === "/index") {
    url = "/";
  }

  if (url === "favicon.ico") {
    return c.json({
      ok: true,
    });
  }

  const filledPages = await services.getFilledPages();

  const targetPage = filledPages.find((page) => {
    const cuttedLastSlash = url !== "/" ? url?.replace(/\/$/, "") : url;

    if (
      page.urls.find((urlParam) => {
        if (urlParam.url === cuttedLastSlash) {
          return true;
        }

        return false;
      })
    ) {
      return true;
    }

    return false;
  });

  return c.json({
    data: targetPage,
  });
};
