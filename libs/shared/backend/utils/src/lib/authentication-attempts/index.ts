import { RBAC_RATE_LIMIT_WINDOW_IN_SECONDS } from "@sps/shared-utils";
import { randomUUID } from "node:crypto";
import { atomicStoreOperation, type IAtomicStore } from "../kv-operation";
import { RateLimitError } from "../rate-limit";

export interface IAttemptReservation {
  allowed: boolean;
  retryAfterInSeconds: number;
  firstExceeded: boolean;
  previousFailures: number;
  receipt: string;
}

// Redis owns the clock and reserves both windows in one operation. Concurrent
// password checks consume slots until their outcome is known. A crashed check
// conservatively consumes its slot until the window expires.
const script = `
local now = tonumber(redis.call('TIME')[1])
local minuteWindow = tonumber(ARGV[5])
local raw = redis.call('GET', KEYS[1])
local state = {minuteStart=now, hourStart=now, minuteCount=0, hourCount=0, pending={}}
if raw then
  state = cjson.decode(raw)
end
if now >= state.hourStart + 3600 then
  state.hourStart=now
  state.hourCount=0
  state.pending={}
  state.hourBlocked=false
end
if now >= state.minuteStart + minuteWindow then
  state.minuteStart=now
  state.minuteCount=0
  state.minuteBlocked=false
end
local receipt = ARGV[2]
local result = {allowed=true, retryAfterInSeconds=0, firstExceeded=false, previousFailures=0}
if ARGV[1] == 'reserve' then
  local minuteFull = state.minuteCount >= tonumber(ARGV[3])
  local hourFull = state.hourCount >= tonumber(ARGV[4])
  if minuteFull or hourFull then
    result.allowed=false
    if hourFull then
      result.retryAfterInSeconds=state.hourStart+3600-now
      result.firstExceeded=not state.hourBlocked
      state.hourBlocked=true
    else
      result.retryAfterInSeconds=state.minuteStart+minuteWindow-now
      result.firstExceeded=not state.minuteBlocked
      state.minuteBlocked=true
    end
  else
    state.minuteCount=state.minuteCount+1
    state.hourCount=state.hourCount+1
    state.pending[receipt]={minuteStart=state.minuteStart, hourStart=state.hourStart}
  end
else
  local pending = state.pending[receipt]
  if pending then
    if ARGV[1] == 'release' then
      if pending.minuteStart == state.minuteStart then
        state.minuteCount=math.max(0,state.minuteCount-1)
      end
      if pending.hourStart == state.hourStart then
        state.hourCount=math.max(0,state.hourCount-1)
      end
    end
    state.pending[receipt]=nil
  end
  local inflight=0
  for _, value in pairs(state.pending) do
    if value.hourStart == state.hourStart then
      inflight=inflight+1
    end
  end
  result.previousFailures=math.max(0,state.hourCount-inflight)
end
redis.call('SET', KEYS[1], cjson.encode(state), 'EX', math.max(1,state.hourStart+3600-now))
return cjson.encode(result)
`;

export class AuthenticationAttempts {
  constructor(
    private readonly store: IAtomicStore,
    private readonly minuteLimit: number,
    private readonly hourLimit: number,
    private readonly minuteWindow = RBAC_RATE_LIMIT_WINDOW_IN_SECONDS,
  ) {
    if (
      !Number.isSafeInteger(minuteWindow) ||
      minuteWindow < 1 ||
      minuteWindow > 3600
    ) {
      throw new Error(
        "Configuration error. Password attempt window must be between 1 and 3600 seconds",
      );
    }
    for (const limit of [minuteLimit, hourLimit]) {
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 10000) {
        throw new Error(
          "Configuration error. Password attempt budgets must be positive integers up to 10000",
        );
      }
    }
  }

  private async execute(
    account: string,
    operation: string,
    receipt: string,
  ): Promise<IAttemptReservation> {
    try {
      const raw = await atomicStoreOperation(this.store, {
        prefix: "rate-limit:password-failures",
        key: account,
        script,
        args: [
          operation,
          receipt,
          String(this.minuteLimit),
          String(this.hourLimit),
          String(this.minuteWindow),
        ],
      });
      const result = typeof raw === "string" ? JSON.parse(raw) : raw;
      return { ...result, receipt };
    } catch {
      throw new RateLimitError(503);
    }
  }

  reserve(account: string) {
    return this.execute(account, "reserve", randomUUID());
  }

  finish(account: string, receipt: string, failed: boolean) {
    const operation = failed ? "failure" : "release";
    return this.execute(account, operation, receipt);
  }
}
