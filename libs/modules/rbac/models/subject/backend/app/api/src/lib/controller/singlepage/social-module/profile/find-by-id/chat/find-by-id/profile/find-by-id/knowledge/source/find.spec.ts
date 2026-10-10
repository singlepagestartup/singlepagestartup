/**
 * BDD Suite: subject-scoped Knowledge Source pagination
 * Given: ordered profile-source relations.
 * When: a bounded Knowledge page is requested.
 * Then: pagination is applied before source hydration.
 */
jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  KnowledgeService: jest.fn().mockImplementation(() => ({
    listSources: jest.fn().mockResolvedValue([{ id: "source-2" }]),
  })),
}));

import { Handler } from "./find";

describe("Knowledge Source find", () => {
  /**
   * BDD Scenario
   * Given: a requested middle page.
   * When: the handler finds linked sources.
   * Then: it passes limit and offset to the relation boundary.
   */
  it("When: pagination is present Then: relation lookup is bounded", async () => {
    const relationsFind = jest
      .fn()
      .mockResolvedValue([{ knowledgeModuleSourceId: "source-2" }]);
    const service = {
      socialModule: {
        profilesToKnowledgeModuleSources: { find: relationsFind },
      },
    } as any;
    const c = {
      req: {
        param: () => "profile-1",
        query: (name: string) => ({ limit: "3", offset: "6" })[name],
      },
      json: jest.fn((value) => value),
    } as any;

    await new Handler(service).execute(c, undefined);

    expect(relationsFind).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ limit: 3, offset: 6 }),
      }),
    );
    expect(c.json).toHaveBeenCalledWith({ data: [{ id: "source-2" }] });
  });
});
