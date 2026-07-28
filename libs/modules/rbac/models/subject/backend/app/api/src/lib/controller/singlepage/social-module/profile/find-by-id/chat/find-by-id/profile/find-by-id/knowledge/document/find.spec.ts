/**
 * BDD Suite: subject-scoped Knowledge document pagination
 * Given: ordered profile-document relations.
 * When: a bounded Knowledge page is requested.
 * Then: pagination is applied before document hydration.
 */
jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  KnowledgeService: jest.fn().mockImplementation(() => ({
    listDocuments: jest.fn().mockResolvedValue([{ id: "document-2" }]),
  })),
}));

import { Handler } from "./find";

describe("Knowledge document find", () => {
  /**
   * BDD Scenario
   * Given: a requested middle page.
   * When: the handler finds linked documents.
   * Then: it passes limit and offset to the relation boundary.
   */
  it("When: pagination is present Then: relation lookup is bounded", async () => {
    const relationsFind = jest
      .fn()
      .mockResolvedValue([{ knowledgeModuleDocumentId: "document-2" }]);
    const service = {
      socialModule: {
        profilesToKnowledgeModuleDocuments: { find: relationsFind },
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
    expect(c.json).toHaveBeenCalledWith({ data: [{ id: "document-2" }] });
  });
});
