export interface IMcpSessionTransport {
  close(): Promise<void>;
}

export interface IMcpSessionStoreOptions {
  idleTtlSeconds: number;
  maxSessions: number;
  now?: () => number;
}

interface IMcpSessionEntry<TTransport extends IMcpSessionTransport> {
  transport: TTransport;
  lastUsedAt: number;
}

/**
 * Live Streamable HTTP sessions, kept in least-recently-used order. A session
 * idle for longer than the TTL is closed, and a new session beyond the maximum
 * closes the least recently used one. A closed session answers 404, after
 * which the client starts a new one, as it does after a restart.
 */
export class McpSessionStore<TTransport extends IMcpSessionTransport> {
  private readonly sessions = new Map<string, IMcpSessionEntry<TTransport>>();
  private readonly now: () => number;

  constructor(private readonly options: IMcpSessionStoreOptions) {
    this.now = options.now ?? (() => Date.now());
  }

  get size() {
    return this.sessions.size;
  }

  get(sessionId: string) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return undefined;
    }

    if (this.isIdle(session)) {
      this.close(sessionId);

      return undefined;
    }

    this.sessions.delete(sessionId);
    this.sessions.set(sessionId, {
      transport: session.transport,
      lastUsedAt: this.now(),
    });

    return session.transport;
  }

  add(sessionId: string, transport: TTransport) {
    this.closeIdle();

    for (const leastRecentlyUsedId of this.sessions.keys()) {
      if (this.sessions.size < this.options.maxSessions) {
        break;
      }

      this.close(leastRecentlyUsedId);
    }

    this.sessions.set(sessionId, { transport, lastUsedAt: this.now() });
  }

  delete(sessionId: string) {
    this.sessions.delete(sessionId);
  }

  closeIdle() {
    for (const [sessionId, session] of this.sessions) {
      if (!this.isIdle(session)) {
        break;
      }

      this.close(sessionId);
    }
  }

  private isIdle(session: IMcpSessionEntry<TTransport>) {
    return this.now() - session.lastUsedAt > this.options.idleTtlSeconds * 1000;
  }

  private close(sessionId: string) {
    const session = this.sessions.get(sessionId);

    this.sessions.delete(sessionId);
    session?.transport.close().catch((error) => {
      console.error("MCP session close error:", error);
    });
  }
}
