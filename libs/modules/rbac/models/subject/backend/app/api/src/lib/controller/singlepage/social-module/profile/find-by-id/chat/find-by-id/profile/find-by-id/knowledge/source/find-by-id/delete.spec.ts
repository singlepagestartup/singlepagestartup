const listSources = jest.fn();
const deleteSource = jest.fn();
const deleteRelation = jest.fn();

jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  Service: jest.fn().mockImplementation(() => ({
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
    modules: {
      social: {
        profilesToKnowledgeModuleSources: { find: findRelations },
      },
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

  it("rejects a legacy unlink request without escalating it to deletion", async () => {
    await expect(
      new Handler(service).execute(context(true), undefined),
    ).rejects.toThrow();
    expect(deleteRelation).not.toHaveBeenCalled();
    expect(deleteSource).not.toHaveBeenCalled();
  });

  it("delegates global deletion without using the unlink path", async () => {
    await new Handler(service).execute(context(false), undefined);
    expect(deleteSource).toHaveBeenCalledWith("source-1");
    expect(findRelations).not.toHaveBeenCalled();
    expect(deleteRelation).not.toHaveBeenCalled();
  });
});
