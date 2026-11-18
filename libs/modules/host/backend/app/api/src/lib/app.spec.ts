import {
  createAppAssembly,
  type IExceptionFilter,
} from "@sps/shared-backend-api";
import {
  createService as createPage,
  bootstrap as bootstrapPage,
} from "@sps/host/models/page/backend/app/api/src/lib/bootstrap";
import { App } from "./app";

it("resolves Page masks before HTTP startup with the assembly's route sources", async () => {
  const assembly = createAppAssembly();
  const otherAssembly = createAppAssembly();
  const page = createPage(assembly);
  const otherPage = createPage(otherAssembly);
  const filter: IExceptionFilter = {
    catch: async (error, context) =>
      context.json({ message: error.message }, 500),
  };
  const host = new App(filter, assembly);
  const resource = {
    table: "tenant.custom_content",
    columns: ["id", "slug"],
    references: [],
  };
  const describeRoutes = jest.fn(() => [
    { route: "/custom-content", resource },
  ]);
  host.configureRouting({ project: { describeRoutes } });
  jest.spyOn(page, "find").mockResolvedValue([
    {
      id: "page",
      url: "/content/[project.custom-content.slug]",
      variant: "default",
    },
  ] as Awaited<ReturnType<typeof page.find>>);
  const fetch = jest.spyOn(globalThis, "fetch").mockImplementation(
    async (input) =>
      new Response(JSON.stringify({ data: [{ id: "content" }] }), {
        status: String(input).includes("/api/project/custom-content?")
          ? 200
          : 404,
        headers: { "content-type": "application/json" },
      }),
  );
  try {
    expect(describeRoutes).not.toHaveBeenCalled();
    await expect(
      otherPage.routing.find("project.custom-content"),
    ).rejects.toThrow("Unknown route source");
    const url = "/content/example";
    await expect(page.findByUrl({ url })).resolves.toMatchObject({
      routeParams: { "project.custom-content.slug": "example" },
    });
    expect(describeRoutes).toHaveBeenCalledTimes(1);

    const { app } = await bootstrapPage(assembly);
    expect(app.controller.service).toBe(page);
    const response = await app.hono.request(
      "/find-by-url?url=" + encodeURIComponent(url),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: { routeParams: { "project.custom-content.slug": "example" } },
    });
    expect(describeRoutes).toHaveBeenCalledTimes(1);
  } finally {
    fetch.mockRestore();
  }
});
