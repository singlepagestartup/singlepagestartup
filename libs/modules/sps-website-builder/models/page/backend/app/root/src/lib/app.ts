import { Hono } from "hono";
import { handlers } from "./handlers/index";

export const app = new Hono();

app.get("/get-urls", async (c, next) => {
  return handlers.getUrls(c, next);
});

app.get("/get-by-url", async (c, next) => {
  return handlers.getByUrl(c, next);
});

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