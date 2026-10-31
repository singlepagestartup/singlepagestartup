import { api as permissionApi } from "@sps/rbac/models/permission/sdk/server";
jest.mock("@sps/rbac/models/permission/sdk/server", () => ({
  api: { publicResourceIds: jest.fn() },
}));
import { RoutingService } from "./index";
const sources = [
  {
    name: "custom.owners",
    route: "/api/custom/owners",
    resource: { table: "owners", columns: ["id"], references: [] },
  },
  {
    name: "custom.items",
    route: "/api/custom/items",
    resource: { table: "items", columns: ["id"], references: [] },
  },
  {
    name: "custom.links",
    route: "/api/custom/links",
    resource: {
      table: "links",
      columns: ["id", "customOwner", "customTarget"],
      references: [
        { column: "customOwner", table: "owners", targetColumn: "id" },
        { column: "customTarget", table: "items", targetColumn: "id" },
      ],
    },
  },
];
it("reads relation keys from the service resource descriptions in both directions", () => {
  const routing = new RoutingService(sources);
  expect(routing.relation("custom.links", "custom.owners")).toEqual({
    source: "custom.owners",
    sourceKey: "customOwner",
    target: "custom.items",
    targetKey: "customTarget",
  });
  expect(routing.relation("custom.links", "custom.items")).toEqual({
    source: "custom.items",
    sourceKey: "customTarget",
    target: "custom.owners",
    targetKey: "customOwner",
  });
});
it("does not permit arbitrary unregistered endpoint reads", async () => {
  await expect(
    new RoutingService(sources).find("other.private"),
  ).rejects.toThrow("Unknown route source");
});
it("enumerates all API pages instead of truncating at one batch", async () => {
  const routing = new RoutingService(sources);
  const find = jest
    .spyOn(routing, "find")
    .mockResolvedValueOnce(
      Array.from({ length: 100 }, (_, i) => ({ id: String(i) })),
    )
    .mockResolvedValueOnce([{ id: "last" }]);
  expect(await routing.all("custom.items")).toHaveLength(101);
  expect(find.mock.calls[1][1]?.offset).toBe(100);
});

it("reads a permitted exact ID through the SDK without requesting its collection", async () => {
  const request = jest.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify({ data: { id: "one" } }), {
      headers: { "Content-Type": "application/json" },
    }),
  );
  try {
    expect(
      await new RoutingService(sources).findById("custom.items", "one"),
    ).toEqual({ id: "one" });
    expect(String(request.mock.calls[0][0])).toMatch(
      /\/api\/custom\/items\/one\?/,
    );
    expect(request.mock.calls[0][1]?.headers).not.toHaveProperty(
      "Authorization",
    );
  } finally {
    request.mockRestore();
  }
});
it("preserves denied exact reads and treats a missing ID as absent", async () => {
  const request = jest.spyOn(globalThis, "fetch");
  try {
    const routing = new RoutingService(sources);
    request.mockResolvedValue(
      new Response(JSON.stringify({ message: "denied" }), { status: 403 }),
    );
    await expect(
      routing.findById("custom.items", "private"),
    ).rejects.toMatchObject({ status: 403 });
    request.mockResolvedValue(
      new Response(JSON.stringify({ message: "missing" }), { status: 404 }),
    );
    await expect(
      routing.findById("custom.items", "missing"),
    ).resolves.toBeUndefined();
  } finally {
    request.mockRestore();
  }
});

it("enumerates exact public records when their collection is protected", async () => {
  const routing = new RoutingService(sources);
  jest.spyOn(routing, "all").mockRejectedValue({ status: 403 });
  jest
    .mocked(permissionApi.publicResourceIds)
    .mockResolvedValue(["public", "denied", "missing"]);
  const read = jest
    .spyOn(routing, "findById")
    .mockImplementation(async (_name, id) => {
      if (id === "denied") throw { status: 403 };
      if (id === "missing") return undefined;
      return { id, slug: "visible" };
    });
  expect(await routing.enumerate("custom.items", "slug")).toEqual([
    { id: "public", slug: "visible" },
  ]);
  expect(permissionApi.publicResourceIds).toHaveBeenCalledWith({
    params: { resource: "/api/custom/items" },
  });
  expect(read).toHaveBeenCalledTimes(3);
});
it("uses the same exact public records to resolve non-ID URL fields", async () => {
  const routing = new RoutingService(sources);
  jest.spyOn(routing, "find").mockRejectedValue({ status: 403 });
  jest.mocked(permissionApi.publicResourceIds).mockResolvedValue(["public"]);
  jest
    .spyOn(routing, "findById")
    .mockResolvedValue({ id: "public", slug: "visible" });
  expect(await routing.resolve("custom.items", "slug", "visible")).toEqual([
    { id: "public", slug: "visible" },
  ]);
  expect(await routing.resolve("custom.items", "slug", "other")).toEqual([]);
});
it("omits denied detail URLs even when their collection is public and propagates outages", async () => {
  const routing = new RoutingService(sources);
  jest
    .spyOn(routing, "all")
    .mockResolvedValue([{ id: "public" }, { id: "private" }]);
  jest.spyOn(routing, "findById").mockImplementation(async (_name, id) => {
    if (id === "private") throw { status: 403 };
    return { id };
  });
  expect(await routing.enumerate("custom.items", "id")).toEqual([
    { id: "public" },
  ]);
  jest.spyOn(routing, "all").mockRejectedValue({ status: 503 });
  await expect(routing.enumerate("custom.items")).rejects.toEqual({
    status: 503,
  });
});
