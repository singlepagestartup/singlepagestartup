import { HTTPException } from "hono/http-exception";
import { model } from "@sps/sps-website-builder-relations-slider-blocks-to-sliders-backend-model";
import { Context, Env } from "hono";
import { BlankInput, Next } from "hono/types";

export const handler = async (
  c: Context<Env, `${string}/:uuid`, BlankInput>,
  next: Next,
) => {
  try {
    const uuid = c.req.param("uuid");
    const body = await c.req.parseBody();

    if (!uuid) {
      return c.json(
        {
          message: "Invalid id",
        },
        {
          status: 400,
        },
      );
    }

    if (typeof body["data"] !== "string") {
      return c.json(
        {
          message: "Invalid body",
        },
        {
          status: 400,
        },
      );
    }

    const data = JSON.parse(body["data"]);

    const entity = await model.services.update({ id: uuid, data });

    return c.json({
      data: entity,
    });
  } catch (error: any) {
    throw new HTTPException(400, {
      message: error.message,
    });
  }
};
