import { Hono } from "hono";
import { handlers } from "./handlers/index";
import { MiddlewaresGeneric } from "@sps/shared-backend-api";

export const app = new Hono<MiddlewaresGeneric>();

app.get("/", async (c, next) => {
  return handlers.find(c, next);
});

app.get("/:uuid", async (c, next) => {
  return handlers.findById(c, next);
});

app.post("/", async (c, next) => {
  return handlers.create(c, next);
});

app.patch("/:uuid", async (c, next) => {
  return handlers.update(c, next);
});

app.delete("/:uuid", async (c, next) => {
  return handlers.delete(c, next);
});

app.get("/get-role", async (c, next) => {
  const key = c.req.header("X-SPS-SECRET-KEY");

  if (!key) {
    return c.json(
      {
        message: "No permission to access this resource.",
      },
      {
        status: 400,
      },
    );
  }

  console.log(`🚀 ~ roles ~ get ~ key:`, key);

  return c.json(
    {
      message: "You have permission to access this resource.",
    },
    {
      status: 200,
    },
  );
});
