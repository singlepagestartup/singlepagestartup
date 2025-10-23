import { Context } from "hono";
import { BlankInput, Env, Next } from "hono/types";

export const middleware = async (
  c: Context<Env, "/", BlankInput>,
  next: Next,
) => {
  const body = await c.req.parseBody();

  if (typeof body["data"] !== "string") {
    return c.json(
      {
        message: "Validation error. Invalid body",
      },
      {
        status: 400,
      },
    );
  }

  return await next();
};
