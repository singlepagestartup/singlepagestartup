import "./env";
import { serve, type ServerWebSocket } from "bun";
import { createBunWebSocket } from "hono/bun";
import { app } from "./app";
import {
  API_SECRET_STRENGTH,
  API_SERVICE_PORT,
  assessSecrets,
  formatSecretAssessment,
  isFatalSecretAssessment,
} from "@sps/shared-utils";

const secretFindings = assessSecrets(process.env).filter(
  (assessment) => assessment.verdict !== "ok",
);

for (const finding of secretFindings) {
  console.warn(`[secret-strength] ${formatSecretAssessment(finding)}`);
}

const fatalSecretFindings = secretFindings.filter(isFatalSecretAssessment);

if (fatalSecretFindings.length > 0) {
  if (API_SECRET_STRENGTH === "report") {
    console.warn(
      "[secret-strength] Starting anyway because API_SECRET_STRENGTH=report. " +
        "This deployment is running on an authorization secret that can be " +
        "found offline. See tools/deployer/README.md for the rotation steps.",
    );
  } else {
    console.error(
      "[secret-strength] Refusing to start. Rotate the values listed above, " +
        "as described in tools/deployer/README.md. Set API_SECRET_STRENGTH=report " +
        "to start anyway while a rotation is scheduled.",
    );
    process.exit(1);
  }
}

const { websocket } = createBunWebSocket<ServerWebSocket>();

serve({
  fetch: app.fetch,
  port: API_SERVICE_PORT,
  websocket,
  idleTimeout: 0,
});
