import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { readFile, writeFile, rename, open, unlink } from "node:fs/promises";
import {
  AI_CHAT_SUPPORT_FORM_CONTENT,
  API_SERVICE_URL,
} from "@sps/shared-utils";
import type { IContentSdkAdapter } from "../../apps/mcp/lib/content-management/types";

export interface IWidgetCutoverTarget {
  hostLinkId: string;
  rbacWidgetId: string;
  websiteBuilderWidgetId: string;
  crmFormId?: string;
  crmWidgetId?: string;
}
export interface IWidgetCutoverInput {
  targets: IWidgetCutoverTarget[];
  /** Explicit operator-selected roles: this command never infers public access. */
  publicReadGrants?: (
    | "widgets-to-website-builder-module-widgets"
    | "widgets-to-crm-module-widgets"
  )[];
  readGrants?: {
    roleId: string;
    relation:
      | "widgets-to-website-builder-module-widgets"
      | "widgets-to-crm-module-widgets";
  }[];
}
export interface IWidgetCutoverOperation {
  entity: string;
  id: string;
  before: Record<string, unknown> | null;
  data: Record<string, unknown>;
  result?: Record<string, unknown>;
  selector?: Record<string, unknown>;
  referenceId?: string;
  rolledBack?: boolean;
  /** Security classifications remain active when reverting presentation changes. */
  retainOnRollback?: boolean;
}
export interface IWidgetCutoverManifest {
  schema:
    | "sps.ai-chat-widget-cutover.v1"
    | "sps.ecommerce-widget-cutover.v1"
    | "sps.social-widget-cutover.v1"
    | "sps.framework-widget-cutover.v1";
  createdAt: string;
  apiOrigin?: string;
  hostBindings?: Pick<
    IWidgetCutoverTarget,
    "hostLinkId" | "websiteBuilderWidgetId" | "rbacWidgetId"
  >[];
  status: "prepared" | "applying" | "applied" | "rolling-back" | "rolled-back";
  checks: { entity: string; record: Record<string, unknown> }[];
  operations: IWidgetCutoverOperation[];
  publicPermissionIds?: string[];
}
export type IWidgetCutoverAdapter = (
  entity: string,
) => Promise<IContentSdkAdapter>;
type IData = Record<string, any>;

function canonical(value: unknown): string {
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "undefined";
}
function matches(record: IData, data: IData) {
  return Object.entries(data).every(
    ([key, value]) => canonical(record[key]) === canonical(value),
  );
}
async function find(
  adapter: IWidgetCutoverAdapter,
  entity: string,
  filters: IData,
) {
  return (
    (await (
      await adapter(entity)
    ).find({
      params: {
        filters: {
          and: Object.entries(filters).map(([column, value]) => ({
            column,
            method: "eq",
            value,
          })),
        },
        limit: 101,
      },
    })) ?? []
  );
}
async function read(
  adapter: IWidgetCutoverAdapter,
  entity: string,
  id: string,
): Promise<IData | undefined> {
  const records = await find(adapter, entity, { id });
  if (records.length > 1) throw new Error(`Ambiguous ${entity}:${id}`);
  return records[0];
}

async function assertSinglePresentationRoot(
  adapter: IWidgetCutoverAdapter,
  binding: Pick<
    IWidgetCutoverTarget,
    "hostLinkId" | "websiteBuilderWidgetId" | "rbacWidgetId"
  >,
) {
  const host = await read(
    adapter,
    "host.widgets-to-external-widgets",
    binding.hostLinkId,
  );
  if (!host) throw new Error("Host link is unavailable");
  const siblings = await find(adapter, "host.widgets-to-external-widgets", {
    widgetId: host.widgetId,
  });
  if (siblings.length >= 101)
    throw new Error("Host links require pagination before transfer");
  const linkedContent = binding.rbacWidgetId
    ? await find(adapter, "rbac.widgets-to-website-builder-module-widgets", {
        widgetId: binding.rbacWidgetId,
      })
    : [];
  if (linkedContent.length >= 101)
    throw new Error("Content links require pagination before transfer");
  const presentationIds = new Set([
    binding.websiteBuilderWidgetId,
    ...linkedContent.map((link) => link.websiteBuilderModuleWidgetId),
  ]);
  const duplicates = siblings.filter(
    (link) =>
      link.id !== host.id &&
      link.variant !== "hidden" &&
      link.externalModule === "website-builder" &&
      presentationIds.has(link.externalWidgetId),
  );
  if (duplicates.length)
    throw new Error(
      `Host Widget also renders this presentation directly: ${duplicates.map((link) => link.id).join(", ")}. Review and mark obsolete direct associations hidden before transfer; preserve the Website Builder Widget.`,
    );
}

/** Read-only preparation. Before records and all generated IDs are persisted before any mutation. */
export async function prepareWidgetCutover(
  input: IWidgetCutoverInput,
  adapter: IWidgetCutoverAdapter,
): Promise<IWidgetCutoverManifest> {
  if (!input.targets.length)
    throw new Error("At least one explicit Host link is required");
  const manifest: IWidgetCutoverManifest = {
    schema: "sps.ai-chat-widget-cutover.v1",
    hostBindings: input.targets.map(
      ({ hostLinkId, websiteBuilderWidgetId, rbacWidgetId }) => ({
        hostLinkId,
        websiteBuilderWidgetId,
        rbacWidgetId,
      }),
    ),
    createdAt: new Date().toISOString(),
    status: "prepared",
    checks: [],
    operations: [],
  };
  const checked = new Set<string>();
  async function required(entity: string, id: string) {
    const record = await read(adapter, entity, id);
    if (!record) throw new Error(`Missing ${entity}:${id}`);
    if (!checked.has(`${entity}:${id}`)) {
      manifest.checks.push({ entity, record });
      checked.add(`${entity}:${id}`);
    }
    return record;
  }
  async function ensure(entity: string, selector: IData, data: IData) {
    const pending = manifest.operations.find(
      (op) =>
        op.entity === entity &&
        op.before === null &&
        matches(op.data, selector),
    );
    if (pending) return pending.data;
    const records = await find(adapter, entity, selector);
    if (records.length > 1) throw new Error(`Ambiguous ${entity} selector`);
    if (records.length) {
      if (!matches(records[0], data))
        throw new Error(
          `Existing ${entity}:${records[0].id} differs from the requested configuration`,
        );
      await required(entity, records[0].id);
      return records[0];
    }
    const record = { id: randomUUID(), ...data };
    manifest.operations.push({
      entity,
      id: record.id,
      before: null,
      data: record,
      selector,
    });
    return record;
  }
  const hostUpdates: IWidgetCutoverOperation[] = [];
  for (const target of input.targets) {
    await assertSinglePresentationRoot(adapter, target);
    const host = await required(
      "host.widgets-to-external-widgets",
      target.hostLinkId,
    );
    const rbac = await required("rbac.widget", target.rbacWidgetId);
    const website = await required(
      "website-builder.widget",
      target.websiteBuilderWidgetId,
    );
    const presentations: Record<string, string> = {
      "subject-me-social-module-profile-create-ai-chat":
        "content-ai-chat-profile-create",
      "subject-me-crm-module-form-support-ai-chat": "content-ai-chat-help",
      "ai-chat-help": "content-ai-chat-help",
      "subject-me-authentication-select-method-ai-chat":
        "content-ai-chat-authentication",
      "subject-me-authentication-registration-ai-chat":
        "content-ai-chat-registration",
      "subject-me-authentication-forgot-password-ai-chat":
        "content-ai-chat-forgot-password",
      "subject-me-authentication-reset-password-ai-chat":
        "content-ai-chat-reset-password",
    };
    const expectedWebsite = presentations[rbac.variant];
    if (!expectedWebsite) throw new Error("Unsupported RBAC Widget scenario");
    if (rbac.variant === "ai-chat-help")
      manifest.operations.push({
        entity: "rbac.widget",
        id: rbac.id,
        before: rbac,
        data: { variant: "subject-me-crm-module-form-support-ai-chat" },
      });
    let content = website;
    if (website.variant !== expectedWebsite) {
      if (
        website.variant !== "content-ai-chat-authentication" ||
        ![
          "content-ai-chat-registration",
          "content-ai-chat-forgot-password",
          "content-ai-chat-reset-password",
        ].includes(expectedWebsite)
      )
        throw new Error(`Wrong Website Builder variant for ${rbac.variant}`);
      // A saved frame may be shared by sign-in, registration and recovery.
      // Fork its presentation without changing that source or its other consumers.
      const slug = `ai-chat-${rbac.id}-content`;
      content = await ensure(
        "website-builder.widget",
        { slug },
        {
          ...updatePayload(website, {}),
          slug,
          variant: expectedWebsite,
        },
      );
      for (const [relation, targetColumn] of [
        ["widgets-to-buttons-arrays", "buttonsArrayId"],
        ["widgets-to-features", "featureId"],
        ["widgets-to-file-storage-module-files", "fileStorageModuleFileId"],
        ["widgets-to-logotypes", "logotypeId"],
        ["widgets-to-sliders", "sliderId"],
      ]) {
        const entity = `website-builder.${relation}`;
        const edges = await find(adapter, entity, { widgetId: website.id });
        if (edges.length >= 101)
          throw new Error(
            "Content relation requires pagination before transfer",
          );
        for (const edge of edges) {
          await required(entity, edge.id);
          await ensure(
            entity,
            {
              widgetId: content.id,
              [targetColumn]: edge[targetColumn],
              variant: edge.variant,
              orderIndex: edge.orderIndex,
            },
            {
              ...updatePayload(edge, {}),
              widgetId: content.id,
            },
          );
        }
      }
    }
    const entity = "rbac.widgets-to-website-builder-module-widgets";
    const links = await find(adapter, entity, { widgetId: rbac.id });
    if (links.length > 1)
      throw new Error(
        "RBAC Widget has multiple content links; select its content explicitly",
      );
    if (links.length) {
      const link = await required(entity, links[0].id);
      if (![website.id, content.id].includes(link.websiteBuilderModuleWidgetId))
        throw new Error("RBAC Widget already has different linked content");
      const data = {
        variant: "default",
        websiteBuilderModuleWidgetId: content.id,
      };
      if (!matches(link, data))
        manifest.operations.push({ entity, id: link.id, before: link, data });
    } else {
      await ensure(
        entity,
        { widgetId: rbac.id, websiteBuilderModuleWidgetId: content.id },
        {
          widgetId: rbac.id,
          websiteBuilderModuleWidgetId: content.id,
          variant: "default",
          orderIndex: 0,
        },
      );
    }
    if (expectedWebsite === "content-ai-chat-help") {
      if (!target.crmFormId)
        throw new Error("Help requires an explicit CRM Form ID");
      const form = await required("crm.form", target.crmFormId);
      if (form.variant !== "support-ai-chat")
        throw new Error("Expected the support-ai-chat CRM Form");
      const widget = target.crmWidgetId
        ? await required("crm.widget", target.crmWidgetId)
        : await ensure(
            "crm.widget",
            { slug: `ai-chat-support-${rbac.id}` },
            {
              slug: `ai-chat-support-${rbac.id}`,
              variant: "default",
              adminTitle: "AI Chat support form",
            },
          );
      const existingForms = await find(adapter, "crm.widgets-to-forms", {
        widgetId: widget.id,
      });
      if (
        existingForms.length > 1 ||
        (existingForms.length === 1 && existingForms[0].formId !== form.id)
      )
        throw new Error("CRM Widget points at a different Form");
      await ensure(
        "crm.widgets-to-forms",
        { widgetId: widget.id, formId: form.id },
        {
          widgetId: widget.id,
          formId: form.id,
          variant: "default",
          orderIndex: 0,
        },
      );
      const existingCrm = await find(
        adapter,
        "rbac.widgets-to-crm-module-widgets",
        { widgetId: rbac.id },
      );
      if (
        existingCrm.length > 1 ||
        (existingCrm.length === 1 &&
          existingCrm[0].crmModuleWidgetId !== widget.id)
      )
        throw new Error("RBAC Widget points at a different CRM Widget");
      await ensure(
        "rbac.widgets-to-crm-module-widgets",
        { widgetId: rbac.id, crmModuleWidgetId: widget.id },
        {
          widgetId: rbac.id,
          crmModuleWidgetId: widget.id,
          variant: "default",
          orderIndex: 0,
        },
      );
      const steps = await find(adapter, "crm.forms-to-steps", {
        formId: form.id,
      });
      if (!steps.length) {
        const step = await ensure(
          "crm.step",
          { slug: `ai-chat-support-${form.id}` },
          {
            slug: `ai-chat-support-${form.id}`,
            variant: "default",
            adminTitle: "Support request",
            title: { en: AI_CHAT_SUPPORT_FORM_CONTENT.title },
          },
        );
        await ensure(
          "crm.forms-to-steps",
          { formId: form.id, stepId: step.id },
          {
            formId: form.id,
            stepId: step.id,
            variant: "default",
            orderIndex: 0,
          },
        );
        for (const [index, name] of (
          ["topic", "details", "result"] as const
        ).entries()) {
          const copy = AI_CHAT_SUPPORT_FORM_CONTENT.fields[name];
          const control = await ensure(
            "crm.input",
            { slug: `ai-chat-support-${form.id}-${name}` },
            {
              slug: `ai-chat-support-${form.id}-${name}`,
              variant:
                name === "topic" ? "select-option-default" : "textarea-default",
              type: name === "topic" ? "option" : "string",
              isRequired: true,
              adminTitle: copy.label,
              title: { en: copy.label },
              label: { en: copy.label },
              placeholder: { en: copy.placeholder },
            },
          );
          await ensure(
            "crm.steps-to-inputs",
            { stepId: step.id, inputId: control.id },
            {
              stepId: step.id,
              inputId: control.id,
              variant: "default",
              orderIndex: index,
            },
          );
          if (name === "topic")
            for (const [
              optionIndex,
              title,
            ] of AI_CHAT_SUPPORT_FORM_CONTENT.topics.entries()) {
              const option = await ensure(
                "crm.option",
                { slug: `ai-chat-support-${form.id}-topic-${optionIndex}` },
                {
                  slug: `ai-chat-support-${form.id}-topic-${optionIndex}`,
                  variant: "default",
                  adminTitle: title,
                  title: { en: title },
                },
              );
              await ensure(
                "crm.inputs-to-options",
                { inputId: control.id, optionId: option.id },
                {
                  inputId: control.id,
                  optionId: option.id,
                  variant: "default",
                  orderIndex: optionIndex,
                },
              );
            }
        }
      } else {
        // An existing configured form is never overwritten from a hardcoded seed.
        for (const link of steps) {
          await required("crm.forms-to-steps", link.id);
          await required("crm.step", link.stepId);
          const controls = await find(adapter, "crm.steps-to-inputs", {
            stepId: link.stepId,
          });
          if (!controls.length)
            throw new Error(
              "Existing support step has no inputs; repair its explicit configuration first",
            );
          for (const control of controls) {
            await required("crm.steps-to-inputs", control.id);
            const input = await required("crm.input", control.inputId);
            if (String(input.variant).startsWith("select")) {
              const options = await find(adapter, "crm.inputs-to-options", {
                inputId: input.id,
              });
              if (!options.length)
                throw new Error("Existing support select has no options");
              for (const option of options) {
                await required("crm.inputs-to-options", option.id);
                await required("crm.option", option.optionId);
              }
            }
          }
        }
      }
    }
    const desired = { externalModule: "rbac", externalWidgetId: rbac.id };
    if (!matches(host, desired)) {
      if (
        host.externalModule !== "website-builder" ||
        host.externalWidgetId !== website.id
      )
        throw new Error(
          "Host link does not point at the explicitly selected original Website Builder Widget",
        );
      hostUpdates.push({
        entity: "host.widgets-to-external-widgets",
        id: host.id,
        before: host,
        data: desired,
      });
    }
  }
  for (const relation of input.publicReadGrants ?? []) {
    if (input.readGrants?.some((grant) => grant.relation === relation))
      throw new Error("A public read permission cannot also be role-bound");
    for (const suffix of ["", `/[rbac.${relation}.id]`]) {
      const permission = await ensure(
        "rbac.permission",
        { type: "HTTP", method: "GET", path: `/api/rbac/${relation}${suffix}` },
        {
          type: "HTTP",
          method: "GET",
          path: `/api/rbac/${relation}${suffix}`,
          variant: "default",
        },
      );
      const roles = await find(adapter, "rbac.roles-to-permissions", {
        permissionId: permission.id,
      });
      if (roles.length)
        throw new Error(
          "Existing configuration GET permission is role-bound; refusing to remove its access policy",
        );
      (manifest.publicPermissionIds ??= []).push(permission.id);
    }
  }
  for (const grant of input.readGrants ?? []) {
    await required("rbac.role", grant.roleId);
    for (const suffix of ["", `/[rbac.${grant.relation}.id]`]) {
      const permission = await ensure(
        "rbac.permission",
        {
          type: "HTTP",
          method: "GET",
          path: `/api/rbac/${grant.relation}${suffix}`,
        },
        {
          type: "HTTP",
          method: "GET",
          path: `/api/rbac/${grant.relation}${suffix}`,
          variant: "default",
        },
      );
      await ensure(
        "rbac.roles-to-permissions",
        { roleId: grant.roleId, permissionId: permission.id },
        {
          roleId: grant.roleId,
          permissionId: permission.id,
          variant: "default",
        },
      );
    }
  }
  // Host routes switch only after every content relation and permission exists.
  manifest.operations.push(...hostUpdates);
  return manifest;
}

/** Generic PATCH validates required FK fields; retain current writable columns. */
function updatePayload(current: IData, patch: IData) {
  return Object.fromEntries(
    Object.entries({ ...current, ...patch }).filter(
      ([key]) => !["id", "createdAt", "updatedAt"].includes(key),
    ),
  );
}

/** Backward-compatible recovery for an already prepared v1 manifest. */
function creationSelector(operation: IWidgetCutoverOperation): IData {
  if (operation.selector) return operation.selector;
  if (typeof operation.data.slug === "string")
    return { slug: operation.data.slug };
  const fields: Record<string, string[]> = {
    "rbac.permission": ["type", "method", "path"],
    "rbac.widgets-to-website-builder-module-widgets": [
      "widgetId",
      "websiteBuilderModuleWidgetId",
    ],
    "rbac.widgets-to-crm-module-widgets": ["widgetId", "crmModuleWidgetId"],
    "crm.widgets-to-forms": ["widgetId", "formId"],
    "crm.forms-to-steps": ["formId", "stepId"],
    "crm.steps-to-inputs": ["stepId", "inputId"],
    "crm.inputs-to-options": ["inputId", "optionId"],
    "rbac.roles-to-permissions": ["roleId", "permissionId"],
  };
  const keys = fields[operation.entity];
  if (!keys || keys.some((key) => operation.data[key] === undefined))
    throw new Error("Manifest create operation has no recoverable selector");
  return Object.fromEntries(keys.map((key) => [key, operation.data[key]]));
}
function replaceReference(value: unknown, from: string, to: string): any {
  if (value === from) return to;
  if (Array.isArray(value))
    return value.map((item) => replaceReference(item, from, to));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceReference(item, from, to),
      ]),
    );
  return value;
}
function adoptCreatedId(
  manifest: IWidgetCutoverManifest,
  operation: IWidgetCutoverOperation,
  id: string,
) {
  const reference = operation.id;
  operation.referenceId ??= reference;
  operation.id = id;
  for (const pending of manifest.operations) {
    pending.data = replaceReference(pending.data, reference, id);
    if (pending.selector)
      pending.selector = replaceReference(pending.selector, reference, id);
  }
  if (manifest.publicPermissionIds)
    manifest.publicPermissionIds = manifest.publicPermissionIds.map((value) =>
      value === reference ? id : value,
    );
}

/** Resumable application; persist() is called before writes and after every readback. */
export async function applyWidgetCutover(
  manifest: IWidgetCutoverManifest,
  adapter: IWidgetCutoverAdapter,
  persist: (manifest: IWidgetCutoverManifest) => Promise<void>,
) {
  if (
    ![
      "sps.ai-chat-widget-cutover.v1",
      "sps.ecommerce-widget-cutover.v1",
      "sps.social-widget-cutover.v1",
      "sps.framework-widget-cutover.v1",
    ].includes(manifest.schema) ||
    ["rolling-back", "rolled-back"].includes(manifest.status)
  )
    throw new Error("Cannot apply this manifest");
  for (const binding of manifest.hostBindings ?? [])
    await assertSinglePresentationRoot(adapter, binding);
  for (const check of manifest.checks) {
    if (
      manifest.status !== "prepared" &&
      manifest.operations.some(
        (operation) =>
          operation.before &&
          operation.entity === check.entity &&
          operation.id === check.record.id,
      )
    )
      continue;
    const current = await read(adapter, check.entity, String(check.record.id));
    if (canonical(current) !== canonical(check.record))
      throw new Error(
        `Stale before manifest: ${check.entity}:${check.record.id}`,
      );
  }
  const stats = { created: 0, updated: 0, recovered: 0, skipped: 0 };
  manifest.status = "applying";
  await persist(manifest);
  for (const operation of manifest.operations) {
    if (operation.entity === "host.widgets-to-external-widgets") {
      for (const permissionId of manifest.publicPermissionIds ?? []) {
        if (
          (await find(adapter, "rbac.roles-to-permissions", { permissionId }))
            .length
        )
          throw new Error(
            "Configuration GET permission became role-bound before Host cutover",
          );
      }
    }
    const api = await adapter(operation.entity);
    const current = await read(adapter, operation.entity, operation.id);
    if (operation.result) {
      if (canonical(current) !== canonical(operation.result))
        throw new Error("Applied record was changed after cutover");
      stats.skipped++;
      continue;
    }
    if (!operation.before) {
      operation.selector ??= creationSelector(operation);
      const expected = { ...operation.data };
      delete expected.id;
      let created = current;
      if (!created) {
        const candidates = await find(
          adapter,
          operation.entity,
          operation.selector,
        );
        if (candidates.length > 1)
          throw new Error("Ambiguous create recovery selector");
        created = candidates[0];
      }
      if (created && !matches(created, expected))
        throw new Error("Create recovery matched a different configuration");
      if (!created) {
        created = await api.create({ data: expected });
        stats.created++;
      } else stats.recovered++;
      if (!created?.id || !matches(created, expected))
        throw new Error(
          "Create response did not identify the prepared configuration; retry the same manifest",
        );
      // Standard CRUD discards client IDs. Persist the server ID and every dependent
      // reference before proceeding; unknown outcomes are recovered by this selector.
      adoptCreatedId(manifest, operation, String(created.id));
      await persist(manifest);
    } else if (!matches(current ?? {}, operation.data)) {
      if (canonical(current) !== canonical(operation.before))
        throw new Error("Record changed before cutover update");
      await api.update({
        id: operation.id,
        data: updatePayload(current!, operation.data),
      });
      stats.updated++;
    }
    const saved = await read(adapter, operation.entity, operation.id);
    if (!saved || !matches(saved, operation.data))
      throw new Error("Cutover readback failed");
    operation.result = saved;
    await persist(manifest);
  }
  manifest.status = "applied";
  await persist(manifest);
  return stats;
}

/** Restore exact old Host links and updates. Additive records stay for safe rollback/reapply. */
export async function rollbackWidgetCutover(
  manifest: IWidgetCutoverManifest,
  adapter: IWidgetCutoverAdapter,
  persist: (manifest: IWidgetCutoverManifest) => Promise<void>,
) {
  if (
    ![
      "sps.ai-chat-widget-cutover.v1",
      "sps.ecommerce-widget-cutover.v1",
      "sps.social-widget-cutover.v1",
      "sps.framework-widget-cutover.v1",
    ].includes(manifest.schema)
  )
    throw new Error("Unknown manifest schema");
  manifest.status = "rolling-back";
  await persist(manifest);
  for (const operation of [...manifest.operations].reverse()) {
    if (!operation.before || operation.rolledBack || operation.retainOnRollback)
      continue;
    const current = await read(adapter, operation.entity, operation.id);
    if (
      matches(
        current ?? {},
        Object.fromEntries(
          Object.keys(operation.data).map((key) => [
            key,
            operation.before![key],
          ]),
        ),
      )
    ) {
      operation.rolledBack = true;
      await persist(manifest);
      continue;
    }
    if (!current || !matches(current, operation.data))
      throw new Error(
        "Refusing to overwrite a concurrent edit during rollback",
      );
    const data = Object.fromEntries(
      Object.keys(operation.data).map((key) => [key, operation.before![key]]),
    );
    await (
      await adapter(operation.entity)
    ).update({ id: operation.id, data: updatePayload(current!, data) });
    const restored = await read(adapter, operation.entity, operation.id);
    if (!restored || !matches(restored, data))
      throw new Error("Rollback readback failed");
    operation.rolledBack = true;
    await persist(manifest);
  }
  manifest.status = "rolled-back";
  await persist(manifest);
}

export function cutoverApiOrigin(
  apiServiceUrl: string,
  allowedApiOrigin?: string,
) {
  const origin = new URL(apiServiceUrl);
  if (
    !["http:", "https:"].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error("Cutover API must be a credential-free HTTP origin");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname);
  if (
    !local &&
    (origin.protocol !== "https:" || allowedApiOrigin !== origin.origin)
  )
    throw new Error(
      "Remote cutover requires HTTPS and --allow-api-origin with the exact API origin",
    );
  return origin;
}

async function main() {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    options: { "allow-api-origin": { type: "string" } },
    allowPositionals: true,
  });
  const [mode, inputPath, manifestPath] = positionals;
  if (
    !["prepare", "apply", "rollback"].includes(mode) ||
    !inputPath ||
    (mode === "prepare" && !manifestPath) ||
    positionals.length !== (mode === "prepare" ? 3 : 2)
  )
    throw new Error(
      "Usage: bun run --tsconfig-override ./tsconfig.base.json tools/runtime/ai-chat-widget-links.ts prepare <explicit-input.json> <new-before-manifest.json> | apply|rollback <manifest.json> [--allow-api-origin https://api.example.com]",
    );
  const origin = cutoverApiOrigin(
    API_SERVICE_URL ?? "",
    values["allow-api-origin"],
  );
  const { getContentEntityDescriptor } = await import(
    "../../apps/mcp/lib/content-management/registry"
  );
  const adapter: IWidgetCutoverAdapter = async (entity) => {
    const descriptor = await getContentEntityDescriptor(entity);
    if (!descriptor) throw new Error(`Unknown SDK entity ${entity}`);
    const headers = process.env.RBAC_SECRET_KEY
      ? {
          "X-RBAC-SECRET-KEY": process.env.RBAC_SECRET_KEY,
          "Cache-Control": "no-cache",
        }
      : {};
    return Object.fromEntries(
      Object.entries(descriptor.api).map(([key, fn]) => [
        key,
        typeof fn === "function"
          ? (props: IData) =>
              fn({
                ...props,
                options: { ...props?.options, headers, cache: "no-store" },
              })
          : fn,
      ]),
    ) as unknown as IContentSdkAdapter;
  };
  const destination = mode === "prepare" ? manifestPath : inputPath;
  const lock = await open(`${destination}.lock`, "wx");
  const persist = async (manifest: IWidgetCutoverManifest) => {
    const temporary = `${destination}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(manifest, null, 2) + "\n", {
      mode: 0o600,
    });
    await rename(temporary, destination);
  };
  try {
    if (mode === "prepare") {
      try {
        await readFile(destination);
        throw new Error("Before manifest already exists; choose a new path");
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
      const manifest = await prepareWidgetCutover(
        JSON.parse(await readFile(inputPath, "utf8")),
        adapter,
      );
      manifest.apiOrigin = origin.origin;
      await persist(manifest);
    } else {
      const manifest = JSON.parse(await readFile(inputPath, "utf8"));
      if (manifest.apiOrigin && manifest.apiOrigin !== origin.origin)
        throw new Error("Manifest belongs to a different API origin");
      if (mode === "apply")
        console.log(
          JSON.stringify(await applyWidgetCutover(manifest, adapter, persist)),
        );
      else await rollbackWidgetCutover(manifest, adapter, persist);
    }
    console.log(`${mode} finished; manifest: ${destination}`);
  } finally {
    await lock.close();
    await unlink(`${destination}.lock`);
  }
}
if (import.meta.main)
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
