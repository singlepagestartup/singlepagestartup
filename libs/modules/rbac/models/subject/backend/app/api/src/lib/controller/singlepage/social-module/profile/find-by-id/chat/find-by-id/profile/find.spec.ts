/**
 * BDD Suite: subject-scoped manageable AI profile discovery
 * Given: a subject-owned chat with connected social profiles and RBAC subjects.
 * When: the manageable profile collection is requested.
 * Then: only deterministic AI profiles linked to Agent subjects are returned.
 */
import { Handler } from "./find";

function context() {
  return {
    req: {
      param: (name: string) =>
        name === "socialModuleChatId" ? "chat-1" : undefined,
    },
    json: jest.fn((value) => value),
  } as any;
}

describe("Manageable AI profile discovery", () => {
  /**
   * BDD Scenario
   * Given: two AI profiles but only one is linked to an Agent subject.
   * When: the collection handler resolves the chat participants.
   * Then: it returns only the eligible profile and requests variant scoping.
   */
  it("When: eligibility differs Then: only Agent-backed AI profiles are returned", async () => {
    const service = {
      socialModule: {
        profilesToChats: {
          find: jest
            .fn()
            .mockResolvedValue([
              { profileId: "profile-1" },
              { profileId: "profile-2" },
            ]),
        },
        profile: {
          find: jest.fn().mockResolvedValue([
            { id: "profile-2", adminTitle: "Zulu" },
            { id: "profile-1", adminTitle: "Alpha" },
          ]),
        },
      },
      subjectsToSocialModuleProfiles: {
        find: jest.fn().mockResolvedValue([
          { subjectId: "agent-subject", socialModuleProfileId: "profile-2" },
          { subjectId: "user-subject", socialModuleProfileId: "profile-1" },
        ]),
      },
      find: jest
        .fn()
        .mockResolvedValue([{ id: "agent-subject", variant: "agent" }]),
    } as any;
    const c = context();

    await new Handler(service).execute(c);

    expect(service.socialModule.profile.find).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          filters: {
            and: expect.arrayContaining([
              {
                column: "variant",
                method: "eq",
                value: "artificial-intelligence",
              },
            ]),
          },
        }),
      }),
    );
    expect(c.json).toHaveBeenCalledWith({
      data: [{ id: "profile-2", adminTitle: "Zulu" }],
    });
  });
});
