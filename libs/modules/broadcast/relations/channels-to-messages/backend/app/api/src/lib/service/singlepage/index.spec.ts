jest.mock("@sps/shared-backend-api", () => {
  const actual = jest.requireActual("@sps/shared-backend-api");
  return {
    ...actual,
    withConsistencySnapshot: (operation: () => Promise<unknown>) => operation(),
  };
});

import { randomUUID } from "node:crypto";
import type { Repository } from "../../repository";
import { Service } from ".";

describe("visible relation message reader", () => {
  const id = randomUUID();
  const messageId = randomUUID();

  function createService() {
    const repository = { findFirstByField: jest.fn() };
    const messages = { findPayloadById: jest.fn() };
    const service = new Service(repository as unknown as Repository, messages);
    return { service, repository, messages };
  }

  it("does not read a payload when the link is hidden or missing", async () => {
    const { service, messages } = createService();
    expect(await service.findWithMessage(id)).toBeNull();
    expect(messages.findPayloadById).not.toHaveBeenCalled();
  });

  it("uses the effective relation and message services", async () => {
    const { service, messages, repository } = createService();
    const relation = { id, messageId };
    const message = { id: messageId, payload: "project-specific reader" };
    jest.spyOn(service, "findById").mockResolvedValue(relation as never);
    messages.findPayloadById.mockResolvedValue(message);

    expect(await service.findWithMessage(id)).toEqual({ relation, message });
    expect(repository.findFirstByField).not.toHaveBeenCalled();
    expect(messages.findPayloadById).toHaveBeenCalledWith({ id: messageId });
  });

  it("returns null when the payload is missing", async () => {
    const { service, repository, messages } = createService();
    repository.findFirstByField.mockResolvedValue({ id, messageId });
    messages.findPayloadById.mockResolvedValue(null);
    expect(await service.findWithMessage(id)).toBeNull();
  });

  it("propagates a reader failure instead of caching an empty response", async () => {
    const { service, repository, messages } = createService();
    repository.findFirstByField.mockResolvedValue({ id, messageId });
    messages.findPayloadById.mockRejectedValue(
      new Error("database unavailable"),
    );
    await expect(service.findWithMessage(id)).rejects.toThrow(
      "database unavailable",
    );
  });
});
