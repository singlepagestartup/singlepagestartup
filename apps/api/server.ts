import "./env";
import { serve, type ServerWebSocket } from "bun";
import { createBunWebSocket } from "hono/bun";
import { app } from "./app";
import { API_SERVICE_PORT } from "@sps/shared-utils";

const { websocket } = createBunWebSocket<ServerWebSocket>();

serve({
  fetch: app.fetch,
  port: API_SERVICE_PORT,
  websocket,
  idleTimeout: 0,
});
