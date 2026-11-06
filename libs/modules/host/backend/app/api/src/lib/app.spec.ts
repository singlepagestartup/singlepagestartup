import { App } from "./app";
jest.mock("./apps", () => ({ Apps: jest.fn() }));

it("connects project-defined route descriptions to Host without repository access", () => {
  const resource = {
    table: "tenant.custom_content",
    columns: ["id", "slug"],
    references: [],
  };
  const describeRoutes = jest.fn(() => [
    { route: "/custom-content", resource },
  ]);
  const configureRouting = jest.fn();
  const app = new App({ catch: jest.fn() } as any);
  app.apps = { configureRouting } as any;
  app.configureRouting({ project: { describeRoutes } });
  expect(configureRouting).toHaveBeenCalledWith([
    {
      name: "project.custom-content",
      route: "/api/project/custom-content",
      resource,
    },
  ]);
  expect(describeRoutes).toHaveBeenCalledTimes(1);
});
