import { McpSenderSession } from "../../social-module/profile/mcp/sender-session";
jest.mock("../../social-module/profile/mcp/sender-session");
jest.mock("@sps/shared-utils", () => ({
  ...jest.requireActual("@sps/shared-utils"),
  RBAC_JWT_SECRET: "scope-test-jwt",
}));

import { Service } from "./index";

function fixture() {
  const read = jest
    .spyOn(McpSenderSession.prototype, "read")
    .mockResolvedValue("buyer-access");
  const me = jest.fn().mockResolvedValue({ id: "buyer", variant: "default" });
  const input = {
    storeId: "store",
    taskId: "task",
    assigneeId: "agent",
    eventId: "event",
    assignmentRevision: 4,
  };
  const task = {
    id: "task",
    storeId: "store",
    stageId: "stage",
    assigneeKind: "ai",
    assigneeId: "agent",
    openingKey: "order",
    customerId: "buyer",
  };
  const profile = {
    id: "profile",
    variant: "artificial-intelligence",
    allowedMcpServerIds: ["singlepagestartup"],
  };
  const identity = {
    subjectId: "agent",
    socialModuleProfileId: "profile",
    variant: "default",
  };
  const grants = jest.fn().mockResolvedValue([{ variant: "crm-agent" }]);
  const memberships = jest.fn().mockResolvedValue([{ profileId: "profile" }]);
  const callTool = jest
    .fn()
    .mockResolvedValue({ isError: false, text: "found" });
  const open = jest.fn().mockResolvedValue({
    catalog: {
      connected: [
        {
          id: "singlepagestartup",
          title: "SPS",
          tools: [{ name: "lookup", inputSchema: { type: "object" } }],
        },
      ],
    },
    callTool,
    close: jest.fn(),
  });
  const service = new Service({
    findById: async () => ({ variant: "agent" }),
    module: {
      subjectsToEcommerceModuleStores: { find: grants },
      subjectsToSocialModuleProfiles: {
        find: async ({
          params,
        }: {
          params: { filters: { and: { column: string }[] } };
        }) =>
          params.filters.and[0].column === "subjectId"
            ? [identity]
            : [
                identity,
                {
                  subjectId: "manager",
                  socialModuleProfileId: "profile",
                  variant: "assistant",
                },
              ],
      },
    },
    modules: {
      crm: {
        task: { getWork: async () => ({ task }) },
        tasksToStages: {
          findById: async () => ({
            taskId: "task",
            kind: "customer-message",
            detail: { assigneeId: "agent", messageId: "message" },
            assignmentRevision: 4,
          }),
        },
      },
      social: {
        chatsToCrmModuleTasks: {
          channels: async () => [
            { chatId: "chat", threadId: "thread", crmModuleTaskId: "task" },
          ],
        },
        profilesToChats: { find: memberships },
        profile: { findById: async () => profile },
      },
    },
    socialModuleProfileMcpCatalogOpen: open,
    me,
  } as unknown as ConstructorParameters<typeof Service>[0]);
  return {
    service,
    input,
    profile,
    grants,
    memberships,
    callTool,
    open,
    task,
    me,
    read,
  };
}

it("requires the order agent to remain assigned, in the store and chat, with the connection enabled", async () => {
  const { service, input, profile, grants, memberships, callTool, open, task } =
    fixture();
  const session = await service.openMcpForRun(input);
  expect(open).toHaveBeenCalledWith(
    expect.objectContaining({
      subjectId: "buyer",
      rbacSubjectAuthenticationJwt: "buyer-access",
      configuredServerIds: ["singlepagestartup"],
    }),
  );
  const name = session!.tools[0].function.name;
  await session!.call(name, {});
  expect(callTool).toHaveBeenCalledTimes(1);
  grants.mockResolvedValueOnce([]);
  await expect(session!.call(name, {})).rejects.toThrow("store");
  memberships.mockResolvedValueOnce([]);
  await expect(session!.call(name, {})).rejects.toThrow(
    "profile is unavailable",
  );
  profile.allowedMcpServerIds = [];
  await expect(session!.call(name, {})).rejects.toThrow(
    "connection or assignment",
  );
  expect(await service.openMcpForRun(input)).toBeUndefined();
  expect(open).toHaveBeenCalledTimes(1);
  profile.allowedMcpServerIds = ["singlepagestartup"];
  task.stageId = "different-stage";
  await expect(session!.call(name, {})).rejects.toThrow(
    "connection or assignment",
  );
  expect(callTool).toHaveBeenCalledTimes(1);
  await session!.close();
});

it("never opens MCP for a queued message without the original sender session", async () => {
  const { service, input, read, open } = fixture();
  read.mockResolvedValueOnce(undefined);
  expect(await service.openMcpForRun(input)).toBeUndefined();
  expect(read).toHaveBeenCalledWith("message", "buyer");
  expect(open).not.toHaveBeenCalled();
});

it("rechecks the sender before executing even when the agent remains assigned", async () => {
  const { service, input, me, callTool } = fixture();
  const session = await service.openMcpForRun(input);
  me.mockRejectedValueOnce(new Error("Authentication error. Token revoked"));
  await expect(
    session!.call(session!.tools[0].function.name, {}),
  ).rejects.toThrow("Token revoked");
  expect(callTool).not.toHaveBeenCalled();
});

it("skips tools when the sender logged out before the worker opened the message", async () => {
  const { service, input, me, open } = fixture();
  me.mockRejectedValueOnce(new Error("Authentication error. Token revoked"));
  expect(await service.openMcpForRun(input)).toBeUndefined();
  expect(open).not.toHaveBeenCalled();
});
