import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { signJwt } from "@sps/backend-utils";
import { Middleware as IsAuthorizedMiddleware } from "../../../../../../../../../../../../../middlewares/src/lib/is-authorized";
import {
  createAppAssembly,
  withConsistencyDatabase,
} from "@sps/shared-backend-api";
import {
  getDrizzle,
  getPostgresClient,
  resetPostgresClient,
} from "@sps/shared-backend-database-config";
import { Provider as KvProvider } from "@sps/providers-kv";
import { KV_PROVIDER, RBAC_JWT_SECRET } from "@sps/shared-utils";
import { bootstrap } from "../../../../bootstrap";

afterAll(async () => {
  await getPostgresClient().end();
  resetPostgresClient();
  const kv = new KvProvider({ type: KV_PROVIDER }).client;
  if (kv.client && "disconnect" in kv.client) {
    kv.client.disconnect();
  }
});

it("pages shared categories and keys, restricts writes and selects only eligible store attributes", async () => {
  const rollback = new Error("Rollback catalog directory fixture");
  const run = getDrizzle({}).transaction((tx) =>
    withConsistencyDatabase(tx, async () => {
      const { app, service: subject } = await bootstrap(createAppAssembly());
      const http = new Hono();
      http.use(new IsAuthorizedMiddleware().init());
      http.route("/api/rbac/subjects", app.hono);
      const ecommerce = subject.modules.ecommerce;
      const directory = subject.storeCatalogDirectories;
      const store = await ecommerce.store.create({ data: {} });
      const other = await ecommerce.store.create({ data: {} });
      const owner = await subject.create({ data: {} });
      const reader = await subject.create({ data: {} });
      for (const [subjectId, storeId, variant] of [
        [owner.id, store.id, "owner"],
        [owner.id, other.id, "owner"],
        [reader.id, store.id, "crm-manager"],
      ]) {
        await subject.module.subjectsToEcommerceModuleStores.create({
          data: { subjectId, ecommerceModuleStoreId: storeId, variant },
        });
      }
      const marker = "Dir_%" + randomUUID();
      const params = { offset: 0, limit: 1, search: marker.toUpperCase() };
      const category = {
        kind: "categories" as const,
        title: marker,
        language: "ru",
      };
      const ownerIdentity = await subject.module.identity.create({
        data: { email: randomUUID() + "@example.test" },
      });
      await subject.module.subjectsToIdentities.create({
        data: { subjectId: owner.id, identityId: ownerIdentity.id },
      });
      const token = await signJwt(
        { subjectId: owner.id, type: "access", lifetimeInSeconds: 300 },
        RBAC_JWT_SECRET!,
      );
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const path = `/api/rbac/subjects/${owner.id}/ecommerce-module/stores/${store.id}/directories/categories`;
      const unauthenticated = await http.request(path);
      expect(unauthenticated.status).toBe(401);
      const created = await http.request(path, {
        method: "POST",
        headers,
        body: JSON.stringify({ data: category }),
      });
      expect(created.status).toBe(201);
      const listed = await http.request(
        path + "?search=" + encodeURIComponent(marker),
        { headers },
      );
      expect(listed.status).toBe(200);
      expect(await listed.json()).toMatchObject({
        data: { total: 1, canCreate: true, items: [{ title: { ru: marker } }] },
      });
      expect(listed.headers.get("Cache-Control")).toContain("no-store");
      await directory.create(owner.id, store.id, {
        ...category,
        title: marker + "x",
      });
      const first = await directory.list(
        reader.id,
        store.id,
        "categories",
        params,
      );
      const second = await directory.list(reader.id, store.id, "categories", {
        ...params,
        offset: 1,
      });
      expect(first).toMatchObject({
        total: 2,
        nextOffset: 1,
        canCreate: false,
      });
      expect(second.items[0].id).not.toEqual(first.items[0].id);
      await expect(
        directory.list(reader.id, other.id, "attributes", params),
      ).rejects.toThrow("Permission error");
      await expect(
        directory.create(reader.id, store.id, category),
      ).rejects.toThrow("Permission error");
      const newKey = { title: marker + " numeric", field: "number" as const };
      const entry = await directory.create(owner.id, store.id, {
        kind: "attributes",
        language: "ru",
        newKey,
        value: "1.23",
      });
      const foreign = await directory.create(owner.id, other.id, {
        kind: "attributes",
        language: "ru",
        keyId: entry.keyId,
        value: "3",
      });
      const secretKey = await ecommerce.attributeKey.create({
        data: {
          slug: "secret-" + randomUUID(),
          field: "string",
          type: "feature",
          adminTitle: marker,
        },
      });
      await expect(
        directory.create(owner.id, store.id, {
          kind: "attributes",
          language: "ru",
          keyId: secretKey.id,
          value: "private",
        }),
      ).rejects.toThrow("Choose an available attribute key");
      const keyPage = await directory.list(
        reader.id,
        store.id,
        "attribute-keys",
        params,
      );
      expect(keyPage).toMatchObject({ total: 1, items: [{ id: entry.keyId }] });
      const values = await directory.list(
        reader.id,
        store.id,
        "attributes",
        params,
      );
      expect(values).toMatchObject({
        total: 1,
        items: [
          {
            id: entry.id,
            value: "1.23",
            keyTranslations: { ru: newKey.title },
          },
        ],
      });
      expect(
        await directory.findAttributes(store.id, [entry.id, foreign.id], true),
      ).toHaveLength(1);
      const admin = await subject.create({ data: {} });
      const [existingRole] = await subject.module.role.find({
        params: {
          filters: { and: [{ column: "slug", method: "eq", value: "admin" }] },
          limit: 1,
        },
      });
      const adminRole =
        existingRole ||
        (await subject.module.role.create({
          data: { slug: "admin", title: "Admin" },
        }));
      await subject.module.subjectsToRoles.create({
        data: { subjectId: admin.id, roleId: adminRole.id },
      });
      const adminIdentity = await subject.module.identity.create({
        data: { email: randomUUID() + "@example.test" },
      });
      await subject.module.subjectsToIdentities.create({
        data: { subjectId: admin.id, identityId: adminIdentity.id },
      });
      const adminToken = await signJwt(
        { subjectId: admin.id, type: "access", lifetimeInSeconds: 300 },
        RBAC_JWT_SECRET!,
      );
      const endpoint = (actor: string, kind: string, id: string) =>
        `/api/rbac/subjects/${actor}/ecommerce-module/stores/${store.id}/directories/${kind}/${id}`;
      const adminHeaders = {
        ...headers,
        Authorization: `Bearer ${adminToken}`,
      };
      const categoryId = first.items[0].id;
      const ownerCategory = await directory.detail(
        owner.id,
        store.id,
        "categories",
        categoryId,
        token,
      );
      expect(ownerCategory.canEdit).toBe(false);
      await expect(
        directory.update(
          owner.id,
          store.id,
          categoryId,
          {
            kind: "categories",
            expectedUpdatedAt: ownerCategory.updatedAt,
            language: "en",
            title: "Forbidden",
          },
          token,
        ),
      ).rejects.toThrow("Permission error");
      for (const [kind, id] of [
        ["categories", categoryId],
        ["attribute-keys", entry.keyId!],
      ] as const) {
        const url = endpoint(admin.id, kind, id);
        const loaded = await http.request(url, { headers: adminHeaders });
        expect(loaded.status).toBe(200);
        const { data: detail } = await loaded.json();
        expect(detail.canEdit).toBe(true);
        const input = {
          kind,
          expectedUpdatedAt: detail.updatedAt,
          language: "en",
          title: "Edited translation",
          ...(kind === "categories" && { slug: "edited-" + randomUUID() }),
          ...(kind === "attribute-keys" && { field: "number" }),
        };
        const edited = await http.request(url, {
          method: "PATCH",
          headers: adminHeaders,
          body: JSON.stringify({ data: input }),
        });
        expect(edited.status).toBe(200);
        const { data: saved } = await edited.json();
        expect(saved.title).toEqual({
          ...detail.title,
          en: "Edited translation",
        });
        if (kind === "attribute-keys") {
          expect(saved.canChangeField).toBe(false);
          await expect(
            directory.update(
              admin.id,
              store.id,
              id,
              {
                kind,
                expectedUpdatedAt: saved.updatedAt,
                language: "en",
                title: "Another",
                field: "string",
              },
              adminToken,
            ),
          ).rejects.toThrow("field type");
        }
      }
      const delegatedCategoryId = second.items[0].id;
      const role = await subject.module.role.create({
        data: {
          slug: "directory-editor-" + randomUUID(),
          title: "Category editor",
        },
      });
      const permission = await subject.module.role.module.permission.create({
        data: {
          type: "HTTP",
          method: "PATCH",
          path: `/api/ecommerce/categories/${delegatedCategoryId}`,
        },
      });
      await subject.module.role.module.rolesToPermissions.create({
        data: { roleId: role.id, permissionId: permission.id },
      });
      await subject.module.subjectsToRoles.create({
        data: { subjectId: owner.id, roleId: role.id },
      });
      subject.isAuthorizedService.invalidateSubjectRoleCache(owner.id);
      const authorized = await directory.detail(
        owner.id,
        store.id,
        "categories",
        delegatedCategoryId,
        token,
      );
      expect(authorized.canEdit).toBe(true);
      await expect(
        directory.update(
          owner.id,
          store.id,
          delegatedCategoryId,
          {
            kind: "categories",
            expectedUpdatedAt: authorized.updatedAt,
            language: "en",
            title: "Authorized change",
          },
          token,
        ),
      ).resolves.toMatchObject({ title: { en: "Authorized change" } });
      expect(
        (
          await directory.detail(
            owner.id,
            store.id,
            "categories",
            categoryId,
            token,
          )
        ).canEdit,
      ).toBe(false);
      const attributeUrl = endpoint(owner.id, "attributes", entry.id);
      const loaded = await http.request(attributeUrl, { headers });
      const { data: record } = await loaded.json();
      expect(record.canEdit).toBe(true);
      const update = {
        kind: "attributes" as const,
        expectedUpdatedAt: record.updatedAt,
        language: "ru",
        value: "5",
      };
      const saved = await http.request(attributeUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ data: update }),
      });
      expect(saved.status).toBe(200);
      const { data: changed } = await saved.json();
      expect(changed.value).toBe("5");
      await expect(
        directory.update(owner.id, store.id, entry.id, {
          ...update,
          expectedUpdatedAt: "2020-01-01T00:00:00.000Z",
        }),
      ).rejects.toThrow("changed");
      await ecommerce.storesToAttributes.create({
        data: { storeId: other.id, attributeId: entry.id },
      });
      expect(
        (
          await directory.detail(
            owner.id,
            store.id,
            "attributes",
            entry.id,
            token,
          )
        ).canEdit,
      ).toBe(false);
      await expect(
        directory.update(owner.id, store.id, entry.id, {
          ...update,
          expectedUpdatedAt: changed.updatedAt,
        }),
      ).rejects.toThrow("Permission error");
      await ecommerce.attributeKeysToAttributes.create({
        data: { attributeId: entry.id, attributeKeyId: secretKey.id },
      });
      expect(
        await directory.findAttributes(store.id, [entry.id], true),
      ).toEqual([]);
      throw rollback;
    }),
  );
  await expect(run).rejects.toBe(rollback);
});
