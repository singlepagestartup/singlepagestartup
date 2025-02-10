import * as Sentry from "@sentry/node";
import { SENTRY_DSN } from "@sps/shared-utils";

Sentry.init({
  dsn: SENTRY_DSN,
  tracesSampleRate: 1.0,
  integrations: (integrations) =>
    integrations.filter(
      (integration) => integration.name !== "OnUncaughtException",
    ),
});

export { Sentry };
