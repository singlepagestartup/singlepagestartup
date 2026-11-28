jest.mock("@sps/shared-backend-api", () => ({
  withConsistencySnapshot: (run: () => Promise<unknown>) => run(),
}));
jest.mock("@sps/shared-utils", () => ({ RBAC_JWT_SECRET: "test" }));
jest.mock("@sps/backend-utils", () => ({
  getHttpErrorType: (error: Error) => ({ status: 500, message: error.message }),
}));

import type { Context } from "hono";
import { Handler } from "./find";

interface ILinkQuery {
  params: {
    filters: {
      and: Array<{ column: string; method: string; value: string | string[] }>;
    };
    limit: number;
    offset: number;
  };
}

it("filters a private support thread before paging the remaining discussions", async () => {
  const find = jest.fn(async ({ params }: ILinkQuery) => {
    const excluded = params.filters.and.find(
      ({ method }) => method === "notInArray",
    );
    return ["private-support", "first-discussion", "second-discussion"]
      .filter((id) => !excluded?.value.includes(id))
      .slice(params.offset, params.offset + params.limit)
      .map((threadId) => ({ threadId }));
  });
  const handler = new Handler({
    socialModuleChatLifecycleAssertSubjectOwnsChat: jest.fn(),
    customerWork: {
      orderSupport: {
        prepareChat: async () => ({
          completedTaskIds: new Set(),
          supportByTask: new Map(),
        }),
        threadIdsForChat: async () => ["private-support"],
      },
    },
    repository: { socialThreadActivity: async () => [] },
    modules: {
      social: {
        chatsToThreads: { find },
        thread: {
          find: async ({ params }) =>
            params.filters.and[0].value.map((id: string) => ({ id })),
        },
        chatsToCrmModuleTasks: { channels: async () => [] },
        threadsToEcommerceModuleProducts: { find: async () => [] },
      },
    },
  } as unknown as ConstructorParameters<typeof Handler>[0]);
  const context = {
    req: {
      param: (name: string) => (name === "id" ? "worker" : "chat"),
      query: () => undefined,
    },
    get: (name: string) =>
      name === "parsedQuery" ? { limit: 1, offset: 1 } : undefined,
    json: (data: unknown) => Response.json(data),
  } as unknown as Context;

  const response = await handler.execute(context, jest.fn());
  await expect(response.json()).resolves.toMatchObject({
    data: [{ id: "second-discussion" }],
  });
  expect(find).toHaveBeenCalledWith({
    params: expect.objectContaining({
      filters: {
        and: expect.arrayContaining([
          {
            column: "threadId",
            method: "notInArray",
            value: ["private-support"],
          },
        ]),
      },
      limit: 1,
      offset: 1,
    }),
  });
});
