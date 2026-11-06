import { Service } from "./create";

const requestId = "61ed455d-8cce-458f-9992-a12e1fcb449a";
const categoryId = "71ed455d-8cce-458f-9992-a12e1fcb449a";
const description = JSON.stringify({
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "Saved content" }] },
  ],
});
function input() {
  return {
    requestId,
    title: { en: "Saved title" },
    description: { en: description },
    categoryId,
  };
}

function fixture() {
  const tables: Record<string, any[]> = {
    articles: [],
    owners: [],
    authors: [],
    categories: [],
  };
  function repository(table: string) {
    return {
      find: jest.fn(async (props) =>
        tables[table].filter((row) =>
          (props?.params?.filters?.and ?? []).every(
            (filter: any) => row[filter.column] === filter.value,
          ),
        ),
      ),
      findById: jest.fn(async ({ id }) =>
        tables[table].find((row) => row.id === id),
      ),
      create: jest.fn(async ({ data }) => {
        const row = { id: `${table}-${tables[table].length}`, ...data };
        tables[table].push(row);
        return row;
      }),
    };
  }
  let tail = Promise.resolve();
  const dependencies = {
    repository: {
      withSubjectLock: jest.fn((_scope, operation) => {
        const next = tail.then(async () => {
          const snapshot = structuredClone(tables);
          try {
            return await operation();
          } catch (error) {
            for (const key of Object.keys(tables)) tables[key] = snapshot[key];
            throw error;
          }
        });
        tail = next.then(
          () => undefined,
          () => undefined,
        );
        return next;
      }),
    },
    findById: jest.fn(async ({ id }) => ({ id, variant: "default" })),
    subjectsToIdentities: {
      find: jest.fn(async (props) => [
        { subjectId: props.params.filters.and[0].value },
      ]),
    },
    socialModuleProfileOwnershipEnsure: jest.fn(async ({ subjectId }) => ({
      profile: { id: `profile-${subjectId}` },
    })),
    subjectsToBlogModuleArticles: repository("owners"),
    blogModule: {
      article: repository("articles"),
      category: { findById: jest.fn(async ({ id }) => ({ id })) },
      categoriesToArticles: repository("categories"),
    },
    socialModule: {
      profilesToBlogModuleArticles: repository("authors"),
      profile: {
        authorFind: jest.fn(async ({ profileId }) => [{ id: profileId }]),
      },
    },
  };
  return { tables, dependencies, service: new Service(dependencies as any) };
}

it("publishes an Article with exact owning, author and category links and replays the same request", async () => {
  const { tables, service } = fixture();
  const first = await service.execute({ subjectId: "owner", data: input() });
  const retry = await service.execute({ subjectId: "owner", data: input() });
  expect(retry.article.id).toBe(first.article.id);
  expect(first.article.slug).toBe(`article-${requestId}`);
  expect(tables.articles).toHaveLength(1);
  expect(tables.owners).toEqual([
    expect.objectContaining({
      subjectId: "owner",
      blogModuleArticleId: first.article.id,
    }),
  ]);
  expect(tables.authors).toEqual([
    expect.objectContaining({
      profileId: "profile-owner",
      blogModuleArticleId: first.article.id,
    }),
  ]);
  expect(tables.categories).toEqual([
    expect.objectContaining({ categoryId, articleId: first.article.id }),
  ]);
});

it("serializes two retries through the common Subject transaction contract", async () => {
  const { tables, service, dependencies } = fixture();
  const results = await Promise.all([
    service.execute({ subjectId: "owner", data: input() }),
    service.execute({ subjectId: "owner", data: input() }),
  ]);
  expect(results[0].article.id).toBe(results[1].article.id);
  expect(tables.articles).toHaveLength(1);
  expect(dependencies.repository.withSubjectLock).toHaveBeenCalledWith(
    { subjectId: "owner" },
    expect.any(Function),
  );
});

it("rejects changed payload or foreign ownership on a durable request UUID", async () => {
  const { service, tables } = fixture();
  await service.execute({ subjectId: "owner", data: input() });
  await expect(
    service.execute({
      subjectId: "owner",
      data: { ...input(), title: { en: "Changed" } },
    }),
  ).rejects.toThrow("Conflict error");
  await expect(
    service.execute({ subjectId: "other", data: input() }),
  ).rejects.toThrow("Conflict error");
  tables.authors[0].profileId = "foreign-author";
  await expect(
    service.execute({ subjectId: "owner", data: input() }),
  ).rejects.toThrow("Conflict error");
  expect(tables.articles).toHaveLength(1);
});

it.each(["owner", "author", "category"])(
  "rolls all writes back when the %s link insert fails",
  async (kind) => {
    const { service, dependencies, tables } = fixture();
    const writer =
      kind === "owner"
        ? dependencies.subjectsToBlogModuleArticles
        : kind === "author"
          ? dependencies.socialModule.profilesToBlogModuleArticles
          : dependencies.blogModule.categoriesToArticles;
    writer.create.mockRejectedValueOnce(new Error("Link insert failed"));
    await expect(
      service.execute({ subjectId: "owner", data: input() }),
    ).rejects.toThrow("Link insert failed");
    expect(Object.values(tables).every((rows) => rows.length === 0)).toBe(true);
  },
);

it("rejects an anonymous or agent Subject before provisioning an author", async () => {
  const { service, dependencies } = fixture();
  dependencies.subjectsToIdentities.find.mockResolvedValueOnce([]);
  await expect(
    service.execute({ subjectId: "guest", data: input() }),
  ).rejects.toThrow("signed-in human");
  dependencies.findById.mockResolvedValueOnce({
    id: "agent",
    variant: "agent",
  });
  await expect(
    service.execute({ subjectId: "agent", data: input() }),
  ).rejects.toThrow("signed-in human");
  expect(
    dependencies.socialModuleProfileOwnershipEnsure,
  ).not.toHaveBeenCalled();
});
