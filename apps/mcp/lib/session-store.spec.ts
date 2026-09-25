/**
 * BDD Suite: MCP HTTP session store
 *
 * Given Streamable HTTP sessions with an idle TTL and a maximum count
 * When sessions are used, left idle, swept, deleted, or added beyond the maximum
 * Then idle and least recently used sessions are closed and no longer found, while sessions in use stay open
 */
import { McpSessionStore } from "./session-store";

function createTransport() {
  return { close: jest.fn(async () => undefined) };
}

function createStore(props: { idleTtlSeconds?: number; maxSessions?: number }) {
  let now = 1_000_000;
  const store = new McpSessionStore<ReturnType<typeof createTransport>>({
    idleTtlSeconds: props.idleTtlSeconds ?? 60,
    maxSessions: props.maxSessions ?? 10,
    now: () => now,
  });

  return {
    store,
    advance(seconds: number) {
      now += seconds * 1000;
    },
  };
}

describe("McpSessionStore", () => {
  /**
   * BDD Scenario: A session in use stays open
   *
   * Given a session and a one-minute idle TTL
   * When the client uses it every fifty seconds
   * Then it is found each time and never closed
   */
  it("keeps a session that is used within the idle TTL", () => {
    const { store, advance } = createStore({ idleTtlSeconds: 60 });
    const transport = createTransport();

    store.add("session-1", transport);
    advance(50);
    expect(store.get("session-1")).toBe(transport);
    advance(50);
    expect(store.get("session-1")).toBe(transport);
    expect(transport.close).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario: An idle session closes
   *
   * Given a session and a one-minute idle TTL
   * When the client returns after sixty-one seconds
   * Then the session is closed and not found
   */
  it("closes a session idle for longer than the TTL", () => {
    const { store, advance } = createStore({ idleTtlSeconds: 60 });
    const transport = createTransport();

    store.add("session-1", transport);
    advance(61);

    expect(store.get("session-1")).toBeUndefined();
    expect(transport.close).toHaveBeenCalledTimes(1);
    expect(store.size).toBe(0);
  });

  /**
   * BDD Scenario: The maximum admits a new session
   *
   * Given a maximum of two sessions, the first used after the second was added
   * When a third session is added
   * Then the least recently used one, the second, is closed
   */
  it("closes the least recently used session to admit one beyond the maximum", () => {
    const { store, advance } = createStore({ maxSessions: 2 });
    const first = createTransport();
    const second = createTransport();
    const third = createTransport();

    store.add("first", first);
    advance(1);
    store.add("second", second);
    advance(1);
    store.get("first");
    advance(1);
    store.add("third", third);

    expect(second.close).toHaveBeenCalledTimes(1);
    expect(store.get("second")).toBeUndefined();
    expect(store.get("first")).toBe(first);
    expect(store.get("third")).toBe(third);
    expect(first.close).not.toHaveBeenCalled();
    expect(store.size).toBe(2);
  });

  /**
   * BDD Scenario: The sweep closes only idle sessions
   *
   * Given one session idle for seventy seconds and one for forty
   * When the periodic sweep runs with a one-minute idle TTL
   * Then only the first is closed
   */
  it("sweeps idle sessions and keeps active ones", () => {
    const { store, advance } = createStore({ idleTtlSeconds: 60 });
    const idle = createTransport();
    const active = createTransport();

    store.add("idle", idle);
    advance(30);
    store.add("active", active);
    advance(40);
    store.closeIdle();

    expect(idle.close).toHaveBeenCalledTimes(1);
    expect(active.close).not.toHaveBeenCalled();
    expect(store.size).toBe(1);
  });

  /**
   * BDD Scenario: A session the client deleted
   *
   * Given a session the transport already closed on DELETE /mcp
   * When the store forgets it
   * Then it is not found and not closed a second time
   */
  it("forgets a deleted session without closing it again", () => {
    const { store } = createStore({});
    const transport = createTransport();

    store.add("session-1", transport);
    store.delete("session-1");

    expect(store.get("session-1")).toBeUndefined();
    expect(transport.close).not.toHaveBeenCalled();
  });
});
