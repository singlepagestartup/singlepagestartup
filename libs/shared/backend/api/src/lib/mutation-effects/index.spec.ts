import { createMutationEffectsPublisher } from ".";
it("completes all cache generation changes before broadcasting a committed mutation", async () => {
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const invalidateTopics = jest.fn(() => pending);
  const broadcast = jest.fn();
  const publish = createMutationEffectsPublisher({
    invalidateTopics,
    broadcast,
  });
  const result = publish({
    topics: ["model.records", "relation.links", "model.records"],
    payload: "/api/model/records",
  });
  expect(invalidateTopics).toHaveBeenCalledWith([
    "model.records",
    "relation.links",
  ]);
  expect(broadcast).not.toHaveBeenCalled();
  finish();
  await result;
  expect(broadcast).toHaveBeenCalledWith(
    expect.objectContaining({
      slug: "revalidation",
      payload: "/api/model/records",
      topics: ["model.records", "relation.links"],
    }),
  );
});
it("does not publish an event when an injected boundary rejects the publication", async () => {
  const broadcast = jest.fn();
  const publish = createMutationEffectsPublisher({
    invalidateTopics: async () => {
      throw new Error("unavailable");
    },
    broadcast,
  });
  await expect(
    publish({ topics: ["records"], payload: "/api/records" }),
  ).rejects.toThrow("unavailable");
  expect(broadcast).not.toHaveBeenCalled();
});

it("finishes the collection and item Next tag callbacks after HTTP invalidation and before WebSocket publication", async () => {
  const events: string[] = [];
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const publish = createMutationEffectsPublisher({
    invalidateTopics: async () => {
      events.push("HTTP cache");
    },
    revalidateTag: jest.fn(async (tag) => {
      events.push(tag);
      await pending;
    }),
    broadcast: () => {
      events.push("WebSocket");
    },
  });
  const result = publish({
    topics: ["knowledge.sources"],
    payload: "/api/knowledge/sources",
    tags: ["/api/knowledge/sources", "/api/knowledge/sources/source-id"],
  });
  await Promise.resolve();
  expect(events).toEqual([
    "HTTP cache",
    "/api/knowledge/sources",
    "/api/knowledge/sources/source-id",
  ]);
  release();
  await result;
  expect(events.at(-1)).toBe("WebSocket");
});
