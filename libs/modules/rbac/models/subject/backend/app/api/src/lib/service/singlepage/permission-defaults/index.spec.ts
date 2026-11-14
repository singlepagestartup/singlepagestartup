import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Service } from ".";
import type { Service as Permission } from "@sps/rbac/models/permission/backend/app/api/src/lib/service";
import type { Service as RolesToPermissions } from "@sps/rbac/relations/roles-to-permissions/backend/app/api/src/lib/service";

describe("public permission defaults", () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "permission-defaults-"));
    await Promise.all(
      ["permissions", "roles", "billing"].map((name) =>
        mkdir(join(directory, name)),
      ),
    );
  });
  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  function write(name: string, id: string, row: object) {
    return writeFile(join(directory, name, id + ".json"), JSON.stringify(row));
  }

  function repository(name: string) {
    return {
      configuration: {
        repository: {
          seed: { active: true },
          dump: { directory: join(directory, name) },
        },
      },
    };
  }

  function createService() {
    const permission = {
      repository: repository("permissions"),
      permissionsToBillingModuleCurrenciesService: {
        repository: repository("billing"),
      },
      find: async () => [{ method: "GET", path: "/api/demo/installed" }],
      isSensitiveRoute: async (route: string) =>
        route.startsWith("/api/demo/private/"),
    };
    return new Service(
      permission as unknown as Permission,
      { repository: repository("roles") } as unknown as RolesToPermissions,
    );
  }

  it("offers missing public defaults and preserves configured, protected and record-specific grants", async () => {
    const routes = [
      "/api/demo/new",
      "/api/demo/installed",
      "/api/demo/paid",
      "/api/demo/restricted/:uuid",
      "/api/demo/restricted/[demo.id]",
      "/api/demo/private/[demo.id]",
      "/api/demo/11111111-1111-4111-8111-111111111111",
      "*",
    ];
    for (const [id, path] of routes.entries()) {
      await write("permissions", String(id), {
        id: String(id),
        type: "HTTP",
        method: "GET",
        path,
      });
    }
    await write("billing", "paid", { permissionId: "2" });
    await write("roles", "admin", { permissionId: "3" });
    const result = await createService().execute();
    expect(result).toEqual([
      {
        type: "HTTP",
        method: "GET",
        path: "/api/demo/installed",
        configured: true,
      },
      { type: "HTTP", method: "GET", path: "/api/demo/new", configured: false },
    ]);
  });

  it("fails closed when a restriction snapshot is unreadable", async () => {
    await write("roles", "invalid", {});
    await expect(createService().execute()).rejects.toThrow(
      "Invalid permission link",
    );
  });
});
