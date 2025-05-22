import "./env";
import { serve } from "bun";
import { app } from "./app";
import { TELEGRAM_SERVICE_PORT } from "@sps/shared-utils";

serve({
  fetch: app.fetch,
  port: TELEGRAM_SERVICE_PORT,
  idleTimeout: 60,
});
