/**
 * @jest-environment jsdom
 */

/**
 * BDD Suite: visible AI execution action row.
 *
 * Given: the conversation timeline receives an ai-execution Social action.
 * When: running, terminal, or malformed payloads render.
 * Then: users see safe tool progress and raw execution data is never shown.
 */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AiExecutionActionRow } from "./AiExecutionActionRow";
import { areActionRowPropsEqual } from "./action-row-memo";

const startedAt = "2026-07-13T12:00:00.000Z";

function createAction(props?: {
  status?: "running" | "completed" | "failed";
  updatedAt?: string;
}) {
  const isTerminal =
    props?.status === "completed" || props?.status === "failed";

  return {
    id: "action-1",
    createdAt: startedAt,
    updatedAt: props?.updatedAt || startedAt,
    variant: "ai-execution",
    payload: {
      version: 1,
      runId: "run-1",
      triggerMessageId: "message-1",
      replySocialProfileId: "profile-1",
      status: props?.status || "running",
      phase: isTerminal ? "finalizing" : "tool_running",
      selectedModelId: "openai/gpt-5.5",
      startedAt,
      ...(isTerminal ? { completedAt: "2026-07-13T12:00:03.000Z" } : {}),
      authorization: "Bearer must-not-render",
      steps: [
        {
          id: "call-1",
          kind: "mcp",
          serverId: "singlepagestartup",
          toolName: "mcp__singlepagestartup__model-record-count",
          label: "Count model records",
          status:
            props?.status === "completed"
              ? "succeeded"
              : props?.status === "failed"
                ? "failed"
                : "running",
          startedAt,
          ...(isTerminal
            ? {
                completedAt: "2026-07-13T12:00:02.000Z",
                ...(props?.status === "completed"
                  ? { resultBytes: 42 }
                  : { errorCode: "tool_error" }),
              }
            : {}),
          arguments: { jwt: "must-not-render" },
          result: { count: 100 },
        },
      ],
    },
  } as any;
}

describe("Given: an ai-execution action in the message timeline", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  /**
   * BDD Scenario
   * Given: a SinglePageStartup MCP tool is currently running.
   * When: the specialized row renders.
   * Then: its server, safe label, and tool name are visible without arguments or credentials.
   */
  it("When: MCP work is running Then: safe live progress is visible", async () => {
    await act(async () => {
      root.render(
        <AiExecutionActionRow
          action={createAction()}
          language="ru"
          profile={{
            href: "/profiles/profile-1",
            id: "profile-1",
            initial: "A",
            slug: "AI Maksim",
          }}
        />,
      );
    });

    expect(container.textContent).toContain(
      "Использует SinglePageStartup MCP: Count model records",
    );
    expect(container.textContent).toContain("model-record-count");
    expect(container.textContent).not.toContain("mcp__singlepagestartup__");
    expect(container.textContent).not.toContain("must-not-render");
    expect(container.textContent).not.toContain("Bearer");
    expect(container.textContent).not.toContain('"count"');
  });

  /**
   * BDD Scenario
   * Given: the MCP tool and run completed.
   * When: the action is updated in place.
   * Then: the same row reports completion and retains its safe details.
   */
  it("When: MCP work completes Then: the row reports terminal success", async () => {
    await act(async () => {
      root.render(
        <AiExecutionActionRow
          action={createAction({ status: "completed" })}
          language="ru"
          profile={{
            href: "/profiles/profile-1",
            id: "profile-1",
            initial: "A",
            slug: "AI Maksim",
          }}
        />,
      );
    });

    expect(container.textContent).toContain(
      "Завершил работу с инструментами · 1",
    );
    expect(
      container
        .querySelector('[data-variant="ai-execution"]')
        ?.getAttribute("data-status"),
    ).toBe("completed");
  });

  /**
   * BDD Scenario
   * Given: tool execution failed without exposing private implementation details.
   * When: the terminal action renders.
   * Then: the failure copy describes only the task and never assigns a role.
   */
  it("When: tool work fails Then: the title stays role-neutral", async () => {
    await act(async () => {
      root.render(
        <AiExecutionActionRow
          action={createAction({ status: "failed" })}
          language="ru"
          profile={{
            href: "/profiles/profile-1",
            id: "profile-1",
            initial: "A",
            slug: "AI Maksim",
          }}
        />,
      );
    });

    expect(container.textContent).toContain("Не получилось завершить задачу");
    expect(container.textContent?.toLowerCase()).not.toContain("сотрудник");
  });

  /**
   * BDD Scenario
   * Given: a corrupted ai-execution payload contains raw secret-like data.
   * When: parsing fails.
   * Then: a safe unavailable state replaces the generic raw JSON fallback.
   */
  it("When: payload is malformed Then: raw JSON is never rendered", async () => {
    const action = createAction();
    action.payload.startedAt = "invalid";

    await act(async () => {
      root.render(
        <AiExecutionActionRow
          action={action}
          language="ru"
          profile={{
            href: "/profiles/profile-1",
            id: "profile-1",
            initial: "A",
            slug: "AI Maksim",
          }}
        />,
      );
    });

    expect(container.textContent).toContain(
      "Статус выполнения инструмента недоступен.",
    );
    expect(container.textContent).not.toContain("must-not-render");
    expect(container.textContent).not.toContain("Bearer");
  });

  /**
   * BDD Scenario
   * Given: WebSocket invalidation returns fresh action objects.
   * When: memo equality evaluates an unchanged sibling and the updated row.
   * Then: only a changed id, language, or updatedAt crosses the row boundary.
   */
  it("When: action data refetches Then: updatedAt scopes row rerenders", () => {
    const original = createAction();
    const unchanged = createAction();
    const updated = createAction({
      status: "completed",
      updatedAt: "2026-07-13T12:00:03.000Z",
    });

    expect(
      areActionRowPropsEqual(
        { action: original, language: "ru" },
        { action: unchanged, language: "ru" },
      ),
    ).toBe(true);
    expect(
      areActionRowPropsEqual(
        { action: original, language: "ru" },
        { action: updated, language: "ru" },
      ),
    ).toBe(false);
  });
});
