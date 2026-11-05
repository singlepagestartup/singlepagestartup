/**
 * BDD Suite: SDK query strings at the API boundary.
 *
 * Given: SDK requests encode nested filters, sorting, population and pagination.
 * When: the shared query middleware parses their URLs with the installed qs.
 * Then: handlers receive the same query values without prototype properties.
 */
import { Hono } from "hono";
import QueryString from "qs";
import { Middleware, type IMiddlewareGeneric } from "./index";

async function parseQuery(params: Record<string, unknown>) {
  const app = new Hono<IMiddlewareGeneric>();
  app.use("*", new Middleware().init());
  app.get("/", (c) => c.json(c.get("parsedQuery")));

  return app.request(
    "/?" + QueryString.stringify(params, { encodeValuesOnly: true }),
  );
}

it("preserves nested SDK filters, sorting, population and pagination", async () => {
  const params = {
    filters: {
      and: [
        { column: "title", method: "eq", value: "Москва + café & x=y [draft]" },
        { column: "id", method: "inArray", value: ["first", "second"] },
      ],
    },
    orderBy: { and: [{ column: "createdAt", method: "desc" }] },
    populate: { category: true },
    offset: 10,
    limit: 20,
  };

  const response = await parseQuery(params);

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    ...params,
    populate: { category: "true" },
    offset: "10",
    limit: "20",
  });
});

it("preserves JSON-encoded filter and sort lists", async () => {
  const filters = [{ column: "title", method: "eq", value: "A&B + C" }];
  const orderBy = [{ column: "title", method: "asc" }];

  const response = await parseQuery({
    filters: { and: JSON.stringify(filters) },
    orderBy: { and: JSON.stringify(orderBy) },
  });

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    filters: { and: filters },
    orderBy: { and: orderBy },
  });
});

it("discards prototype keys while keeping an ordinary filter", async () => {
  const response = await parseQuery({
    "filters[__proto__][polluted]": "yes",
    "filters[constructor][prototype][polluted]": "yes",
    "filters[and][0][column]": "title",
    "filters[and][0][method]": "eq",
    "filters[and][0][value]": "safe",
  });

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({
    filters: { and: [{ column: "title", method: "eq", value: "safe" }] },
  });
  expect(Object.prototype).not.toHaveProperty("polluted");
});
