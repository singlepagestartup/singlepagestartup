import type { Context } from "hono";
import { Handler } from "./models";

it("reads only the assigned models for this customer, profile and chat", async () => {
  const settings = { auto: { id: "auto" }, groups: [] };
  const chatModels = jest.fn().mockResolvedValue(settings);
  const service = { providerConnections: { chatModels } };
  const params: Record<string, string> = {
    id: "buyer",
    socialModuleProfileId: "profile",
    socialModuleChatId: "chat",
  };
  const c = {
    req: { param: (key: string) => params[key], query: jest.fn() },
    header: jest.fn(),
    json: (body: unknown) => body,
  } as unknown as Context;
  const handler = new Handler(service as never);
  expect(await handler.execute(c)).toEqual({ data: settings });
  expect(chatModels).toHaveBeenCalledWith("buyer", "profile", "chat");
  expect(c.header).toHaveBeenCalledWith("Cache-Control", "private, no-store");
  const threadId = "00000000-0000-4000-8000-000000000001";
  jest.mocked(c.req.query).mockReturnValue(threadId as never);
  await handler.execute(c);
  expect(chatModels).toHaveBeenLastCalledWith(
    "buyer",
    "profile",
    "chat",
    threadId,
  );
  jest.mocked(c.req.query).mockReturnValueOnce("invalid" as never);
  await expect(handler.execute(c)).rejects.toMatchObject({ status: 400 });
  expect(chatModels).toHaveBeenCalledTimes(2);
  chatModels.mockRejectedValue(
    new Error("Forbidden error. Profile is outside this chat"),
  );
  await expect(handler.execute(c)).rejects.toMatchObject({ status: 403 });
});
