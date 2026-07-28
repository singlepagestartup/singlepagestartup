import type {
  ITelegramConversationState,
  ITelegramConversationStore,
} from "./telegram-conversation";

const clone = <T>(value: T): T => structuredClone(value);

/**
 * Process-local conversation persistence.
 *
 * The store deliberately has no external persistence: losing an interactive
 * menu on API restart is safer than replaying an editor with stale
 * authorization. Persistent profile data continues to live behind RBAC APIs.
 */
export class TelegramConversationMemoryStore
  implements ITelegramConversationStore
{
  protected readonly states = new Map<string, ITelegramConversationState>();
  protected readonly tails = new Map<string, Promise<void>>();

  async get(key: string) {
    const state = this.states.get(key);

    return state ? clone(state) : undefined;
  }

  async set(key: string, state: ITelegramConversationState) {
    this.states.set(key, clone(state));
  }

  async delete(key: string) {
    return this.states.delete(key);
  }

  async runExclusive<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.tails.get(key) ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = previous.then(() => current);

    this.tails.set(key, tail);
    await previous;

    try {
      return await operation();
    } finally {
      release();

      if (this.tails.get(key) === tail) {
        this.tails.delete(key);
      }
    }
  }

  async deleteExpired(now: number) {
    let deleted = 0;

    for (const [key, state] of this.states) {
      if (state.expiresAt <= now) {
        this.states.delete(key);
        deleted += 1;
      }
    }

    return deleted;
  }

  /** Exposed for lifecycle diagnostics and focused tests only. */
  get size() {
    return this.states.size;
  }
}
