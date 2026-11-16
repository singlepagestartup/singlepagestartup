/**
 * BDD Suite: atomic open-cart product uniqueness.
 *
 * Given: isolated Subjects and a Product in PostgreSQL.
 * When: independent service instances add the same Product concurrently or a graph write fails.
 * Then: one open cart survives, failures roll back, and history and other Subjects remain independent.
 */
import { randomUUID } from "node:crypto";
import { CRUDService } from "@sps/shared-backend-api";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository as SubjectRepository } from "../../../../repository";
import { Configuration as SubjectConfiguration } from "../../../../configuration";
import { Service as Create } from "./create";
import { Service as CheckoutClaim } from "./checkout-claim";
import { Service as MergeGuestCart } from "./merge-guest-cart";
import { Service as FindOpenCart } from "./find-open-cart-order-with-product";

const paths = {
  product: "@sps/ecommerce/models/product",
  store: "@sps/ecommerce/models/store",
  currency: "@sps/billing/models/currency",
  order: "@sps/ecommerce/models/order",
  owners: "@sps/social/relations/profiles-to-ecommerce-module-orders",
  profile: "@sps/social/models/profile",
  principalProfiles: "@sps/rbac/relations/subjects-to-social-module-profiles",
  lines: "@sps/ecommerce/relations/orders-to-products",
  stores: "@sps/ecommerce/relations/stores-to-orders",
  currencies: "@sps/ecommerce/relations/orders-to-billing-module-currencies",
};

const cleanup: (() => Promise<unknown>)[] = [];
afterEach(async () => {
  jest.restoreAllMocks();
  for (const remove of cleanup.splice(0).reverse()) await remove();
});
afterAll(async () => {
  await getPostgresClient().end();
});

async function fixture() {
  const suffix = randomUUID();
  const subjects = new SubjectRepository(new SubjectConfiguration());
  const subject = await subjects.insert({ slug: `pr264-${suffix}` });
  if (!subject.id) throw new Error("Fixture Subject has no ID");
  cleanup.push(() => subjects.deleteFirstByField("id", subject.id));
  const services: Record<string, any> = {};
  for (const [key, path] of Object.entries(paths)) {
    const { Repository } = await import(
      `${path}/backend/app/api/src/lib/repository`
    );
    const { Configuration } = await import(
      `${path}/backend/app/api/src/lib/configuration`
    );
    const repository = new Repository(new Configuration());
    const service = new CRUDService(repository) as any;
    if (key === "order") {
      service.lockForLifecycle = repository.lockForLifecycle.bind(repository);
    }
    const create = service.create.bind(service);
    service.create = async (props: any) => {
      const entity = await create(props);
      cleanup.push(async () => {
        if (await repository.findFirstByField("id", entity.id))
          await repository.deleteFirstByField("id", entity.id);
      });
      return entity;
    };
    services[key] = service;
  }
  const profile = await services.profile.create({
    data: { slug: `profile-${suffix}` },
  });
  const product = await services.product.create({
    data: { slug: `pr264-${suffix}` },
  });
  const store = await services.store.create({
    data: { slug: `pr264-${suffix}` },
  });
  const currency = await services.currency.create({
    data: { slug: `pr264-${suffix}`, title: "Cart test", symbol: "test" },
  });
  const ecommerceModule = {
    order: services.order,
    ordersToProducts: services.lines,
    storesToOrders: services.stores,
    ordersToBillingModuleCurrencies: services.currencies,
  } as any;
  const find = new FindOpenCart({
    ecommerceModule,
    profilesToEcommerceModuleOrders: services.owners,
  });
  const dependencies = {
    ecommerceModule,
    socialModule: { profilesToEcommerceModuleOrders: services.owners },
    ecommerceModuleResolveProfile: async (scope: {
      socialModuleProfileId?: string;
    }) => scope.socialModuleProfileId ?? profile.id,
    ecommerceModuleFindOpenCartOrderWithProduct: find.execute.bind(find),
    ecommerceModuleResolveOrderCurrency: jest
      .fn()
      .mockResolvedValue(currency.id),
  };
  await services.principalProfiles.create({
    data: { subjectId: subject.id, socialModuleProfileId: profile.id },
  });
  const create = new Create({ repository: subjects, service: dependencies });
  const otherInstance = new Create({
    repository: new SubjectRepository(new SubjectConfiguration()),
    service: dependencies,
  });
  const props = {
    subjectId: subject.id,
    socialModuleProfileId: profile.id,
    productId: product.id,
    storeId: store.id,
    quantity: 2,
  };
  const owners = () =>
    services.owners.find({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: profile.id }],
        },
      },
    });
  return {
    create,
    otherInstance,
    props,
    services,
    subjects,
    dependencies,
    owners,
  };
}

it("serializes concurrent adds across service instances and rejects an existing line before pricing", async () => {
  const f = await fixture();
  const results = await Promise.allSettled([
    f.create.execute(f.props),
    f.otherInstance.execute(f.props),
    f.create.execute(f.props),
    f.otherInstance.execute(f.props),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  for (const result of results.filter((r) => r.status === "rejected")) {
    expect(result.reason.message).toBe(
      "Conflict error. Product is already in the cart",
    );
  }
  const links = await f.owners();
  expect(links).toHaveLength(1);
  const orderId = links[0].ecommerceModuleOrderId;
  for (const key of ["lines", "stores", "currencies"]) {
    const rows = await f.services[key].find({
      params: {
        filters: { and: [{ column: "orderId", method: "eq", value: orderId }] },
      },
    });
    expect(rows).toHaveLength(1);
    if (key === "lines") expect(rows[0].quantity).toBe(2);
  }
  f.dependencies.ecommerceModuleResolveOrderCurrency.mockRejectedValue(
    new Error("price removed"),
  );
  await expect(f.create.execute(f.props)).rejects.toThrow(
    "Conflict error. Product is already in the cart",
  );
  expect(await f.owners()).toHaveLength(1);
});

it("rolls back the complete graph on a relation failure and permits a clean retry", async () => {
  const f = await fixture();
  const failedWrite = jest
    .spyOn(f.services.stores, "create")
    .mockRejectedValueOnce(new Error("fixture relation failure"));
  await expect(f.create.execute(f.props)).rejects.toThrow(
    "fixture relation failure",
  );
  expect(await f.owners()).toHaveLength(0);
  const lines = await f.services.lines.find({
    params: {
      filters: {
        and: [{ column: "productId", method: "eq", value: f.props.productId }],
      },
    },
  });
  expect(lines).toHaveLength(0);
  failedWrite.mockRestore();
  await f.create.execute(f.props);
  expect(await f.owners()).toHaveLength(1);
});

it("allows a repeat purchase after history transition and an independent Subject cart", async () => {
  const f = await fixture();
  await f.create.execute(f.props);
  const [link] = await f.owners();
  await f.services.order.update({
    id: link.ecommerceModuleOrderId,
    data: { type: "history" },
  });
  await f.create.execute(f.props);
  expect(await f.owners()).toHaveLength(2);
  const other = await f.subjects.insert({
    slug: `pr264-other-${randomUUID()}`,
  });
  if (!other.id) throw new Error("Fixture Subject has no ID");
  cleanup.push(() => f.subjects.deleteFirstByField("id", other.id));
  const otherProfile = await f.services.profile.create({
    data: { slug: `profile-other-${randomUUID()}` },
  });
  await f.otherInstance.execute({
    ...f.props,
    subjectId: other.id,
    socialModuleProfileId: otherProfile.id,
  });
});

it.each([false, true])(
  "merges complete cart orders atomically; target wins equal timestamps (%s)",
  async (equalTime) => {
    const f = await fixture();
    const target = await f.subjects.insert({
      slug: `issue407-target-${randomUUID()}`,
    });
    cleanup.push(() => f.subjects.deleteFirstByField("id", target.id));
    const targetProfile = await f.services.profile.create({
      data: { slug: `issue407-target-profile-${randomUUID()}` },
    });
    await f.services.principalProfiles.create({
      data: { subjectId: target.id, socialModuleProfileId: targetProfile.id },
    });
    await f.create.execute(f.props);
    await f.create.execute({
      ...f.props,
      subjectId: target.id,
      socialModuleProfileId: targetProfile.id,
      quantity: 5,
    });
    const [sourceOwner] = await f.owners();
    const [targetOwner] = await f.services.owners.find({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: targetProfile.id }],
        },
      },
    });
    const sourceLines = await f.services.lines.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "eq",
              value: sourceOwner.ecommerceModuleOrderId,
            },
          ],
        },
      },
    });
    const targetLines = await f.services.lines.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "eq",
              value: targetOwner.ecommerceModuleOrderId,
            },
          ],
        },
      },
    });
    await f.services.lines.update({
      id: sourceLines[0].id,
      data: { createdAt: new Date("2025-01-02T00:00:00Z") },
    });
    await f.services.lines.update({
      id: targetLines[0].id,
      data: {
        createdAt: new Date(
          equalTime ? "2025-01-02T00:00:00Z" : "2025-01-01T00:00:00Z",
        ),
      },
    });
    const distinct = await f.services.product.create({
      data: { slug: `issue407-distinct-${randomUUID()}` },
    });
    await f.create.execute({ ...f.props, productId: distinct.id });
    const service = {
      ...f.dependencies,
      repository: f.subjects,
      findById: ({ id }: { id: string }) =>
        f.subjects.findFirstByField("id", id),
      subjectsToIdentities: { find: async () => [] },
      subjectsToSocialModuleProfiles: f.services.principalProfiles,
      socialModuleProfileOwnershipEnsure: async () => ({
        profile: targetProfile,
      }),
    };
    const merge = new MergeGuestCart(service as any);
    const scope = {
      sourceSubjectId: f.props.subjectId,
      subjectId: target.id,
      socialModuleProfileId: targetProfile.id,
    };
    if (!equalTime) {
      const failure = jest
        .spyOn(f.services.owners, "update")
        .mockRejectedValueOnce(new Error("fixture merge failure"));
      await expect(merge.execute(scope)).rejects.toThrow(
        "fixture merge failure",
      );
      expect(await f.owners()).toHaveLength(2);
      const originalTargetLine = await f.services.lines.findById({
        id: targetLines[0].id,
      });
      expect(originalTargetLine.quantity).toBe(5);
      failure.mockRestore();
    }
    await merge.execute(scope);
    await merge.execute(scope);
    expect(await f.owners()).toHaveLength(0);
    const retained = await f.services.owners.find({
      params: {
        filters: {
          and: [{ column: "profileId", method: "eq", value: targetProfile.id }],
        },
      },
    });
    expect(retained).toHaveLength(2);
    const lines = await f.services.lines.find({
      params: {
        filters: {
          and: [
            {
              column: "orderId",
              method: "inArray",
              value: retained.map((owner: any) => owner.ecommerceModuleOrderId),
            },
          ],
        },
      },
    });
    expect(lines).toHaveLength(2);
    expect(
      lines.find((line: any) => line.productId === f.props.productId).quantity,
    ).toBe(equalTime ? 5 : 2);
    expect(lines.some((line: any) => line.productId === distinct.id)).toBe(
      true,
    );
  },
);

it.each(["checkout", "merge"])(
  "serializes cart merge against checkout claim when %s obtains the profile lock first",
  async (first) => {
    const f = await fixture();
    const target = await f.subjects.insert({
      slug: `issue407-checkout-target-${randomUUID()}`,
    });
    cleanup.push(() => f.subjects.deleteFirstByField("id", target.id));
    const targetProfile = await f.services.profile.create({
      data: { slug: `issue407-checkout-profile-${randomUUID()}` },
    });
    await f.services.principalProfiles.create({
      data: { subjectId: target.id, socialModuleProfileId: targetProfile.id },
    });
    await f.create.execute(f.props);
    const [owner] = await f.owners();
    let entered!: () => void;
    let release!: () => void;
    const locked = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const claimRepository = {
      withProfileLock: <T>(
        scope: { profileId: string },
        operation: () => Promise<T>,
      ) =>
        f.subjects.withProfileLock(scope, async () => {
          if (first === "checkout") {
            entered();
            await released;
          }
          return operation();
        }),
    };
    const mergeRepository = {
      withSubjectLock: f.subjects.withSubjectLock.bind(f.subjects),
      withProfilesLock: (
        scope: { profileIds: string[] },
        operation: () => Promise<void>,
      ) =>
        f.subjects.withProfilesLock(scope, async () => {
          if (first === "merge") {
            entered();
            await released;
          }
          return operation();
        }),
    };
    const claim = new CheckoutClaim({
      repository: claimRepository,
      ecommerceModule: f.dependencies.ecommerceModule,
      socialModule: f.dependencies.socialModule,
    });
    const merge = new MergeGuestCart({
      ...f.dependencies,
      repository: mergeRepository,
      findById: ({ id }: { id: string }) =>
        f.subjects.findFirstByField("id", id),
      subjectsToIdentities: { find: async () => [] },
      subjectsToSocialModuleProfiles: f.services.principalProfiles,
      socialModuleProfileOwnershipEnsure: async () => ({
        profile: targetProfile,
      }),
    } as any);
    const claimOperation = () =>
      claim.execute({
        profileId: f.props.socialModuleProfileId,
        orderIds: [owner.ecommerceModuleOrderId],
      });
    const mergeOperation = () =>
      merge.execute({
        sourceSubjectId: f.props.subjectId,
        subjectId: target.id,
        socialModuleProfileId: targetProfile.id,
      });
    const firstPromise =
      first === "checkout" ? claimOperation() : mergeOperation();
    await locked;
    const secondOutcome = (
      first === "checkout" ? mergeOperation() : claimOperation()
    ).then(
      () => null,
      (error) => error,
    );
    release();
    await firstPromise;
    const outcome = await secondOutcome;
    const [retainedOwner] = await f.services.owners.find({
      params: {
        filters: {
          and: [
            {
              column: "ecommerceModuleOrderId",
              method: "eq",
              value: owner.ecommerceModuleOrderId,
            },
          ],
        },
      },
    });
    const order = await f.services.order.findById({
      id: owner.ecommerceModuleOrderId,
    });
    if (first === "checkout") {
      expect(outcome).toBeNull();
      expect(retainedOwner.profileId).toBe(f.props.socialModuleProfileId);
      expect(order).toMatchObject({ type: "history", status: "paying" });
    } else {
      expect(outcome?.message).toContain("no longer belongs");
      expect(retainedOwner.profileId).toBe(targetProfile.id);
      expect(order).toMatchObject({ type: "cart", status: "new" });
    }
  },
);
