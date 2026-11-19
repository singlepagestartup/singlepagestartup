jest.mock("@sps/shared-backend-api", () => {
  const actual = jest.requireActual("@sps/shared-backend-api");
  return {
    ...actual,
    withConsistencySnapshot: (operation: () => Promise<unknown>) => operation(),
  };
});

import { randomUUID } from "node:crypto";
import { createAppAssembly } from "@sps/shared-backend-api";
import { serviceBootstrap as messageOwner } from "@sps/broadcast/models/message/backend/app/api/src/lib/bootstrap";
import { serviceBootstrap as relationOwner } from "../../bootstrap";

describe("visible relation message reader", () => {
  const id = randomUUID();
  const messageId = randomUUID();

  function createService() {
    const messages = messageOwner.createService(createAppAssembly());
    const findPayloadById = jest.spyOn(messages, "findPayloadById");
    const findById = jest.fn();
    const assembly = createAppAssembly(({ overrideServiceWith }) => {
      overrideServiceWith(messageOwner, (scope) =>
        messages.withRepository(messages.repository, scope),
      );
    });
    const service = relationOwner.createService(assembly);
    const findRecord = jest
      .spyOn(service.repository, "findFirstByField")
      .mockImplementation(findById);
    return { service, findRecord, findPayloadById };
  }

  it("does not read a payload when the link is hidden or missing", async () => {
    const { service, findPayloadById } = createService();
    expect(await service.findWithMessage(id)).toBeNull();
    expect(findPayloadById).not.toHaveBeenCalled();
  });

  it("uses the effective relation and message services", async () => {
    const { service, findPayloadById, findRecord } = createService();
    const relation = { id, messageId };
    const message = { id: messageId, payload: "project-specific reader" };
    jest.spyOn(service, "findById").mockResolvedValue(relation as never);
    findPayloadById.mockResolvedValue(message as never);

    expect(await service.findWithMessage(id)).toEqual({ relation, message });
    expect(findRecord).not.toHaveBeenCalled();
    expect(findPayloadById).toHaveBeenCalledWith({ id: messageId });
  });

  it("returns null when the payload is missing", async () => {
    const { service, findRecord, findPayloadById } = createService();
    findRecord.mockResolvedValue({ id, messageId });
    findPayloadById.mockResolvedValue(null);
    expect(await service.findWithMessage(id)).toBeNull();
  });

  it("propagates a reader failure instead of caching an empty response", async () => {
    const { service, findRecord, findPayloadById } = createService();
    findRecord.mockResolvedValue({ id, messageId });
    findPayloadById.mockRejectedValue(new Error("database unavailable"));
    await expect(service.findWithMessage(id)).rejects.toThrow(
      "database unavailable",
    );
  });
});
