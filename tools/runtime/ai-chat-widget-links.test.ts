import { randomUUID } from "node:crypto";
import { describe, expect, it } from "bun:test";
import {
  prepareWidgetCutover,
  applyWidgetCutover,
  rollbackWidgetCutover,
  type IWidgetCutoverAdapter,
} from "./ai-chat-widget-links";
function fixture() {
  const records = new Map<string, Map<string, any>>();
  const put = (entity: string, record: any) => {
    if (!records.has(entity)) records.set(entity, new Map());
    records.get(entity)!.set(record.id, { ...record });
  };
  for (const suffix of ["a", "b"]) {
    put("host.widgets-to-external-widgets", {
      id: `host-${suffix}`,
      externalModule: "website-builder",
      externalWidgetId: `website-${suffix}`,
      widgetId: `host-widget-${suffix}`,
      updatedAt: "old",
    });
    put("rbac.widget", {
      id: `rbac-${suffix}`,
      variant: "subject-me-social-module-profile-create-ai-chat",
      updatedAt: "old",
    });
    put("website-builder.widget", {
      id: `website-${suffix}`,
      variant: "content-ai-chat-profile-create",
      title: { en: `Card ${suffix}` },
      updatedAt: "old",
    });
  }
  let writes = 0;
  const adapter: IWidgetCutoverAdapter = async (entity) => ({
    find: async (props) =>
      [...(records.get(entity)?.values() ?? [])]
        .filter(
          (record) =>
            props?.params?.filters?.and?.every(
              (filter) => record[filter.column] === filter.value,
            ) ?? true,
        )
        .map((record) => structuredClone(record)),
    findById: async ({ id }) => records.get(entity)?.get(id),
    count: async () => records.get(entity)?.size ?? 0,
    create: async ({ data }) => {
      writes++;
      const id = randomUUID();
      put(entity, { ...data, id, updatedAt: `write-${writes}` });
      return records.get(entity)!.get(id);
    },
    update: async ({ id, data }) => {
      if (entity === "host.widgets-to-external-widgets" && !data.widgetId)
        throw new Error("widgetId: Required");
      writes++;
      put(entity, {
        ...records.get(entity)?.get(id),
        ...data,
        updatedAt: `write-${writes}`,
      });
      return records.get(entity)!.get(id);
    },
    delete: async ({ id }) => {
      writes++;
      const record = records.get(entity)?.get(id);
      records.get(entity)?.delete(id);
      return record;
    },
  });
  const input = {
    targets: ["a", "b"].map((suffix) => ({
      hostLinkId: `host-${suffix}`,
      rbacWidgetId: `rbac-${suffix}`,
      websiteBuilderWidgetId: `website-${suffix}`,
      mode: "project-create" as const,
    })),
  };
  return { adapter, records, put, input, writes: () => writes };
}
describe("explicit widget graph cutover", () => {
  it("prepares without writes, isolates same-variant instances, applies twice and rolls back old Host IDs", async () => {
    const f = fixture();
    const manifest = await prepareWidgetCutover(f.input, f.adapter);
    expect(f.writes()).toBe(0);
    expect(
      manifest.operations
        .filter((op) => op.entity.startsWith("rbac.widgets-to"))
        .map((op) => op.data.websiteBuilderModuleWidgetId),
    ).toEqual(["website-a", "website-b"]);
    const saved: any[] = [];
    const persist = async (value: any) => {
      saved.push(structuredClone(value));
    };
    await applyWidgetCutover(manifest, f.adapter, persist);
    const written = f.writes();
    await applyWidgetCutover(manifest, f.adapter, persist);
    expect(f.writes()).toBe(written);
    expect(
      f.records.get("host.widgets-to-external-widgets")!.get("host-a")
        .externalWidgetId,
    ).toBe("rbac-a");
    expect(
      (await prepareWidgetCutover(f.input, f.adapter)).operations,
    ).toHaveLength(0);
    await rollbackWidgetCutover(manifest, f.adapter, persist);
    expect(
      f.records.get("host.widgets-to-external-widgets")!.get("host-a")
        .externalWidgetId,
    ).toBe("website-a");
    expect(
      f.records.get("website-builder.widget")!.get("website-a").title.en,
    ).toBe("Card a");
    expect(
      f.records.get("rbac.widgets-to-website-builder-module-widgets")!.size,
    ).toBe(2);
    expect(saved[0].status).toBe("applying");
    expect(saved.at(-1).status).toBe("rolled-back");
  });
  it("refuses a stale manifest and a concurrent edit during rollback", async () => {
    const f = fixture();
    const manifest = await prepareWidgetCutover(f.input, f.adapter);
    f.put("website-builder.widget", {
      id: "website-a",
      variant: "content-ai-chat-profile-create",
      updatedAt: "changed",
    });
    await expect(
      applyWidgetCutover(manifest, f.adapter, async () => {}),
    ).rejects.toThrow("Stale before manifest");
    expect(f.writes()).toBe(0);
    const g = fixture();
    const fresh = await prepareWidgetCutover(g.input, g.adapter);
    await applyWidgetCutover(fresh, g.adapter, async () => {});
    g.put("host.widgets-to-external-widgets", {
      id: "host-a",
      externalModule: "rbac",
      externalWidgetId: "other",
    });
    await expect(
      rollbackWidgetCutover(fresh, g.adapter, async () => {}),
    ).rejects.toThrow("concurrent edit");
  });
  it("resumes after a process dies following a successful create, without duplicate records", async () => {
    const f = fixture();
    const manifest = await prepareWidgetCutover(f.input, f.adapter);
    let calls = 0;
    await expect(
      applyWidgetCutover(manifest, f.adapter, async () => {
        if (++calls === 2) throw new Error("process died");
      }),
    ).rejects.toThrow("process died");
    delete manifest.operations[0].result;
    await applyWidgetCutover(manifest, f.adapter, async () => {});
    expect(
      f.records.get("rbac.widgets-to-website-builder-module-widgets")!.size,
    ).toBe(2);
    expect(manifest.status).toBe("applied");
  });
  it("prepares the complete persisted support Form→Step→Input/options graph before switching Help", async () => {
    const f = fixture();
    f.put("rbac.widget", { id: "rbac-a", variant: "ai-chat-help" });
    f.put("website-builder.widget", {
      id: "website-a",
      variant: "content-ai-chat-help",
    });
    f.put("crm.form", { id: "form-a", variant: "support-ai-chat" });
    const input = {
      targets: [
        { ...f.input.targets[0], mode: "help" as const, crmFormId: "form-a" },
      ],
    };
    const manifest = await prepareWidgetCutover(input, f.adapter);
    expect(f.writes()).toBe(0);
    expect(
      manifest.operations.filter((op) => op.entity === "crm.input"),
    ).toHaveLength(3);
    expect(
      manifest.operations.filter((op) => op.entity === "crm.option"),
    ).toHaveLength(7);
    expect(manifest.operations.at(-1)?.entity).toBe(
      "host.widgets-to-external-widgets",
    );
    await applyWidgetCutover(manifest, f.adapter, async () => {});
    expect(
      (await prepareWidgetCutover(input, f.adapter)).operations,
    ).toHaveLength(0);
  });
});

it("prepares roleless public configuration GETs and refuses to remove an existing role policy", async () => {
  const f = fixture();
  const input = {
    ...f.input,
    publicReadGrants: [
      "widgets-to-website-builder-module-widgets" as const,
      "widgets-to-crm-module-widgets" as const,
    ],
  };
  const manifest = await prepareWidgetCutover(input, f.adapter);
  expect(manifest.publicPermissionIds).toHaveLength(4);
  expect(
    manifest.operations
      .filter((op) => op.entity === "rbac.permission")
      .every((op) => op.data.method === "GET"),
  ).toBe(true);
  expect(
    manifest.operations.some((op) => op.entity === "rbac.roles-to-permissions"),
  ).toBe(false);
  f.put("rbac.permission", {
    id: "locked",
    type: "HTTP",
    method: "GET",
    path: "/api/rbac/widgets-to-website-builder-module-widgets",
    variant: "default",
  });
  f.put("rbac.roles-to-permissions", {
    id: "private-policy",
    permissionId: "locked",
    roleId: "private-role",
  });
  await expect(prepareWidgetCutover(input, f.adapter)).rejects.toThrow(
    "role-bound",
  );
  expect(f.writes()).toBe(0);
});

it("recovers a successful create with a server-assigned ID after an unknown response and real restart", async () => {
  const f = fixture();
  const manifest = await prepareWidgetCutover(f.input, f.adapter);
  let disk = structuredClone(manifest);
  let fail = true;
  const failing: IWidgetCutoverAdapter = async (entity) => {
    const api = await f.adapter(entity);
    return {
      ...api,
      create: async (props) => {
        const result = await api.create(props);
        if (fail) {
          fail = false;
          throw new Error("response lost");
        }
        return result;
      },
    };
  };
  await expect(
    applyWidgetCutover(manifest, failing, async (value) => {
      disk = structuredClone(value);
    }),
  ).rejects.toThrow("response lost");
  expect(
    f.records.get("rbac.widgets-to-website-builder-module-widgets")!.size,
  ).toBe(1);
  await applyWidgetCutover(disk, f.adapter, async (value) => {
    disk = structuredClone(value);
  });
  expect(disk.status).toBe("applied");
  expect(
    f.records.get("rbac.widgets-to-website-builder-module-widgets")!.size,
  ).toBe(2);
  expect(
    disk.operations
      .filter((op) => !op.before)
      .every((op) => op.referenceId && op.id !== op.referenceId),
  ).toBe(true);
});
it("remaps server-assigned CRM IDs into every dependent record and public permission check", async () => {
  const f = fixture();
  f.put("rbac.widget", { id: "rbac-a", variant: "ai-chat-help" });
  f.put("website-builder.widget", {
    id: "website-a",
    variant: "content-ai-chat-help",
  });
  f.put("crm.form", { id: "form-a", variant: "support-ai-chat" });
  const manifest = await prepareWidgetCutover(
    {
      targets: [{ ...f.input.targets[0], mode: "help", crmFormId: "form-a" }],
      publicReadGrants: ["widgets-to-website-builder-module-widgets"],
    },
    f.adapter,
  );
  await applyWidgetCutover(manifest, f.adapter, async () => {});
  const crmLink = [
    ...f.records.get("rbac.widgets-to-crm-module-widgets")!.values(),
  ][0];
  expect(f.records.get("crm.widget")!.has(crmLink.crmModuleWidgetId)).toBe(
    true,
  );
  for (const row of f.records.get("crm.steps-to-inputs")!.values()) {
    expect(f.records.get("crm.step")!.has(row.stepId)).toBe(true);
    expect(f.records.get("crm.input")!.has(row.inputId)).toBe(true);
  }
  for (const row of f.records.get("crm.inputs-to-options")!.values()) {
    expect(f.records.get("crm.input")!.has(row.inputId)).toBe(true);
    expect(f.records.get("crm.option")!.has(row.optionId)).toBe(true);
  }
  expect(
    manifest.publicPermissionIds!.every((id) =>
      f.records.get("rbac.permission")!.has(id),
    ),
  ).toBe(true);
});
