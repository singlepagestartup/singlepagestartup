jest.mock("@sps/knowledge/backend/app/api/src/lib/service", () => ({
  Service: jest.fn().mockImplementation(() => ({
    listSources: jest.fn().mockResolvedValue([{ id: "source-2" }]),
  })),
}));

import { Handler } from "./find";
import { findProfileKnowledgeSourceIds } from "./helpers";

describe("Knowledge Source find", () => {
  it("does not create an owner grant from shared Chat membership", async () => {
    const service = {
      socialModuleProfileKnowledgeAccessEnsure: jest.fn(),
      modules: {
        social: {
          profilesToKnowledgeModuleSources: {
            find: jest.fn().mockResolvedValue([]),
          },
        },
      },
      module: {
        subjectsToSocialModuleProfiles: {
          find: jest.fn().mockResolvedValue([]),
        },
      },
    } as any;
    const c = {
      req: {
        param: (name: string) =>
          name === "id" ? "viewer" : "shared-assistant",
        query: () => undefined,
      },
      json: jest.fn((value) => value),
      get: jest.fn(),
    } as any;
    await new Handler(service).execute(c, undefined);
    expect(
      service.socialModuleProfileKnowledgeAccessEnsure,
    ).not.toHaveBeenCalled();
    expect(
      service.module.subjectsToSocialModuleProfiles.find,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        params: {
          filters: {
            and: [
              { column: "subjectId", method: "eq", value: "viewer" },
              {
                column: "socialModuleProfileId",
                method: "eq",
                value: "shared-assistant",
              },
              { column: "variant", method: "eq", value: "assistant" },
            ],
          },
        },
      }),
    );
  });
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
      socialModuleProfileKnowledgeAccessEnsure: jest.fn(),
      modules: {
        social: {
          profilesToKnowledgeModuleSources: { find: relationsFind },
        },
      },
      module: {
        subjectsToSocialModuleProfiles: {
          find: jest.fn().mockResolvedValue([{ variant: "assistant" }]),
        },
      },
    } as any;
    const c = {
      req: {
        param: () => "profile-1",
        query: (name: string) => ({ limit: "3", offset: "6" })[name],
      },
      json: jest.fn((value) => value),
      get: jest.fn(),
    } as any;

    await new Handler(service).execute(c, undefined);

    expect(relationsFind).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ limit: 3, offset: 6 }),
      }),
    );
    expect(c.json).toHaveBeenCalledWith({ data: [{ id: "source-2" }] });
    expect(
      service.socialModuleProfileKnowledgeAccessEnsure,
    ).toHaveBeenCalledWith({
      ownerRbacSubjectId: "profile-1",
      socialModuleProfileId: "profile-1",
    });
  });
});

it("keeps the employee sidebar within its store and ignores offer and project sources", async () => {
  const service = {
    modules: {
      social: {
        profilesToKnowledgeModuleSources: {
          find: jest.fn().mockResolvedValue([
            { knowledgeModuleSourceId: "employee", storeId: "store" },
            { knowledgeModuleSourceId: "legacy" },
            { knowledgeModuleSourceId: "other", storeId: "other-store" },
            {
              knowledgeModuleSourceId: "specific-offer",
              storeId: "store",
              offerId: "offer",
            },
            {
              knowledgeModuleSourceId: "specific-project",
              storeId: "store",
              projectId: "project",
            },
          ]),
        },
      },
    },
  } as never;
  await expect(
    findProfileKnowledgeSourceIds({
      service,
      targetSocialModuleProfileId: "employee-profile",
      storeId: "store",
    }),
  ).resolves.toEqual(["employee", "legacy"]);
});
