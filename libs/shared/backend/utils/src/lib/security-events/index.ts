import {
  SECURITY_NOTIFICATION_WINDOW_IN_SECONDS,
  SECURITY_NOTIFICATIONS_ENABLED,
  securityEventKinds,
} from "@sps/shared-utils";
import { atomicStoreOperation, type IAtomicStore } from "../kv-operation";
import { util as logger } from "../logger";

export type ISecurityEventKind = (typeof securityEventKinds)[number];
export interface ISecuritySummary {
  start: number;
  end: number;
  counts: Partial<Record<ISecurityEventKind, number>>;
}

// A fixed set of fields and time buckets bounds storage even when the caller
// changes IP addresses and invented account names on every request. No PII or
// credentials are stored in the summary.
const script = `
local now = tonumber(redis.call('TIME')[1])
local window = tonumber(ARGV[1])
local bucket = math.floor(now/window)*window
if ARGV[2] == 'read' then
  return redis.call('HGET', KEYS[1], ARGV[3])
end
local field = tostring(bucket)
local raw = redis.call('HGET', KEYS[1], field)
local value = {start=bucket, ['end']=bucket+window, counts={}}
if raw then
  value=cjson.decode(raw)
end
value.counts[ARGV[2]] = math.min(1000000000, (value.counts[ARGV[2]] or 0)+1)
redis.call('HSET', KEYS[1], field, cjson.encode(value))
for _, old in ipairs(redis.call('HKEYS', KEYS[1])) do
  if tonumber(old) < bucket-3600 then
    redis.call('HDEL', KEYS[1], old)
  end
end
redis.call('EXPIRE', KEYS[1], 7200)
return cjson.encode(value)
`;

let reportAfter = 0;
export class SecurityEvents {
  readonly window: number;
  static fromStore(store: Partial<IAtomicStore>) {
    if (!store.eval) {
      return undefined;
    }
    return new SecurityEvents({ eval: store.eval.bind(store) });
  }
  constructor(
    private readonly store: IAtomicStore,
    window = SECURITY_NOTIFICATION_WINDOW_IN_SECONDS,
  ) {
    if (!Number.isSafeInteger(window) || window < 60 || window > 3600) {
      throw new Error(
        "Configuration error. Security summary window must be between 60 and 3600 seconds",
      );
    }
    this.window = window;
  }

  async record(kind: ISecurityEventKind): Promise<void> {
    if (!SECURITY_NOTIFICATIONS_ENABLED) {
      return;
    }
    try {
      await atomicStoreOperation(this.store, {
        prefix: "security:summary",
        key: "project",
        script,
        args: [String(this.window), kind],
      });
    } catch {
      // Reporting must not change a login result or recursively send an alert.
      if (Date.now() >= reportAfter) {
        reportAfter = Date.now() + 60000;
        logger.warn({ event: "security.summary.unavailable" });
      }
    }
  }

  async read(start: number): Promise<ISecuritySummary | undefined> {
    const raw = await atomicStoreOperation(this.store, {
      prefix: "security:summary",
      key: "project",
      script,
      args: [String(this.window), "read", String(start)],
    });
    if (!raw) {
      return undefined;
    }
    return typeof raw === "string"
      ? JSON.parse(raw)
      : (raw as ISecuritySummary);
  }
}
