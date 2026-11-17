import { Service } from "./index";
import type { Repository } from "../../repository";

function fixture(
  props: {
    targetVariant?: string;
    targetProductId?: string;
    kind?: string;
  } = {},
) {
  const source = {
    id: "main",
    productId: "merchandise",
    storeId: "seller",
    variant: "default",
  };
  const target = {
    id: "contractor",
    productId: props.targetProductId ?? "delivery-service",
    storeId: "separate-contractor",
    variant: props.targetVariant ?? "default",
  };
  const conflicts: { id: string; variant: string; recurrence: string }[] = [];
  const execute = jest.fn(async () => undefined);
  const lock = jest.fn(async () => undefined);
  const repository = {
    lockTargetService: execute,
    lockOfferProducts: lock,
    find: jest.fn(async () => conflicts),
    withWriteLock: jest.fn(async (operation: () => Promise<unknown>) =>
      operation(),
    ),
    insert: jest.fn(async (data: unknown) => data),
  };
  const service = new Service(
    repository as unknown as Repository,
    {
      find: jest.fn(async (query) => {
        if (query?.params?.filters?.and?.[0]?.column === "productId") {
          return [source];
        }
        return [source, target];
      }),
    } as unknown as Service["offers"],
    {
      find: jest.fn(async () => [
        { id: source.productId, kind: "physical" },
        { id: target.productId, kind: props.kind ?? "service" },
      ]),
    } as unknown as Service["products"],
  );
  const validation = service as unknown as {
    assertLink: (data: Record<string, unknown>) => Promise<void>;
  };
  return {
    source,
    target,
    validation,
    service,
    repository,
    lock,
    conflicts,
    execute,
  };
}

it.each(["delivery", "add-on"])(
  "allows a product %s contractor belonging to another store under shared offer and Product locks",
  async (variant) => {
    const { source, target, validation, lock } = fixture();
    await expect(
      validation.assertLink({
        sourceOfferId: source.id,
        targetOfferId: target.id,
        variant,
      }),
    ).resolves.toBeUndefined();
    expect(lock).toHaveBeenCalledWith([source.id, target.id]);
  },
);

it.each([{ targetVariant: "hidden" }, { kind: "physical" }])(
  "requires an active service target for delivery and add-ons: %o",
  async (props) => {
    const { source, target, validation } = fixture(props);
    await expect(
      validation.assertLink({
        sourceOfferId: source.id,
        targetOfferId: target.id,
        variant: "delivery",
      }),
    ).rejects.toThrow("Validation error");
  },
);

it("keeps the same-product provider invariant", async () => {
  const { source, target, validation } = fixture({ targetVariant: "provider" });
  await expect(
    validation.assertLink({
      sourceOfferId: source.id,
      targetOfferId: target.id,
      variant: "fulfilled-by",
    }),
  ).rejects.toThrow("Provider must fulfill the same service product");
});

it("serializes contractor definition writes before checking sibling configurations", async () => {
  const { source, target, validation, lock, execute, conflicts } = fixture();
  conflicts.push({ id: "existing", variant: "delivery", recurrence: "first" });
  await expect(
    validation.assertLink({
      sourceOfferId: source.id,
      targetOfferId: target.id,
      variant: "delivery",
      recurrence: "each",
    }),
  ).rejects.toThrow("role and recurrence must agree");
  expect(execute.mock.invocationCallOrder[0]).toBeLessThan(
    lock.mock.invocationCallOrder[0],
  );
});

it("allows equivalent sibling definitions and updating the current definition", async () => {
  const { source, target, validation, conflicts } = fixture();
  conflicts.push({ id: "existing", variant: "delivery", recurrence: "first" });
  await expect(
    validation.assertLink({
      sourceOfferId: source.id,
      targetOfferId: target.id,
      variant: "delivery",
      recurrence: "first",
    }),
  ).resolves.toBeUndefined();
  await expect(
    validation.assertLink({
      sourceOfferId: source.id,
      targetOfferId: target.id,
    }),
  ).resolves.toBeUndefined();
  await expect(
    validation.assertLink({
      id: "existing",
      sourceOfferId: source.id,
      targetOfferId: target.id,
      variant: "add-on",
      recurrence: "each",
    }),
  ).resolves.toBeUndefined();
});

it("keeps an archived source usable for its Product's shared service definition", async () => {
  const { source, target, validation } = fixture();
  source.variant = "hidden";
  await expect(
    validation.assertLink({
      sourceOfferId: source.id,
      targetOfferId: target.id,
      variant: "delivery",
    }),
  ).resolves.toBeUndefined();
});

it("validates find-or-create misses through the owning insert hook", async () => {
  const { service, source, target, repository } = fixture({ kind: "physical" });
  await expect(
    service.findOrCreate({
      data: {
        sourceOfferId: source.id,
        targetOfferId: target.id,
        variant: "delivery",
      },
    }),
  ).rejects.toThrow("Invalid source offer or service");
  expect(repository.insert).not.toHaveBeenCalled();
});

it("validates seed inserts and updates inside the same lock paths while retaining dump timestamps", async () => {
  const { service, source, target, repository, execute } = fixture();
  const data = {
    id: "link",
    sourceOfferId: source.id,
    targetOfferId: target.id,
    variant: "delivery",
    recurrence: "first",
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
  const update = jest.fn(
    async (_field: string, _id: string, fields: unknown) => fields,
  );
  const lockById = jest.fn(async () => data);
  const seed = jest.fn(
    async (
      _props: unknown,
      writes: {
        insert: (data: unknown) => Promise<unknown>;
        update: (id: string, data: unknown) => Promise<unknown>;
      },
    ) => {
      await writes.insert({ ...data });
      await writes.update(data.id, { ...data });
      return {
        module: "ecommerce",
        name: "offers-to-offers",
        type: "relation",
        seeds: [],
      };
    },
  );
  Object.assign(repository, { seed, lockById, updateFirstByField: update });
  await service.seed({ seeds: [] });
  expect(repository.withWriteLock).toHaveBeenCalledTimes(2);
  expect(execute).toHaveBeenCalledTimes(2);
  expect(lockById).toHaveBeenCalledWith(data.id);
  expect(update).toHaveBeenCalledWith("id", data.id, data);
  expect(update.mock.calls[0][2]).toHaveProperty("updatedAt", data.updatedAt);
});

it("does not update a link whose merged definition is invalid", async () => {
  const { service, source, target, repository } = fixture({ kind: "physical" });
  const previous = {
    id: "link",
    sourceOfferId: source.id,
    targetOfferId: target.id,
    variant: "delivery",
    recurrence: "first",
  };
  const update = jest.fn();
  Object.assign(repository, {
    lockById: jest.fn(async () => previous),
    updateFirstByField: update,
  });
  await expect(
    service.update({ id: previous.id, data: {} as any }),
  ).rejects.toThrow("Invalid source offer or service");
  expect(update).not.toHaveBeenCalled();
});
