import "./env";
import { serve } from "bun";
import { app } from "./app";
import { app as telegramApp } from "./src";
import {
  assessConfiguredSecrets,
  formatSecretAssessment,
  isFatalSecretAssessment,
  TELEGRAM_CHECKED_SECRET_NAMES,
  TELEGRAM_SECRET_STRENGTH,
  TELEGRAM_SERVICE_PORT,
} from "@sps/shared-utils";
import { runTelegramStartupWithRetry } from "./src/lib/startup";

const secretFindings = assessConfiguredSecrets(
  process.env,
  TELEGRAM_CHECKED_SECRET_NAMES,
).filter((assessment) => assessment.verdict !== "ok");

for (const finding of secretFindings) {
  console.warn(`[secret-strength] ${formatSecretAssessment(finding)}`);
}

const fatalSecretFindings = secretFindings.filter(isFatalSecretAssessment);

if (fatalSecretFindings.length > 0) {
  if (TELEGRAM_SECRET_STRENGTH === "report") {
    console.warn(
      "[secret-strength] Starting anyway because TELEGRAM_SECRET_STRENGTH=report. " +
        "This service is running on an authorization secret that can be " +
        "found offline. See tools/deployer/README.md for the rotation steps.",
    );
  } else {
    console.error(
      "[secret-strength] Refusing to start. Rotate the values listed above, " +
        "as described in tools/deployer/README.md. Set TELEGRAM_SECRET_STRENGTH=report " +
        "to start anyway while a rotation is scheduled.",
    );
    process.exit(1);
  }
}

serve({
  fetch: app.fetch,
  port: TELEGRAM_SERVICE_PORT,
  idleTimeout: 60,
});

if (telegramApp.telegramBot?.instance) {
  void runTelegramStartupWithRetry({
    synchronize: () => telegramApp.telegramBot.run(),
    onFailure: ({ attempt, error, retryDelayMs }) => {
      console.error("Telegram startup synchronization failed; retrying.", {
        attempt,
        error,
        retryDelayMs,
      });
    },
    onSuccess: () => {
      console.info("Telegram commands and webhook synchronized.");
    },
  });
}
