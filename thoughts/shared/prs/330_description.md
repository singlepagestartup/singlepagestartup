## Summary

When port 6379 is busy, local setup picks a free port for Redis and writes it to the API configuration. Previously Docker still forwarded connections to port 6379 inside the container, so the API could not reach Redis.

## Changes

Local Compose now passes the resolved `REDIS_PORT` to the Redis process and uses it for both sides of the port mapping. A shell override takes precedence over the Redis `.env` file. The default is 6379. The production deployer uses a separate template.

## Verification

- With port 6379 occupied, the setup scripts selected 6380 for both Redis and the API. An authenticated host `PING` returned `PONG`, and the API KV provider wrote, read and deleted a key. Redis rejected an unauthenticated `PING`.
- With 6379 in the Redis `.env` and `REDIS_PORT=6380` in the shell, the host received `PONG` on port 6380.
- Compose rendered `6379:6379` with the default configuration. All seven Redis provider tests passed.

## Downstream migration

Projects using the shared local Compose file receive the fix on merge. For a project-owned copy with a configurable Redis listener, pass the resolved port to the container and use it as the mapping target. Recreate the local Redis service and check for an authenticated `PONG` on the published port. If overriding that port manually, set the API's `KV_PORT` to match.
