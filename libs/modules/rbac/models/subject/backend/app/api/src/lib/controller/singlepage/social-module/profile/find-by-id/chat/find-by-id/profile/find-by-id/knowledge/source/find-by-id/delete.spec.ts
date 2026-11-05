/**
 * BDD Suite: chat-scoped Knowledge unlink and deletion.
 * Given: access middleware has admitted a Source linked to the target profile.
 * When: the caller unlinks it or requests global deletion.
 * Then: unlink removes only that profile's relations; deletion uses Knowledge.
 */
const listSources = jest.fn();
const deleteSource = jest.fn();
const deleteRelation = jest.fn();

jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  KnowledgeService: jest.fn().mockImplementation(() => ({
    listSources,
    deleteSource,
  })),
}));
jest.mock(
  "@sps/social/relations/profiles-to-knowledge-module-sources/sdk/server",
  () => ({
    api: { delete: deleteRelation },
  }),
);

import { Handler } from "./delete";

describe("chat-scoped Knowledge Source removal", () => {
  const source = { id: "source-1", content: "Human notes" };
  const findRelations = jest.fn();
  const service = {
    socialModule: {
      profilesToKnowledgeModuleSources: { find: findRelations },
    },
  } as any;
  function context(unlink: boolean) {
    return {
      req: {
        param: (name: string) =>
          ({
            knowledgeModuleSourceId: "source-1",
            targetSocialModuleProfileId: "target-profile",
          })[name],
        query: (name: string) =>
          name === "unlink" && unlink ? "true" : undefined,
      },
      json: jest.fn((body) => body),
    } as any;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    listSources.mockResolvedValue([source]);
    deleteSource.mockResolvedValue(source);
    findRelations.mockResolvedValue([{ id: "profile-source-link" }]);
  });

  it("unlinks only the target profile and preserves the Source", async () => {
    const c = context(true);
    await new Handler(service).execute(c, undefined);

    expect(findRelations).toHaveBeenCalledWith({
      params: {
        filters: {
          and: [
            { column: "profileId", method: "eq", value: "target-profile" },
            {
              column: "knowledgeModuleSourceId",
              method: "eq",
              value: "source-1",
            },
          ],
        },
      },
    });
    expect(deleteRelation).toHaveBeenCalledWith(
      expect.objectContaining({ id: "profile-source-link" }),
    );
    expect(deleteSource).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith({ data: source });
  });

  it("delegates global deletion without using the unlink path", async () => {
    await new Handler(service).execute(context(false), undefined);
    expect(deleteSource).toHaveBeenCalledWith("source-1");
    expect(findRelations).not.toHaveBeenCalled();
    expect(deleteRelation).not.toHaveBeenCalled();
  });
});
