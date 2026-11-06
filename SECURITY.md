# Security policy

## Report a vulnerability

Use the [private vulnerability report form](https://github.com/singlepagestartup/singlepagestartup/security/advisories/new) for vulnerabilities in the SinglePageStartup framework. Keep details, reproduction steps and proof of concept in the private report.

Include the affected file or route, steps to reproduce, the impact and the commit or release you tested. Use an instance you control. The [local setup guide](./GETTING_STARTED.md) describes how to run the stack with Docker.

## How maintainers handle reports

Maintainers review the report and may ask for more information in the private GitHub thread. For a confirmed vulnerability, they coordinate the fix and disclosure through a draft advisory. Once the fix is available, the advisory identifies the affected versions, impact and upgrade steps. Maintainers coordinate any public credit with the reporter.

## Supported versions

Framework security fixes go into `main` and are included in subsequent releases. Upgrade to a release that includes the relevant fix.

For a project built on SinglePageStartup, first fetch and integrate the upstream fix through your normal Git workflow. Then run [adapt-upstream](./.agents/workflows/engineering/adapt-upstream.md) to review any changes needed in project-owned overrides. Report vulnerabilities in project-owned code to that project's maintainers.

## Secure your deployment

The [deployment guide](./tools/deployer/README.md#infrastructure-security-and-operations) covers secret generation, rotation and infrastructure settings.

- Generate secrets using a cryptographic source. The API checks configured secrets at startup. See [Generating deployment secrets](./tools/deployer/README.md#generating-deployment-secrets).
- When rotating a secret, update every copy used by the deployment. See [Rotating the secrets of a deployment that already bootstrapped](./tools/deployer/README.md#rotating-the-secrets-of-a-deployment-that-already-bootstrapped).
- Change the bootstrap administrator password through the API or admin UI so the stored password changes.

`RBAC_SECRET_KEY` grants privileged access through the API authorization middleware. Keep it in trusted server environments and rotate it if it may have been exposed.
