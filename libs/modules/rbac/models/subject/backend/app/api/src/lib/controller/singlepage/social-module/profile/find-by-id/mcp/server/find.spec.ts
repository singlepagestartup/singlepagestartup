import { Handler } from "./find";

function fixture(token?: string, ownerId = "manager") {
  const close = jest.fn();
  const catalog = { supported: [], connected: [], stale: [] };
  const service = {
    modules: {
      social: {
        profile: {
          findById: async () => ({
            id: "employee-profile",
            allowedMcpServerIds: ["singlepagestartup"],
          }),
        },
      },
    },
    me: jest.fn().mockResolvedValue({ id: ownerId, variant: "default" }),
    socialModuleProfileMcpCatalogOpen: jest
      .fn()
      .mockResolvedValue({ catalog, close }),
  };
  const context = {
    req: {
      param: (key: string) => (key === "id" ? "manager" : "employee-profile"),
      header: () => (token ? "Bearer " + token : undefined),
    },
    json: jest.fn(),
  };
  return {
    service,
    close,
    catalog,
    context,
    execute: () =>
      new Handler(service as never).execute(context as never, undefined),
  };
}

it("discovers the employee's configured tools under the caller's original access token", async () => {
  const { service, execute, close, catalog, context } = fixture("sender-token");
  await execute();
  expect(service.socialModuleProfileMcpCatalogOpen).toHaveBeenCalledWith({
    subjectId: "manager",
    configuredServerIds: ["singlepagestartup"],
    rbacSubjectAuthenticationJwt: "sender-token",
  });
  expect(context.json).toHaveBeenCalledWith({ data: catalog });
  expect(close).toHaveBeenCalledTimes(1);
});

it.each([
  [undefined, "manager"],
  ["other-token", "other-user"],
])("requires an authenticated matching caller", async (token, ownerId) => {
  const { service, execute } = fixture(token, ownerId);
  await expect(execute()).rejects.toThrow();
  expect(service.socialModuleProfileMcpCatalogOpen).not.toHaveBeenCalled();
});
