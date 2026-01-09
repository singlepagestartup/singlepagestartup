# Claude Instructions (SPS)

Use this file as the Claude-specific entry point for working in this repository.

## Start here

1. Read `AI_GUIDE.md` first (project overview, MCP usage, workflows).
2. Follow `AGENTS.md` for development rules and constraints.
3. Use MCP tools from `apps/mcp` for documentation and data access when available.

## Documentation order

- Root overview: `README.md`
- Module summary: `libs/modules/<module>/README.md`
- Entity docs: `libs/modules/<module>/models/<model>/README.md` or
  `libs/modules/<module>/relations/<relation>/README.md`

## Key rules (short)

- TailwindCSS only, no ad-hoc CSS.
- Always use SDK providers for data access.
- Use relation components with `variant="find"` and filter via `apiProps.params.filters.and`.
- Backend only hosted in `apps/api/app.ts`.

If anything is unclear, read the relevant README files instead of guessing.
