import "./env";
import { serve } from "bun";
import { app } from "./app";
import { OPENAPI_SERVICE_PORT } from "@sps/shared-utils";

serve({
  fetch: app.fetch,
  port: OPENAPI_SERVICE_PORT,
  idleTimeout: 60,
});
