/** Local browser fixtures; the manifest contains IDs, never credentials. */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { API_SERVICE_URL, RBAC_SECRET_KEY } from "@sps/shared-utils";

interface IEntity {
  id: string;
  [key: string]: any;
}
interface IFixture {
  created: { route: string; id: string }[];
  profiles: { id: string }[];
  chats: { id: string; threadId: string; profileId: string; url: string }[];
  ownedOrderIds?: string[];
  subjectId?: string;
  requesterProfileId?: string;
  product?: { id: string; slug: string; url: string };
  attribute?: { id: string };
  price?: number;
  currency?: string;
}
const file = resolve(".artifacts/consistency/fixtures.json");
if (
  !RBAC_SECRET_KEY ||
  !API_SERVICE_URL ||
  new URL(API_SERVICE_URL).hostname !== "localhost"
)
  throw new Error("Local fixture API required");
let fixture: IFixture;
let recording = false;
const persist = () => writeFile(file, JSON.stringify(fixture, null, 2));
async function request(
  route: string,
  method = "GET",
  data?: unknown,
): Promise<any> {
  const body = data === undefined ? undefined : new FormData();
  body?.set("data", JSON.stringify(data));
  const response = await fetch(API_SERVICE_URL + "/api/" + route, {
    method,
    headers: {
      "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY!,
      "Cache-Control": "no-store",
    },
    body,
  });
  if (method === "DELETE" && response.status === 404) return;
  if (!response.ok)
    throw new Error(`Fixture ${method} ${route}: ${response.status}`);
  const result = ((await response.json()) as { data: any }).data;
  if (recording && method === "POST" && result?.id) {
    fixture.created.push({ route, id: result.id });
    await persist();
  }
  return result;
}
const params = (column: string, value: string) =>
  "?" +
  new URLSearchParams({
    "filters[and][0][column]": column,
    "filters[and][0][method]": "eq",
    "filters[and][0][value]": value,
  });
if (process.argv.includes("--cleanup")) {
  fixture = JSON.parse(await readFile(file, "utf8"));
  // Runtime-created message rows do not cascade from a Chat parent.
  for (const chat of fixture.chats) {
    const messages: IEntity[] = await request(
      "social/chats-to-messages" + params("chatId", chat.id),
    );
    for (const link of messages)
      await request(`social/messages/${link.messageId}`, "DELETE");
    const actions: IEntity[] = await request(
      "social/chats-to-actions" + params("chatId", chat.id),
    );
    for (const link of actions)
      await request(`social/actions/${link.actionId}`, "DELETE");
  }
  if (fixture.product) {
    const links: IEntity[] = await request(
      "ecommerce/orders-to-products" + params("productId", fixture.product.id),
    );
    for (const link of links)
      await request(`ecommerce/orders-to-products/${link.id}`, "DELETE");
    for (const orderId of fixture.ownedOrderIds || []) {
      const remaining = await request(
        "ecommerce/orders-to-products" + params("orderId", orderId),
      );
      if (!remaining.length)
        await request(`ecommerce/orders/${orderId}`, "DELETE");
    }
  }
  for (const record of [...(fixture.created || [])].reverse())
    await request(`${record.route}/${record.id}`, "DELETE");
  // Also accepts manifests from the initial browser verification.
  for (const chat of fixture.chats) {
    await request(`social/threads/${chat.threadId}`, "DELETE");
    await request(`social/chats/${chat.id}`, "DELETE");
  }
  for (const profile of fixture.profiles)
    await request(`social/profiles/${profile.id}`, "DELETE");
  if (fixture.product)
    await request(`ecommerce/products/${fixture.product.id}`, "DELETE");
  if (fixture.attribute)
    await request(`ecommerce/attributes/${fixture.attribute.id}`, "DELETE");
  console.log("Removed owned consistency fixtures");
} else {
  const ownerProfile = process.argv
    .find((arg) => arg.startsWith("--owner-profile="))
    ?.split("=")[1];
  if (!ownerProfile)
    throw new Error("Pass --owner-profile=<existing visible project profile>");
  try {
    await readFile(file);
    throw new Error(
      "Fixture manifest already exists; clean it up or archive it first",
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await mkdir(resolve(".artifacts/consistency"), { recursive: true });
  fixture = { created: [], profiles: [], chats: [] };
  await persist();
  recording = true;
  const owners: IEntity[] = await request(
    "rbac/subjects-to-social-module-profiles" +
      params("socialModuleProfileId", ownerProfile),
  );
  if (!owners.length) throw new Error("Project owner not found");
  fixture.subjectId = owners[0].subjectId;
  const memberships: IEntity[] = await request(
    "rbac/subjects-to-social-module-profiles" +
      params("subjectId", fixture.subjectId!),
  );
  fixture.requesterProfileId = memberships.find(
    (link) => link.variant === "default",
  )?.socialModuleProfileId;
  if (!fixture.requesterProfileId)
    throw new Error("Personal profile not found");
  const suffix = randomUUID().slice(0, 8);
  for (const label of ["Shared", "Unrelated"]) {
    const profile = await request("social/profiles", "POST", {
      variant: "artificial-intelligence",
      slug: `consistency-${suffix}-${label.toLowerCase()}`,
      adminTitle: `Consistency ${label}`,
      title: { en: `Consistency ${label}` },
    });
    fixture.profiles.push({ id: profile.id });
    await request("rbac/subjects-to-social-module-profiles", "POST", {
      subjectId: fixture.subjectId,
      socialModuleProfileId: profile.id,
      variant: "assistant",
    });
    const chat = await request("social/chats", "POST", {
      variant: "default",
      title: `Consistency ${label}`,
      slug: `consistency-${suffix}-${label.toLowerCase()}`,
    });
    for (const profileId of [fixture.requesterProfileId, profile.id])
      await request("social/profiles-to-chats", "POST", {
        profileId,
        chatId: chat.id,
      });
    const thread = await request("social/threads", "POST", {
      title: `Consistency ${label}`,
      slug: `consistency-${suffix}-${label.toLowerCase()}`,
      metadata: { consistencyFixture: true },
    });
    await request("social/chats-to-threads", "POST", {
      chatId: chat.id,
      threadId: thread.id,
    });
    fixture.chats.push({
      id: chat.id,
      threadId: thread.id,
      profileId: profile.id,
      url: `/en/ai-chat/social/profiles/${profile.id}/chats/${chat.id}/threads/${thread.id}`,
    });
    await persist();
  }
  const [currency] = await request("billing/currencies");
  const [key] = await request(
    "ecommerce/attribute-keys" + params("type", "price"),
  );
  if (!currency || !key) throw new Error("Price key/currency required");
  const product = await request("ecommerce/products", "POST", {
    slug: `consistency-${suffix}`,
    adminTitle: "Consistency cart fixture",
    title: { en: "Consistency cart fixture" },
    description: {
      en: JSON.stringify({
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Local verification product" }],
          },
        ],
      }),
    },
  });
  fixture.product = {
    id: product.id,
    slug: product.slug,
    url: `/en/ecommerce/products/${product.slug}`,
  };
  const attribute = await request("ecommerce/attributes", "POST", {
    slug: `consistency-price-${suffix}`,
    adminTitle: "Consistency price",
    number: "125",
  });
  fixture.attribute = { id: attribute.id };
  await request("ecommerce/products-to-attributes", "POST", {
    productId: product.id,
    attributeId: attribute.id,
  });
  await request("ecommerce/attribute-keys-to-attributes", "POST", {
    attributeKeyId: key.id,
    attributeId: attribute.id,
  });
  await request("ecommerce/attributes-to-billing-module-currencies", "POST", {
    attributeId: attribute.id,
    billingModuleCurrencyId: currency.id,
  });
  const [store] = await request("ecommerce/stores");
  if (store)
    await request("ecommerce/stores-to-products", "POST", {
      storeId: store.id,
      productId: product.id,
      sku: product.slug,
    });
  fixture.price = 125;
  fixture.currency = currency.id;
  await persist();
  console.log(
    JSON.stringify({
      chats: fixture.chats.map((chat) => chat.url),
      product: fixture.product.url,
    }),
  );
}
