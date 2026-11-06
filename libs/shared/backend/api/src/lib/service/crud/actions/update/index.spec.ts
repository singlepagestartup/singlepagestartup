import { Action } from "./index";
it("uses a single conditional database write to prevent concurrent JSON replacement", async () => {
  const repository = {
    consumeFirstByField: jest.fn().mockResolvedValue({
      id: "article",
      metadata: { seo: { title: { en: "New" } }, source: { name: "kept" } },
    }),
    updateFirstByField: jest.fn(),
  } as any;
  const data = {
    metadata: { seo: { title: { en: "New" } }, source: { name: "kept" } },
    _expectedMetadata: { source: { name: "kept" } },
  };
  await new Action(repository).execute({ id: "article", data });
  expect(repository.consumeFirstByField).toHaveBeenCalledWith(
    "id",
    "article",
    { metadata: data.metadata },
    {
      and: [
        {
          column: "metadata",
          method: "eq",
          value: { source: { name: "kept" } },
        },
      ],
    },
  );
  expect(repository.updateFirstByField).not.toHaveBeenCalled();
});
it("reports conflict when a second editor submits an outdated JSON snapshot", async () => {
  const repository = {
    consumeFirstByField: jest.fn().mockResolvedValue(undefined),
    updateFirstByField: jest.fn(),
  } as any;
  await expect(
    new Action(repository).execute({
      id: "article",
      data: { metadata: {}, _expectedMetadata: {} },
    }),
  ).rejects.toThrow("Conflict error");
  expect(repository.updateFirstByField).not.toHaveBeenCalled();
});
