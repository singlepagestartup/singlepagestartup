/**
 * BDD Suite: durable AI execution action projection.
 *
 * Given: a social.profile tool loop emits safe tool lifecycle events.
 * When: the reporter projects them into Social actions.
 * Then: one related action is updated in place and persistence failure cannot interrupt work.
 */

jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: {
    socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate:
      jest.fn(),
  },
}));

jest.mock("@sps/social/models/action/sdk/server", () => ({
  api: {
    create: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("@sps/social/relations/chats-to-actions/sdk/server", () => ({
  api: { create: jest.fn() },
}));

jest.mock("@sps/social/relations/profiles-to-actions/sdk/server", () => ({
  api: { create: jest.fn() },
}));

jest.mock("@sps/social/relations/threads-to-actions/sdk/server", () => ({
  api: { create: jest.fn() },
}));

import { AiExecutionActionReporter } from "./execution-action";
import type { TSocialProfileAiToolLoopEvent } from "./tool-loop";
import { isSocialMessageExcludedFromOpenRouter } from "@sps/social/models/message/sdk/model";
import { api as rbacModuleSubjectApi } from "@sps/rbac/models/subject/sdk/server";
import { api as socialModuleActionApi } from "@sps/social/models/action/sdk/server";

const mockedTelegramMessageCreate =
  rbacModuleSubjectApi.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate as jest.Mock;
const mockedActionCreate = socialModuleActionApi.create as jest.Mock;
const mockedActionUpdate = socialModuleActionApi.update as jest.Mock;

function createPersistence() {
  return {
    createAction: jest.fn(async () => ({ id: "action-1" })),
    updateAction: jest.fn(async () => ({ id: "action-1" })),
    linkChat: jest.fn(async () => ({})),
    linkThread: jest.fn(async () => ({})),
    linkProfile: jest.fn(async () => ({})),
    createTelegramMessage: jest.fn(
      async (_data: {
        description: string;
        metadata: Record<string, unknown>;
      }) => ({}),
    ),
  };
}

function createReporter(
  persistence = createPersistence(),
  props?: {
    telegramMessage?: {
      rbacSubjectId: string;
      authorizationJwt: string;
      language?: string;
    };
  },
) {
  const timestamps = [
    "2026-07-13T12:00:00.000Z",
    "2026-07-13T12:00:01.000Z",
    "2026-07-13T12:00:02.000Z",
    "2026-07-13T12:00:03.000Z",
    "2026-07-13T12:00:04.000Z",
  ];
  let index = 0;

  return {
    persistence,
    reporter: new AiExecutionActionReporter({
      chatId: "chat-1",
      threadId: "thread-1",
      triggerMessageId: "message-1",
      replySocialProfileId: "profile-1",
      secretKey: "secret",
      runId: "run-1",
      now: () => new Date(timestamps[index++] || timestamps.at(-1)!),
      persistence,
      ...(props?.telegramMessage
        ? { telegramMessage: props.telegramMessage }
        : {}),
    }),
  };
}

function toolEvent(
  type: "tool_requested" | "tool_started" | "tool_succeeded",
): TSocialProfileAiToolLoopEvent {
  return {
    type,
    callId: "call-1",
    name: "mcp__singlepagestartup__model-record-count",
    source: "mcp",
    label: "Count model records",
    serverId: "singlepagestartup",
    selectedModelId: "openai/gpt-5.5",
    ...(type === "tool_succeeded" ? { resultBytes: 42 } : {}),
  } as TSocialProfileAiToolLoopEvent;
}

describe("Given: safe social.profile tool lifecycle events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: no tool is requested during the run.
   * When: only the terminal event is reported.
   * Then: no Social action is created.
   */
  it("When: no tool runs Then: it creates no action", async () => {
    const { reporter, persistence } = createReporter();

    await reporter.handle({
      type: "run_completed",
      selectedModelId: "openai/gpt-5.5",
      stopReason: "final_text",
      durationMs: 100,
    });

    expect(persistence.createAction).not.toHaveBeenCalled();
    expect(persistence.updateAction).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: one MCP call advances through its lifecycle.
   * When: the reporter receives every event.
   * Then: it creates one action, awaits all relations, and updates that stable id.
   */
  it("When: one tool completes Then: one related action is updated in place", async () => {
    const { reporter, persistence } = createReporter();

    await reporter.handle(toolEvent("tool_requested"));
    await reporter.handle(toolEvent("tool_started"));
    await reporter.handle(toolEvent("tool_succeeded"));
    await reporter.handle({
      type: "run_completed",
      selectedModelId: "openai/gpt-5.5",
      stopReason: "final_text",
      durationMs: 3000,
    });

    expect(persistence.createAction).toHaveBeenCalledTimes(1);
    expect(persistence.linkChat).toHaveBeenCalledWith("action-1", "chat-1");
    expect(persistence.linkThread).toHaveBeenCalledWith("action-1", "thread-1");
    expect(persistence.linkProfile).toHaveBeenCalledWith(
      "action-1",
      "profile-1",
    );
    expect(persistence.updateAction).toHaveBeenCalledTimes(3);
    expect(persistence.updateAction).toHaveBeenLastCalledWith(
      "action-1",
      expect.objectContaining({
        runId: "run-1",
        status: "completed",
        phase: "finalizing",
        steps: [
          expect.objectContaining({
            id: "call-1",
            status: "succeeded",
            resultBytes: 42,
          }),
        ],
      }),
    );
    expect(persistence.createTelegramMessage).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: an AI tool run belongs to a Telegram chat.
   * When: its complete execution action is projected for the user.
   * Then: one bounded message lists the tools and carries the durable OpenRouter exclusion marker.
   */
  it("When: Telegram tools complete Then: it creates one excluded tool-call message", async () => {
    const persistence = createPersistence();
    const { reporter } = createReporter(persistence, {
      telegramMessage: {
        rbacSubjectId: "subject-1",
        authorizationJwt: "jwt-1",
        language: "ru",
      },
    });

    await reporter.handle(toolEvent("tool_requested"));
    await reporter.handle(toolEvent("tool_started"));
    await reporter.handle(toolEvent("tool_succeeded"));
    await reporter.handle({
      type: "run_completed",
      selectedModelId: "openai/gpt-5.5",
      stopReason: "final_text",
      durationMs: 3000,
    });

    expect(persistence.createTelegramMessage).toHaveBeenCalledTimes(1);
    const data = persistence.createTelegramMessage.mock.calls[0]?.[0];

    expect(data).toEqual({
      description:
        "🛠 Вызов инструментов\n\n" +
        "1. ✅ Count model records\n" +
        "   SinglePageStartup MCP · model-record-count",
      metadata: {
        aiExecution: {
          version: 1,
          actionId: "action-1",
          runId: "run-1",
          status: "completed",
          toolCount: 1,
        },
        systemMessage: {
          version: 1,
          source: "rbac.telegram.ai-execution",
          excludeFromOpenRouter: true,
          awaitNotification: true,
        },
      },
    });
    expect(isSocialMessageExcludedFromOpenRouter(data?.metadata)).toBe(true);
  });

  /**
   * BDD Scenario
   * Given: the production reporter receives Telegram delivery credentials.
   * When: one tool run reaches its terminal event.
   * Then: it creates the system message through the canonical thread-aware RBAC route.
   */
  it("When: production Telegram projection runs Then: it uses the canonical message route", async () => {
    mockedActionCreate.mockResolvedValue({ id: "action-production" });
    mockedActionUpdate.mockResolvedValue({ id: "action-production" });
    mockedTelegramMessageCreate.mockResolvedValue({ id: "message-tools" });
    const reporter = new AiExecutionActionReporter({
      chatId: "chat-production",
      threadId: "thread-production",
      triggerMessageId: "message-trigger",
      replySocialProfileId: "profile-production",
      secretKey: "secret",
      runId: "run-production",
      telegramMessage: {
        rbacSubjectId: "subject-production",
        authorizationJwt: "telegram-jwt",
        language: "ru",
      },
    });

    await reporter.handle(toolEvent("tool_requested"));
    await reporter.handle(toolEvent("tool_succeeded"));
    await reporter.handle({
      type: "run_completed",
      selectedModelId: "openai/gpt-5.5",
      stopReason: "final_text",
      durationMs: 3000,
    });

    expect(mockedTelegramMessageCreate).toHaveBeenCalledWith({
      id: "subject-production",
      socialModuleProfileId: "profile-production",
      socialModuleChatId: "chat-production",
      socialModuleThreadId: "thread-production",
      data: expect.objectContaining({
        description: expect.stringContaining("Count model records"),
        metadata: expect.objectContaining({
          systemMessage: expect.objectContaining({
            excludeFromOpenRouter: true,
          }),
        }),
      }),
      options: {
        headers: {
          Authorization: "Bearer telegram-jwt",
        },
      },
    });
  });

  /**
   * BDD Scenario
   * Given: the action service rejects a create request.
   * When: progress is reported.
   * Then: the reporter resolves best-effort instead of rejecting the social.profile tool loop.
   */
  it("When: persistence fails Then: progress remains non-blocking", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation();
    const persistence = createPersistence();
    persistence.createAction.mockRejectedValueOnce(
      new Error("action service unavailable"),
    );
    const { reporter } = createReporter(persistence);

    await expect(
      reporter.handle(toolEvent("tool_requested")),
    ).resolves.toBeUndefined();
    await reporter.handle(toolEvent("tool_started"));

    expect(persistence.createAction).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
