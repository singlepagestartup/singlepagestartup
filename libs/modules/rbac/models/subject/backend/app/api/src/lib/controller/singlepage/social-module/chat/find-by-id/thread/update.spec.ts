/**
 * BDD Suite: Telegram thread rename mirror.
 *
 * Given: a subject renames a Telegram-backed SPS thread.
 * When: the RBAC thread update handler persists the title.
 * Then: the Telegram forum topic is renamed before the SPS thread update succeeds.
 */

const mockSocialModuleThreadUpdate = jest.fn();

jest.mock("@sps/shared-utils", () => ({
  RBAC_JWT_SECRET: "jwt-secret",
  RBAC_SECRET_KEY: "rbac-secret",
  TELEGRAM_SERVICE_BOT_TOKEN: "telegram-token",
}));

jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({
    status: 400,
    message: error.message,
    details: null,
  }),
}));

jest.mock("@sps/social/models/thread/sdk/server", () => ({
  api: {
    update: (...args: unknown[]) => mockSocialModuleThreadUpdate(...args),
  },
}));

import { Handler } from "./update";

function createContext() {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleChatId: "chat-1",
          socialModuleThreadId: "thread-1",
        }[name];
      },
      parseBody: jest.fn().mockResolvedValue({
        data: JSON.stringify({
          title: "Renamed support",
        }),
      }),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService() {
  return {
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest
      .fn()
      .mockResolvedValue(undefined),
    socialModuleChatLifecycleAssertThreadBelongsToChat: jest
      .fn()
      .mockResolvedValue(undefined),
    socialModule: {
      chat: {
        findById: jest.fn().mockResolvedValue({
          id: "chat-1",
          variant: "telegram",
          sourceSystemId: "-100123",
        }),
      },
      thread: {
        findById: jest.fn().mockResolvedValue({
          id: "thread-1",
          variant: "telegram",
          title: "Support",
          sourceSystemId: "42",
        }),
      },
    },
  } as any;
}

describe("Given: Telegram-backed SPS thread rename", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        ok: true,
        result: true,
      }),
      statusText: "OK",
    }) as any;

    mockSocialModuleThreadUpdate.mockResolvedValue({
      id: "thread-1",
      title: "Renamed support",
      sourceSystemId: "42",
    });
  });

  /**
   * BDD Scenario
   * Given: the SPS thread already has Telegram sourceSystemId.
   * When: the thread title is patched.
   * Then: Telegram editForumTopic receives the mapped message_thread_id.
   */
  it("When: renaming thread Then: edits Telegram topic by sourceSystemId", async () => {
    const handler = new Handler(createService());

    await handler.execute(createContext(), jest.fn());

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.telegram.org/bottelegram-token/editForumTopic",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          chat_id: "-100123",
          message_thread_id: 42,
          name: "Renamed support",
        }),
      }),
    );
    expect(mockSocialModuleThreadUpdate).toHaveBeenCalledWith({
      id: "thread-1",
      data: {
        title: "Renamed support",
      },
      options: {
        headers: {
          "X-RBAC-SECRET-KEY": "rbac-secret",
        },
      },
    });
  });
});
