import "./env";
import { serve } from "bun";
import { app } from "./app";
import { API_PORT } from "@sps/shared-utils";

serve({
  fetch: app.fetch,
  port: API_PORT,
  idleTimeout: 60,
});
