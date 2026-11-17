import { Repository } from "./repository";

it("keeps shared offer and Product locks in ascending offer order", async () => {
  const repository: Repository = Object.create(Repository.prototype);
  const lock = jest.fn(async () => []);
  const orderBy = jest.fn(() => ({ for: lock }));
  Object.defineProperty(repository, "db", {
    value: {
      select: () => ({
        from: () => ({ innerJoin: () => ({ where: () => ({ orderBy }) }) }),
      }),
    },
  });
  await repository.lockOfferProducts(["target", "source"]);
  expect(orderBy).toHaveBeenCalledTimes(1);
  expect(lock).toHaveBeenCalledWith("share");
});

it("keeps the update row lock until its surrounding transaction completes", async () => {
  const repository: Repository = Object.create(Repository.prototype);
  const record = { id: "link" };
  const lock = jest.fn(async () => [record]);
  Object.defineProperty(repository, "db", {
    value: {
      select: () => ({ from: () => ({ where: () => ({ for: lock }) }) }),
    },
  });
  expect(await repository.lockById(record.id)).toEqual(record);
  expect(lock).toHaveBeenCalledWith("update");
});
