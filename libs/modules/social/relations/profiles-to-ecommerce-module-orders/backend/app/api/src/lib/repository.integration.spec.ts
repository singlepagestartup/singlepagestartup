import { randomUUID } from "node:crypto";
import { CRUDService } from "@sps/shared-backend-api";
import { getPostgresClient } from "@sps/shared-backend-database-config";
import { Repository } from "./repository";
import { Configuration } from "./configuration";
import { Repository as ProfileRepository } from "@sps/social/models/profile/backend/app/api/src/lib/repository";
import { Configuration as ProfileConfiguration } from "@sps/social/models/profile/backend/app/api/src/lib/configuration";
import { Repository as OrderRepository } from "@sps/ecommerce/models/order/backend/app/api/src/lib/repository";
import { Configuration as OrderConfiguration } from "@sps/ecommerce/models/order/backend/app/api/src/lib/configuration";

afterAll(async () => {
  await getPostgresClient().end();
});

it("gives an order one profile and protects that profile until the order is removed", async () => {
  const profiles = new ProfileRepository(new ProfileConfiguration());
  const orders = new OrderRepository(new OrderConfiguration());
  const owners = new CRUDService(new Repository(new Configuration()));
  const profile = await profiles.insert({ slug: "owner-407-" + randomUUID() });
  const other = await profiles.insert({ slug: "other-407-" + randomUUID() });
  const order = await orders.insert({});
  if (!profile.id || !other.id || !order.id) {
    throw new Error("Fixture ID missing");
  }
  try {
    await owners.create({
      data: { profileId: profile.id, ecommerceModuleOrderId: order.id },
    });
    await expect(
      owners.create({
        data: { profileId: other.id, ecommerceModuleOrderId: order.id },
      }),
    ).rejects.toThrow();
    await expect(
      profiles.deleteFirstByField("id", profile.id),
    ).rejects.toThrow();
    await orders.deleteFirstByField("id", order.id);
    const links = await owners.find({
      params: {
        filters: {
          and: [
            { column: "ecommerceModuleOrderId", method: "eq", value: order.id },
          ],
        },
      },
    });
    expect(links).toEqual([]);
  } finally {
    if (await orders.findFirstByField("id", order.id)) {
      await orders.deleteFirstByField("id", order.id);
    }
    await profiles.deleteFirstByField("id", profile.id);
    await profiles.deleteFirstByField("id", other.id);
  }
});
