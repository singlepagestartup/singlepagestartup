# Tool capability contract

Roles and workflows request provider-neutral capability IDs from
`.agents/tools/catalog.yaml`; they never depend on a provider API name.

Before use, resolve the active provider mapping and check availability. Respect
the capability's allowed roles, artifact types, input/output contract,
provenance rule, and fallback. A fallback may reduce scope or request a client
artifact, but it may not invent tool output.

Web research records URLs, access dates, and whether a statement is observed or
inferred. Browser actions record the visited target and relevant result. Image
generation records the prompt, provider binding, output path, rights status, and
usage limits. Document and Figma operations record the target artifact or file.

Provider adapters contain binding metadata only; professional method and
workflow order remain in canonical roles and workflows.
