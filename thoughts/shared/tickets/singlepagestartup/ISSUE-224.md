---
repository: singlepagestartup
issue_number: 224
status: Research Needed
created: 2026-08-04
---

# Issue: Prevent server API function objects from crossing shared Server/Client component boundaries

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/224
**Issue**: #224
**Status**: Research Needed
**Created**: 2026-08-04
**Priority**: medium
**Size**: medium
**Type**: bug

---

## Problem to Solve

Production host renders intermittently fail React Server Component serialization because shared frontend dispatchers spread their full framework props into a selected Client Component. Those props include the generated `serverApi` object, whose methods are functions and therefore cannot cross the Server-to-Client boundary.

## Key Details

- Affected production service: `host_host`.
- Audit window: `2026-08-02T21:14:01.666252Z` through `2026-08-03T21:13:22.732694Z`.
- Three distinct bursts were observed, each with 12 repetitions of the same error (36 lines total): `2026-08-03T08:25:21.209078Z`–`08:25:21.504830Z`, `11:09:32.132139Z`–`11:09:32.209428Z`, and `17:08:03.161012Z`–`17:08:03.267913Z`.
- Safe serializer evidence exposed the function-property names `findById`, `find`, `count`, `update`, `create`, `findOrCreate`, `delete`, `bulkCreate`, and `bulkUpdate`. This exactly matches the generated server API factory in `libs/shared/frontend/server/api/src/lib/factory/index.ts:37`.
- Production image: tag `0.0.301`, digest prefix `4d51df1cfef5`, commit `036cdb033fbcb5597b90a5b502965034fdd98189`.
- All 13 Swarm services were healthy at audit time; no failed/rejected tasks, crash loop, or failed health check explains the event.
- Exact triggering page/variant is not present in host or Traefik logs, but ownership and the shared code defect are established by the serialized function fingerprint and the common dispatcher pattern.

## Implementation Notes

Replace full-prop spreads at shared Server-to-Client dispatch points with explicit client-safe props, ensuring `serverApi` and other server-only/function-bearing values never reach Client Component props. Cover all shared wrappers using the same `const Comp = props.isServer ? Server : Client` plus `<Comp {...props} api={api} />` pattern, with focused React Server Component regression tests.
