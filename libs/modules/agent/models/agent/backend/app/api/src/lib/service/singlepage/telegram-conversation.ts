export const TELEGRAM_ASSISTANT_CONVERSATION_ID =
  "assistant-profile-management";
export const TELEGRAM_ASSISTANT_CALLBACK_PREFIX = "as1";
export const TELEGRAM_CALLBACK_DATA_MAX_LENGTH = 64;
export const DEFAULT_TELEGRAM_CONVERSATION_TTL_MS = 30 * 60 * 1_000;

export interface ITelegramConversationKey {
  chatId: string;
  threadId: string;
  senderProfileId: string;
}

export type TTelegramAssistantPage =
  | "selector"
  | "home"
  | "profile"
  | "mcp"
  | "avatar"
  | "skills"
  | "skills-available"
  | "skill"
  | "knowledge"
  | "document";

export interface ITelegramConversationEditor {
  kind:
    | "profile"
    | "skill-create"
    | "skill-edit"
    | "knowledge-create"
    | "knowledge-edit"
    | "avatar";
  field: string;
  values: Record<string, unknown>;
  entityId?: string;
}

export interface ITelegramConversationState {
  key: ITelegramConversationKey;
  conversationId: string;
  nonce: string;
  revision: number;
  page: TTelegramAssistantPage;
  selectedProfileId?: string;
  selectedEntityId?: string;
  editor?: ITelegramConversationEditor;
  confirmation?: {
    kind: "skill-unlink" | "knowledge-delete";
    entityId: string;
  };
  pagination: Partial<
    Record<"profiles" | "skills" | "availableSkills" | "knowledge", number>
  >;
  presentationMessageId?: string;
  presentationMessageSourceSystemId?: string;
  presentationMediaUrl?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface ITelegramConversationStore {
  get(key: string): Promise<ITelegramConversationState | undefined>;
  set(key: string, state: ITelegramConversationState): Promise<void>;
  delete(key: string): Promise<boolean>;
  runExclusive<T>(key: string, operation: () => Promise<T>): Promise<T>;
  deleteExpired(now: number): Promise<number>;
}

export interface ITelegramConversationCallback {
  nonce: string;
  revision: number;
  action: string;
  token?: string;
}

export type TTelegramConversationCallbackResult<T> =
  | { status: "ok"; state: ITelegramConversationState; value: T }
  | { status: "invalid" | "missing" | "expired" | "stale" };

export interface ITelegramConversationRuntime {
  key(value: ITelegramConversationKey): string;
  start(
    key: ITelegramConversationKey,
    initial?: Partial<
      Pick<
        ITelegramConversationState,
        "page" | "selectedProfileId" | "pagination"
      >
    >,
  ): Promise<ITelegramConversationState>;
  get(
    key: ITelegramConversationKey,
  ): Promise<ITelegramConversationState | undefined>;
  update(
    key: ITelegramConversationKey,
    updater: (
      state: ITelegramConversationState,
    ) =>
      | void
      | ITelegramConversationState
      | Promise<void | ITelegramConversationState>,
  ): Promise<ITelegramConversationState | undefined>;
  terminate(key: ITelegramConversationKey): Promise<boolean>;
  encodeCallback(
    state: Pick<ITelegramConversationState, "nonce" | "revision">,
    action: string,
    token?: string,
  ): string;
  decodeCallback(data: string): ITelegramConversationCallback | undefined;
  consumeCallback<T>(
    key: ITelegramConversationKey,
    data: string,
    operation: (
      state: ITelegramConversationState,
      callback: ITelegramConversationCallback,
    ) => Promise<T>,
  ): Promise<TTelegramConversationCallbackResult<T>>;
}

const clone = <T>(value: T): T => structuredClone(value);

export class TelegramConversationRuntime
  implements ITelegramConversationRuntime
{
  constructor(
    protected readonly store: ITelegramConversationStore,
    protected readonly options: {
      ttlMs?: number;
      now?: () => number;
      nonce?: () => string;
    } = {},
  ) {}

  key(value: ITelegramConversationKey) {
    return [value.chatId, value.threadId, value.senderProfileId]
      .map((part) => encodeURIComponent(part))
      .join(":");
  }

  protected now() {
    return this.options.now?.() ?? Date.now();
  }

  protected ttlMs() {
    return this.options.ttlMs ?? DEFAULT_TELEGRAM_CONVERSATION_TTL_MS;
  }

  protected nonce() {
    return (
      this.options.nonce?.() ??
      Math.random().toString(36).slice(2, 10).padEnd(8, "0")
    ).slice(0, 12);
  }

  protected async current(storageKey: string) {
    const state = await this.store.get(storageKey);

    if (!state) {
      return;
    }

    if (state.expiresAt <= this.now()) {
      await this.store.delete(storageKey);
      return;
    }

    return state;
  }

  async start(
    key: ITelegramConversationKey,
    initial: Partial<
      Pick<
        ITelegramConversationState,
        "page" | "selectedProfileId" | "pagination"
      >
    > = {},
  ) {
    const storageKey = this.key(key);

    return this.store.runExclusive(storageKey, async () => {
      const now = this.now();
      const state: ITelegramConversationState = {
        key: clone(key),
        conversationId: TELEGRAM_ASSISTANT_CONVERSATION_ID,
        nonce: this.nonce(),
        revision: 0,
        page: initial.page ?? "selector",
        selectedProfileId: initial.selectedProfileId,
        pagination: clone(initial.pagination ?? {}),
        createdAt: now,
        updatedAt: now,
        expiresAt: now + this.ttlMs(),
      };

      await this.store.set(storageKey, state);

      return clone(state);
    });
  }

  async get(key: ITelegramConversationKey) {
    return this.current(this.key(key));
  }

  async update(
    key: ITelegramConversationKey,
    updater: (
      state: ITelegramConversationState,
    ) =>
      | void
      | ITelegramConversationState
      | Promise<void | ITelegramConversationState>,
  ) {
    const storageKey = this.key(key);

    return this.store.runExclusive(storageKey, async () => {
      const current = await this.current(storageKey);

      if (!current) {
        return;
      }

      const draft = clone(current);
      const returned = await updater(draft);
      const next = returned ?? draft;
      const now = this.now();

      next.revision = current.revision + 1;
      next.updatedAt = now;
      next.expiresAt = now + this.ttlMs();
      await this.store.set(storageKey, next);

      return clone(next);
    });
  }

  async terminate(key: ITelegramConversationKey) {
    const storageKey = this.key(key);

    return this.store.runExclusive(storageKey, async () => {
      return this.store.delete(storageKey);
    });
  }

  encodeCallback(
    state: Pick<ITelegramConversationState, "nonce" | "revision">,
    action: string,
    token?: string,
  ) {
    if (!/^[a-z0-9_-]{1,20}$/i.test(action)) {
      throw new Error("Validation error. Invalid Telegram callback action");
    }

    if (token && !/^[a-z0-9_-]{1,24}$/i.test(token)) {
      throw new Error("Validation error. Invalid Telegram callback token");
    }

    const data = [
      TELEGRAM_ASSISTANT_CALLBACK_PREFIX,
      state.nonce,
      state.revision.toString(36),
      action,
      token,
    ]
      .filter(Boolean)
      .join(":");

    if (data.length > TELEGRAM_CALLBACK_DATA_MAX_LENGTH) {
      throw new Error("Validation error. Telegram callback data is too long");
    }

    return data;
  }

  decodeCallback(data: string) {
    const [prefix, nonce, revision, action, token, ...rest] = data.split(":");

    if (
      prefix !== TELEGRAM_ASSISTANT_CALLBACK_PREFIX ||
      !nonce ||
      !revision ||
      !action ||
      rest.length
    ) {
      return;
    }

    const parsedRevision = Number.parseInt(revision, 36);

    if (!Number.isSafeInteger(parsedRevision) || parsedRevision < 0) {
      return;
    }

    return {
      nonce,
      revision: parsedRevision,
      action,
      token,
    };
  }

  async consumeCallback<T>(
    key: ITelegramConversationKey,
    data: string,
    operation: (
      state: ITelegramConversationState,
      callback: ITelegramConversationCallback,
    ) => Promise<T>,
  ): Promise<TTelegramConversationCallbackResult<T>> {
    const callback = this.decodeCallback(data);

    if (!callback) {
      return { status: "invalid" };
    }

    const storageKey = this.key(key);

    return this.store.runExclusive(storageKey, async () => {
      const stored = await this.store.get(storageKey);

      if (!stored) {
        return { status: "missing" };
      }

      const now = this.now();

      if (stored.expiresAt <= now) {
        await this.store.delete(storageKey);
        return { status: "expired" };
      }

      if (
        stored.nonce !== callback.nonce ||
        stored.revision !== callback.revision
      ) {
        return { status: "stale" };
      }

      const state = clone(stored);
      state.revision = stored.revision + 1;
      state.updatedAt = now;
      state.expiresAt = now + this.ttlMs();
      // Reserve the revision before executing side effects. A duplicate click
      // therefore cannot repeat a mutation even when the downstream service
      // succeeds but its response is lost.
      await this.store.set(storageKey, state);

      const value = await operation(state, callback);
      await this.store.set(storageKey, state);

      return { status: "ok", state: clone(state), value };
    });
  }
}
