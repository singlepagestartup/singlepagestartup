import { McpWork, type IMcpRound } from "./mcp";
import { McpToolResultTooLarge } from "@sps/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/singlepagestartup-client";

const tool = {
  type: "function" as const,
  function: { name: "catalog_items", parameters: { type: "object" } },
};
const lookup = {
  id: "lookup",
  type: "function" as const,
  function: { name: "catalog_items", arguments: '{"page":1}' },
};
function fixture() {
  const call = jest
    .fn()
    .mockResolvedValue({ isError: false, text: "page one" });
  const session = {
    tools: [tool],
    describe: () => ({ serverId: "inventory", name: "catalog_items" }),
    call,
    close: jest.fn(),
  };
  const scope = {
    storeId: "store",
    taskId: "task",
    eventId: "event",
    assigneeId: "agent",
    assignmentRevision: 1,
  };
  const open = jest.fn().mockResolvedValue(session);
  const service = new McpWork({
    modules: {
      crm: {
        task: {
          getWork: jest.fn().mockResolvedValue({
            task: { stageId: "stock", publicationId: "catalog" },
          }),
        },
      },
      rbac: { subject: { customerWork: { openMcpForRun: open } } },
    },
  } as never);
  const round: IMcpRound = {
    session,
    stepKey: "mcp-tools-1",
    digest: "digest",
    exchanges: [],
  };
  return { service, round, call, session, scope, open };
}

it("executes only one catalogued tool per round and does not repeat calls", async () => {
  const { service, round, call } = fixture();
  expect(await service.call(round, [lookup, lookup])).toBe("null");
  expect(
    await service.call(round, [
      { ...lookup, function: { ...lookup.function, name: "unpublished" } },
    ]),
  ).toBe("null");
  expect(call).not.toHaveBeenCalled();
  const exchange = JSON.parse(await service.call(round, [lookup]));
  expect(exchange.result).toContain("page one");
  await expect(
    service.call({ ...round, exchanges: [exchange] }, [
      { ...lookup, id: "new-id" },
    ]),
  ).resolves.toBe("null");
  expect(call).toHaveBeenCalledTimes(1);
});

it("passes large tool results in full and reports errors without copying exception details", async () => {
  const { service, round, call } = fixture();
  const fullText = "Статья о разработке ".repeat(6000);
  call.mockResolvedValueOnce({ text: fullText, isError: false });
  expect(
    JSON.parse(JSON.parse(await service.call(round, [lookup])).result),
  ).toMatchObject({ isError: false, text: fullText });
  call.mockRejectedValueOnce(new Error("private connection details"));
  const refused = await service.call(round, [lookup]);
  expect(refused).not.toContain("private connection details");
  expect(JSON.parse(JSON.parse(refused).result)).toMatchObject({
    isError: true,
  });
  call.mockRejectedValueOnce(new McpToolResultTooLarge(32768));
  const oversized = JSON.parse(await service.call(round, [lookup]));
  expect(oversized.step.errorCode).toBe("result_too_large");
  expect(JSON.parse(oversized.result).text).toContain("smaller page");
});

it("projects schema fields from the SPS response while keeping raw records and arguments out of the timeline", async () => {
  const { service, round, session, call } = fixture();
  session.describe = () => ({
    serverId: "singlepagestartup",
    name: "model-schema",
  });
  call.mockResolvedValue({
    isError: false,
    text: JSON.stringify({
      ok: true,
      data: {
        fields: [{ name: "id", type: "uuid", example: "private-example" }],
        secret: "private-secret",
      },
    }),
  });
  const result = JSON.parse(
    await service.call(round, [
      {
        ...lookup,
        function: {
          ...lookup.function,
          arguments: JSON.stringify({
            module: "crm",
            model: "task",
            headers: "private-header",
          }),
        },
      },
    ]),
  );
  expect(result.step).toMatchObject({
    status: "succeeded",
    parameters: { module: "crm", model: "task" },
    schemaFields: [{ name: "id", type: "uuid" }],
  });
  expect(JSON.stringify(result.step)).not.toMatch(/private-/);
});

it("discards cached exchanges when the delegated sender session changes", async () => {
  const { service, scope, session } = fixture();
  let digest = "";
  const perform = jest.fn(async (round: IMcpRound) => {
    digest ||= round.digest;
    return {
      state: "delivered",
      requestDigest: digest,
      result: { text: "null" },
    } as never;
  });
  Object.assign(session, { authorityKey: "first-session" });
  await service.plan(scope, perform);
  Object.assign(session, { authorityKey: "second-session" });
  await expect(service.plan(scope, perform)).resolves.toEqual({});
  expect(perform.mock.calls[1][0].digest).not.toBe(digest);
});

it("keeps two paid tool rounds in native order and closes the connection", async () => {
  const { service, scope, session } = fixture();
  const perform = jest.fn(async (round: IMcpRound) => {
    const call = {
      ...lookup,
      id: round.stepKey,
      function: {
        ...lookup.function,
        arguments: JSON.stringify({ page: round.exchanges.length + 1 }),
      },
    };
    return {
      state: "delivered",
      requestDigest: round.digest,
      result: { text: await service.call(round, [call]) },
    } as never;
  });
  const { advice } = await service.plan(scope, perform);
  expect(perform).toHaveBeenCalledTimes(2);
  expect(advice?.history.map(({ role }) => role)).toEqual([
    "assistant",
    "tool",
    "assistant",
    "tool",
  ]);
  expect(session.close).toHaveBeenCalledTimes(1);
});

it("omits results from a changed catalog and makes no paid call without connections", async () => {
  const { service, scope, session, open } = fixture();
  const oldAttempt = jest.fn().mockResolvedValue({
    state: "delivered",
    requestDigest: "stale",
    result: { text: "private output" },
  });
  await expect(service.plan(scope, oldAttempt)).resolves.toEqual({});
  expect(session.close).toHaveBeenCalledTimes(1);
  open.mockResolvedValue(undefined);
  await expect(service.plan(scope, oldAttempt)).resolves.toEqual({});
  expect(oldAttempt).toHaveBeenCalledTimes(1);
});
