export interface IConsistencyDependency {
  resource: string;
  keys: string[];
  versions: Record<string, string>;
}

export interface IConsistencyMetadata {
  protocol: 1;
  epoch: string;
  ref: string;
  expiresAt: string;
  cursor: string;
  session?: string;
  audience?: "browser" | "service";
}

export interface IConsistencyEvent {
  sequence: string;
  eventId: string;
  keys: string[];
  versions: Record<string, string>;
}

export interface IConsistencyDelivery {
  protocol: 1;
  type: "invalidate" | "ready" | "resync" | "heartbeat";
  epoch: string;
  cursor: string;
  refs?: string[];
  degraded?: boolean;
  renewedRefs?: string[];
  expiresAt?: string;
}
