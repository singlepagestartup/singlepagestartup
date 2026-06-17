/**
 * BDD Suite: OpenRouter model favorites.
 *
 * Given: a user stores OpenRouter model favorites for chat controls.
 * When: favorites are read and updated through the RBAC-scoped endpoint.
 * Then: values are stored in KV per subject and normalized before persistence.
 */

const mockKvGet = jest.fn();
const mockKvSet = jest.fn();

import { Context } from "hono";
import { Handler } from "./model-favorites";

function createService(props?: { canAccessChat?: boolean }) {
  return {
    socialModule: {
      profilesToChats: {
        find: jest.fn(async () => {
          return props?.canAccessChat === false
            ? []
            : [
                {
                  profileId: "profile-1",
                  chatId: "chat-1",
                },
              ];
        }),
      },
    },
  };
}

function createContext(props: {
  body?: unknown;
  method: "GET" | "PATCH";
}): Context {
  const params: Record<string, string> = {
    id: "subject-1",
    socialModuleProfileId: "profile-1",
    socialModuleChatId: "chat-1",
  };

  return {
    req: {
      method: props.method,
      param(name: string) {
        return params[name];
      },
      async json() {
        return props.body;
      },
    },
    json(payload: unknown) {
      return payload as Response;
    },
  } as unknown as Context;
}

function createKvProvider() {
  return async () => {
    return {
      get: mockKvGet,
      set: mockKvSet,
    };
  };
}

describe("Given: OpenRouter model favorites", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a PATCH request contains duplicate model ids, auto, and invalid values.
   * When: OpenRouter model favorites are updated.
   * Then: only unique concrete model ids are persisted in KV for the subject.
   */
  it("When: favorites are updated Then: concrete model ids are normalized", async () => {
    const handler = new Handler(createService() as any, createKvProvider());
    const response = (await handler.execute(
      createContext({
        method: "PATCH",
        body: {
          data: {
            favoriteModelIds: [
              "openai/gpt-5.2",
              "auto",
              "openai/gpt-5.2",
              "",
              null,
              "anthropic/claude-sonnet-4.6",
            ],
          },
        },
      }),
      undefined,
    )) as any;

    expect(mockKvSet).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: "rbac:subject:openrouter-model-favorites",
        key: "subject-1",
        value: JSON.stringify({
          favoriteModelIds: ["openai/gpt-5.2", "anthropic/claude-sonnet-4.6"],
        }),
      }),
    );
    expect(response.data.favoriteModelIds).toEqual([
      "openai/gpt-5.2",
      "anthropic/claude-sonnet-4.6",
    ]);
  });

  /**
   * BDD Scenario
   * Given: a profile is not linked to the requested chat.
   * When: OpenRouter model favorites are requested.
   * Then: the endpoint rejects the request before reading user KV state.
   */
  it("When: profile cannot access chat Then: favorites are not read", async () => {
    const handler = new Handler(
      createService({
        canAccessChat: false,
      }) as any,
      createKvProvider(),
    );

    await expect(
      handler.execute(
        createContext({
          method: "GET",
        }),
        undefined,
      ),
    ).rejects.toThrow(
      "Authorization error. Requested social-module chat does not belong to profile",
    );
    expect(mockKvGet).not.toHaveBeenCalled();
  });
});
