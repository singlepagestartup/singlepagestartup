## Host E2E Reuse Principle

Playwright E2E for Host is configured in reuse-first mode.

1. Start Host manually once:
   - `npm run host:dev`
2. Run E2E suites without managed webServer:
   - `npm run test:e2e:singlepage`
   - `npm run test:e2e:startup`

Technical contract:

- default scripts set `PW_SKIP_WEBSERVER=1`
- `apps/host/playwright.config.ts` starts `webServer` only when `PW_USE_WEBSERVER=1` and skip flag is not set

Use managed webServer only when needed:

- `npm run test:e2e:singlepage:with-webserver`
- `npm run test:e2e:startup:with-webserver`
