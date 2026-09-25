# Security policy

SinglePageStartup is an open-source framework. Every deployment, including
the downstream projects built on this repository, runs the code in `apps/`,
`libs/` and `tools/deployer/`. This file says how to report a weakness in that
code, what the maintainers do with a report, and where a deployment operator
finds the hardening steps that no release can apply for them.

## Reporting a vulnerability

Report through GitHub private vulnerability reporting on this repository: open
the Security tab and choose "Report a vulnerability", or go straight to
<https://github.com/singlepagestartup/singlepagestartup/security/advisories/new>.

Do not open a public issue, pull request or discussion for a security finding,
and do not attach a working exploit to anything public. The tracker is public,
so a description of an unfixed weakness reaches attackers before it reaches
the operators who would have to patch.

A useful report names the affected file or route, the request that triggers
the weakness, what an attacker gains, and the commit or release you tested.
Test against your own instance. `GETTING_STARTED.md` explains how to run the
stack locally with Docker. Do not test against deployments you do not operate.

## What to expect

- Acknowledgement within 5 business days.
- A confirmed finding gets a draft advisory, a public issue with a neutral
  title, and a fix branch. For a critical or high finding the target is a fix
  on `main` within 30 days. Lower severities follow the normal release cadence.
- The finding, how it could have been used, and the fix are published together
  in the advisory and the release notes once the release is out. Until then the
  tracker describes the fix, never the weakness.
- The advisory credits the reporter unless they ask to stay anonymous.

## Supported versions

Security fixes land on `main` and ship in the next release. Earlier releases
are not patched; a deployment on an older release moves forward to receive the
fix.

Downstream projects pull fixes with the `adapt-upstream` workflow described in
`.agents/workflows/engineering/adapt-upstream.md`. A weakness in code that a
downstream project changed or added belongs to that project's maintainers. A
weakness in framework code belongs here.

## Hardening a deployment

Some weaknesses live in a deployment's configuration, and no framework release
can fix them remotely. `tools/deployer/README.md` covers them under
"Infrastructure security and operations":

- Generate every deployment secret with a cryptographic source, as described
  under "Generating deployment secrets". The API refuses to start on a secret
  it recognizes as guessable unless `API_SECRET_STRENGTH=report` is set.
- Rotate the secrets of a deployment bootstrapped before that generator
  existed, following "Rotating the secrets of a deployment that already
  bootstrapped". Update every copy: the service env files, the GitHub Actions
  secrets, the server crontab and the operator's `tools/deployer/.env`.
- Change the bootstrap administrator password through the API or the admin UI.
  Editing `.env` alone does not change the stored hash.

`RBAC_SECRET_KEY` bypasses authorization on every API route. Treat it as a root
credential: keep it out of browsers, MCP client configuration and shared
machines, and rotate it as soon as a copy may have left your control.
