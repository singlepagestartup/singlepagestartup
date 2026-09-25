## Summary

The local Redis compose starts `redis-server` on `REDIS_PORT` inside the container but published `${REDIS_PORT}:6379`. With any port other than 6379 the host port led to a socket nothing listened on, so the API, the cache tests and the scenario lane on a developer machine could not reach Redis after `./up.sh`. The container now exposes and publishes `REDIS_PORT` on both sides.

## Changes

- `apps/redis/docker-compose.redis.yaml`: `expose` and `ports` use `${REDIS_PORT:-6379}` on both sides of the mapping.

## Verification

- [x] `docker compose -f apps/redis/docker-compose.redis.yaml --env-file apps/redis/.env config` renders `6384:6384` with the local `.env`.
- [x] After recreating the local container, a `PING` from the host to `127.0.0.1:6384` answers `PONG`; before the change the connection was accepted and closed without a reply.
- [ ] `./up.sh` on a fresh checkout reaches Redis from the API start-up (manual).

## Notes

- The deployer template `tools/deployer/redis/docker-compose.redis.yaml.j2` runs Redis on `REDIS_PORT` inside the overlay network without a published port, so production is not affected.
- Downstream migration: none. The file is the local development compose; a merge brings the fix.
