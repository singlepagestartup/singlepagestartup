## Summary

Refresh compatible dependencies after reviewing all 12 Dependabot PRs and checking 247 unique npm packages in 11 manifests plus the LLM Python requirements. Host and Studio use matching Tiptap versions. Production builds use the existing Host launcher with an 8 GiB default heap and preserve an explicit limit.

## Changes

- Update 29 root dependencies and corresponding Host/Studio manifests and lockfiles. Update FastAPI, Python OpenAI and pydantic-settings.
- Use Node 24.22.3 for production. ICP uses Debian Trixie for current dfx glibc requirements, a noninteractive installer and supported startup arguments.
- Retain Babel 7 after a real JSX transformation with the latest Nx preset rejected Babel 8. Retain ESLint 9 because React/import plugins do not support 10. Node declarations stay aligned with the supported Node 24 runtime. ts-jest requires TypeScript below 7, and Nx requires Verdaccio 6.
- Dependabot PRs #393, #394, #395, #397 and #398 were accepted after review. The incompatible proposals #396 and #399 through #404 were closed with concrete compatibility reasons.

## Verification

- [x] Original Host production build and dev page, after fixing the existing Knowledge ProcessEnv typing failure in #384.
- [x] Clean npm installation and npm 12 lockfile validation through npm ci dry run.
- [x] 2469 existing unit tests across 23 projects and 28 runtime/deployer tests.
- [x] API bundle and live API requests. Browser checks cover authenticated Framework, language switching with the route preserved, and the existing chat with saved documents.
- [x] LLM Docker build and ASGI/OpenAPI startup on Python 3.15. ICP Docker build and dfx version/startup argument verification.
- [x] Updated production Host build completed successfully through the standard npm command, including TypeScript and static page generation.

## Notes

The production-only npm audit reports zero vulnerabilities. The full audit reports 20 low-severity dev dependency entries caused by the deepmerge advisory GHSA-gcqx-w48m-w2h4, with no patched release. It reports zero moderate, high or critical vulnerabilities. The supported runtime remains Node 24. Deploying a release to production is a separate operation.

## Downstream migration

Projects with owned package manifests, lockfiles, Host launchers or ICP Docker images should reconcile versions across their layers and regenerate their lockfiles with the corresponding package manager. Retain compatible Node 24, Babel 7, ESLint 9 and TypeScript 6 integrations. Include the Host build launcher and retain explicit heap limits. For ICP overrides, include the noninteractive dfx installer and compatible Debian base. Verify a lockfile install, Host production build, dev requests, owned tests and any owned LLM/ICP images.
