import { setTimeout as delay } from "node:timers/promises";
import { atomicStoreOperation, type IAtomicStore } from "../kv-operation";

export class DeliveryDeferredError extends Error {
  readonly status = 429;

  constructor(readonly retryAt: number) {
    super("Rate limit error. Notification delivery is deferred");
    this.name = "DeliveryDeferredError";
  }
}

interface IAdmission {
  key: string;
  intervalMs: number;
  cost?: number;
  deadline: number;
  signal?: AbortSignal;
  allowance?: { version: string; remaining: number; resetAt: number };
}

// Redis time and atomic admission make every API/worker instance share a pace.
// There are no future reservations or an in-memory queue of pending messages.
const script = `
local clock = redis.call('TIME')
local now = tonumber(clock[1])*1000 + math.floor(tonumber(clock[2])/1000)
local nextAt = tonumber(redis.call('HGET', KEYS[1], 'next') or '0')
if ARGV[1] == 'pause' then
  nextAt = math.max(nextAt, now + tonumber(ARGV[2]))
  redis.call('HSET', KEYS[1], 'next', nextAt)
  redis.call('PEXPIRE', KEYS[1], math.ceil(nextAt-now)+60000)
  return nextAt-now
end
if nextAt > now then return nextAt-now end
local cost = tonumber(ARGV[3])
if ARGV[4] ~= '' then
  local version = redis.call('HGET', KEYS[1], 'version')
  local used = tonumber(redis.call('HGET', KEYS[1], 'used') or '0')
  if version ~= ARGV[4] then used = 0 end
  if used + cost > tonumber(ARGV[5]) then
    return math.max(1000, tonumber(ARGV[6])-now)
  end
  redis.call('HSET', KEYS[1], 'version', ARGV[4], 'used', used+cost)
end
local interval = tonumber(ARGV[2])*cost
redis.call('HSET', KEYS[1], 'next', now+interval)
redis.call('PEXPIRE', KEYS[1], math.max(120000, math.ceil(interval)+60000))
return 0
`;

export class DeliveryRateLimit {
  constructor(private readonly store: IAtomicStore) {}

  async acquire(props: IAdmission): Promise<void> {
    if (!Number.isFinite(props.intervalMs) || props.intervalMs < 1) {
      throw new Error("Configuration error. Invalid notification sending rate");
    }
    if (!Number.isFinite(props.deadline)) {
      throw new Error(
        "Configuration error. Invalid notification wait deadline",
      );
    }
    const cost = props.cost ?? 1;
    if (!Number.isSafeInteger(cost) || cost < 1) {
      throw new Error("Validation error. Invalid notification delivery cost");
    }
    let waiting = true;
    while (waiting) {
      props.signal?.throwIfAborted();
      const waitMs = Number(
        await atomicStoreOperation(this.store, {
          prefix: "notification:rate",
          key: props.key,
          script,
          args: [
            "acquire",
            String(props.intervalMs),
            String(cost),
            props.allowance?.version ?? "",
            String(props.allowance?.remaining ?? 0),
            String(props.allowance?.resetAt ?? 0),
          ],
        }),
      );
      if (!Number.isFinite(waitMs) || waitMs < 0) {
        throw new Error(
          "Internal error. Notification rate store returned invalid data",
        );
      }
      if (waitMs === 0) {
        waiting = false;
        continue;
      }
      const retryAt = Date.now() + waitMs;
      if (retryAt >= props.deadline) {
        throw new DeliveryDeferredError(retryAt);
      }
      await delay(waitMs, undefined, { signal: props.signal });
    }
  }

  async pause(key: string, milliseconds: number) {
    const bounded = Math.min(7 * 86400000, Math.max(1000, milliseconds));
    const waitMs = Number(
      await atomicStoreOperation(this.store, {
        prefix: "notification:rate",
        key,
        script,
        args: ["pause", String(bounded)],
      }),
    );
    return Date.now() + waitMs;
  }
}
