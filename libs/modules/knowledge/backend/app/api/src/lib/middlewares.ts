import { Hono } from "hono";
import { BlankSchema } from "hono/types";

export function middlewaresChain(app: Hono) {
  return app;
}
