import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { Hono } from "hono";
import QueryString from "qs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { eq } from "drizzle-orm";
import { Table as Profile } from "@sps/social/models/profile/backend/repository/database";
import { Table as Article } from "@sps/blog/models/article/backend/repository/database";
import { Table } from "@sps/social/relations/profiles-to-blog-module-articles/backend/repository/database";
import { Middleware as IsAuthorizedMiddleware } from "../../../../../../../../../middlewares/src/lib/is-authorized";
import { ExceptionFilter } from "@sps/shared-backend-api";
import { Repository } from "./repository";
import { bootstrap } from "./bootstrap";

const authorize = jest.fn();
jest.mock("@sps/rbac/models/subject/sdk/server", () => ({
  api: { authenticationIsAuthorized: (props: any) => authorize(props) },
}));

// The integration suite only uses an explicitly supplied disposable database.
const databaseUrl = process.env.SPS_RELATION_TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;

suite("profile article relation API with PostgreSQL", () => {
  const route = "/api/social/profiles-to-blog-module-articles";
  const headers = { Authorization: "Bearer relation-test-admin" };
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof drizzle>;
  let app: Hono;
  let profileId: string;
  let otherProfileId: string;
  let articleId: string;
  const relationMigrations = resolve(
    __dirname,
    "../../../../repository/database/src/lib/migrations",
  );

  const write = async (method: "POST" | "PATCH", data: unknown, id = "") => {
    const body = new FormData();
    body.set("data", JSON.stringify(data));
    return app.request(`${route}${id ? `/${id}` : ""}`, {
      method,
      headers,
      body,
    });
  };

  const createLink = async (
    profile = profileId,
    article = articleId,
    orderIndex = 0,
  ) => {
    const response = await write("POST", {
      profileId: profile,
      blogModuleArticleId: article,
      orderIndex,
    });
    expect(response.status).toBe(201);
    return (await response.json()).data;
  };

  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
      throw new Error(
        "Integration database must be a disposable local PostgreSQL instance",
      );
    }
    client = postgres(databaseUrl!, { max: 1, onnotice: () => {} });
    db = drizzle(client);
    // Start with the actual pre-existing parent schemas, then upgrade them.
    await migrate(db, {
      migrationsFolder: resolve(
        process.cwd(),
        "libs/modules/blog/models/article/backend/repository/database/src/lib/migrations",
      ),
      migrationsTable: "test_blog_article_migrations",
    });
    await migrate(db, {
      migrationsFolder: resolve(
        process.cwd(),
        "libs/modules/social/models/profile/backend/repository/database/src/lib/migrations",
      ),
      migrationsTable: "test_social_profile_migrations",
    });
    [profileId, otherProfileId] = [randomUUID(), randomUUID()];
    articleId = randomUUID();
    await db
      .insert(Profile)
      .values([{ id: profileId }, { id: otherProfileId }]);
    await db.insert(Article).values({ id: articleId });
    await migrate(db, {
      migrationsFolder: relationMigrations,
      migrationsTable: "test_profile_article_migrations",
    });

    const { app: relationApp } = await bootstrap();
    (relationApp.controller.service.repository as Repository).db = db;
    authorize.mockImplementation(async (props) => {
      if (props.options.headers.Authorization !== "relation-test-admin") {
        throw new Error("Permission error. No relation permission");
      }
      return { ok: true };
    });
    app = new Hono();
    const filter = new ExceptionFilter();
    app.onError((error, context) => filter.catch(error, context));
    app.use(new IsAuthorizedMiddleware().init());
    app.route(route, relationApp.hono);
  });

  beforeEach(async () => {
    await db.delete(Table);
    authorize.mockClear();
  });

  afterAll(async () => {
    await client?.end();
  });

  it("preserves existing profiles/articles and can reapply the migration", async () => {
    await migrate(db, {
      migrationsFolder: relationMigrations,
      migrationsTable: "test_profile_article_migrations",
    });
    expect(
      await db.select().from(Profile).where(eq(Profile.id, profileId)),
    ).toHaveLength(1);
    expect(
      await db.select().from(Article).where(eq(Article.id, articleId)),
    ).toHaveLength(1);
    expect(await db.select().from(Table)).toHaveLength(0);
  });

  it("supports CRUD, filtered reads and multiple profiles per article", async () => {
    const link = await createLink();
    await createLink(otherProfileId);
    const query = QueryString.stringify({
      filters: {
        and: [{ column: "profileId", method: "eq", value: profileId }],
      },
      orderBy: { and: [{ column: "orderIndex", method: "asc" }] },
      limit: 10,
      offset: 0,
    });
    const response = await app.request(`${route}?${query}`, { headers });
    expect(response.status).toBe(200);
    expect((await response.json()).data.map((item: any) => item.id)).toEqual([
      link.id,
    ]);
    const byArticle = QueryString.stringify({
      filters: {
        and: [
          { column: "blogModuleArticleId", method: "eq", value: articleId },
        ],
      },
    });
    const count = await app.request(`${route}/count?${byArticle}`, { headers });
    expect((await count.json()).data).toBe(2);
    const updated = await write(
      "PATCH",
      {
        profileId,
        blogModuleArticleId: articleId,
        orderIndex: 8,
        className: "p-4",
      },
      link.id,
    );
    expect(updated.status).toBe(200);
    const single = await app.request(`${route}/${link.id}`, { headers });
    expect((await single.json()).data.orderIndex).toBe(8);
    const removed = await app.request(`${route}/${link.id}`, {
      method: "DELETE",
      headers,
    });
    expect(removed.status).toBe(200);
    expect(
      await db.select().from(Profile).where(eq(Profile.id, profileId)),
    ).toHaveLength(1);
    expect(
      await db.select().from(Article).where(eq(Article.id, articleId)),
    ).toHaveLength(1);
  });

  it("rejects missing endpoints and unknown foreign-key references", async () => {
    expect((await write("POST", { profileId })).status).toBe(422);
    const response = await write("POST", {
      profileId: randomUUID(),
      blogModuleArticleId: articleId,
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(await db.select().from(Table)).toHaveLength(0);
  });

  it("cascades deleting either endpoint while retaining the other entity", async () => {
    const temporaryProfileId = randomUUID();
    await db.insert(Profile).values({ id: temporaryProfileId });
    const profileLink = await createLink(temporaryProfileId);
    await db.delete(Profile).where(eq(Profile.id, temporaryProfileId));
    expect(
      await db.select().from(Table).where(eq(Table.id, profileLink.id)),
    ).toHaveLength(0);
    expect(
      await db.select().from(Article).where(eq(Article.id, articleId)),
    ).toHaveLength(1);

    const temporaryArticleId = randomUUID();
    await db.insert(Article).values({ id: temporaryArticleId });
    const articleLink = await createLink(profileId, temporaryArticleId);
    await db.delete(Article).where(eq(Article.id, temporaryArticleId));
    expect(
      await db.select().from(Table).where(eq(Table.id, articleLink.id)),
    ).toHaveLength(0);
    expect(
      await db.select().from(Profile).where(eq(Profile.id, profileId)),
    ).toHaveLength(1);
  });

  it("checks the new route through shared RBAC for both reads and mutations", async () => {
    for (const method of ["GET", "POST", "DELETE"]) {
      const response = await app.request(route, {
        method,
        headers: { Authorization: "Bearer relation-test-denied" },
      });
      expect(response.status).toBe(403);
    }
    expect(authorize).toHaveBeenCalledTimes(3);
    expect(authorize.mock.calls[0][0].params.permission).toEqual({
      route,
      method: "GET",
      type: "HTTP",
    });
    const allowed = await app.request(route, { headers });
    expect(allowed.status).toBe(200);
  });
});
