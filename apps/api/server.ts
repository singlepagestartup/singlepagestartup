import "./env";
import { serve } from "bun";
import { app } from "./app";
import { API_SERVICE_PORT } from "@sps/shared-utils";

serve({
  fetch: app.fetch,
  port: API_SERVICE_PORT,
  idleTimeout: 60,
});
