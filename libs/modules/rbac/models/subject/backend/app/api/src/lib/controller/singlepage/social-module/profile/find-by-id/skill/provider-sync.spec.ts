/**
 * BDD Suite: RBAC profile skill provider sync.
 *
 * Given: social profiles link reusable social.skill records through profiles-to-skills.
 * When: provider sync is requested for a profile.
 * Then: only linked non-archived skills are uploaded and fresh provider references are stored in metadata.
 */

jest.mock("@sps/shared-utils", () => {
  return {
    OPEN_AI_API_KEY: "openai-key",
    ANTHROPIC_API_KEY: "anthropic-key",
  };
});

jest.mock("@sps/backend-utils", () => {
  return {
    getHttpErrorType: (error: Error) => {
      return {
        status: 400,
        message: error.message,
        details: null,
      };
    },
  };
});

import { Handler } from "./provider-sync";
import {
  buildProviderSkillBundle,
  isFreshProviderSkillReference,
  putProviderSkillReference,
} from "./provider-skills";

const activeSkill = {
  id: "skill-1",
  slug: "brief-writer",
  title: "Brief Writer",
  description: "Write a concise product brief.",
  status: "published",
  metadata: {},
};

function createContext(body: Record<string, unknown> = {}) {
  return {
    req: {
      param: (name: string) => {
        return {
          id: "subject-1",
          socialModuleProfileId: "profile-1",
        }[name];
      },
      json: jest.fn().mockResolvedValue(body),
    },
    json: jest.fn((payload: unknown) => payload),
  } as any;
}

function createService(skills: any[] = [activeSkill]) {
  const localSkills = skills.map((skill) => {
    return {
      ...skill,
      metadata: skill.metadata
        ? JSON.parse(JSON.stringify(skill.metadata))
        : {},
    };
  });

  return {
    socialModule: {
      profile: {
        findById: jest.fn().mockResolvedValue({
          id: "profile-1",
        }),
      },
      profilesToSkills: {
        find: jest.fn().mockResolvedValue(
          localSkills.map((skill) => {
            return {
              profileId: "profile-1",
              skillId: skill.id,
            };
          }),
        ),
      },
      skill: {
        find: jest.fn().mockResolvedValue(localSkills),
        update: jest.fn().mockImplementation(async ({ data }) => data),
      },
    },
  } as any;
}

function createFetchResponse(id: string, version = "latest") {
  return new Response(JSON.stringify({ id, version }), { status: 200 });
}

describe("Given: RBAC profile skill provider sync", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * BDD Scenario
   * Given: a linked active social skill has no provider metadata.
   * When: the profile is synced to OpenAI.
   * Then: the skill bundle is uploaded and providerSkills.openai is stored.
   */
  it("When: an active linked skill is synced Then: provider metadata is stored", async () => {
    const service = createService();
    const fetcher = jest
      .fn()
      .mockResolvedValue(createFetchResponse("skill_openai_1", "v1"));
    const handler = new Handler(service, { fetcher });

    const response = await handler.execute(
      createContext({ providers: ["openai"] }),
      jest.fn(),
    );

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.openai.com/v1/skills",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer openai-key",
        }),
      }),
    );
    expect(service.socialModule.skill.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "skill-1",
        data: expect.objectContaining({
          metadata: expect.objectContaining({
            providerSkills: expect.objectContaining({
              openai: expect.objectContaining({
                provider: "openai",
                providerSkillId: "skill_openai_1",
                version: "v1",
                sourceSkillId: "skill-1",
                sourceSkillSlug: "brief-writer",
              }),
            }),
          }),
        }),
      }),
    );
    expect(response).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          synced: [
            expect.objectContaining({
              provider: "openai",
              status: "synced",
            }),
          ],
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a linked skill already has a fresh provider reference.
   * When: provider sync runs without force.
   * Then: the handler reuses the reference and does not upload the bundle.
   */
  it("When: provider metadata is fresh Then: it skips upload", async () => {
    const bundle = buildProviderSkillBundle(activeSkill as any);
    const skill = {
      ...activeSkill,
      metadata: putProviderSkillReference({
        skill: activeSkill as any,
        reference: {
          provider: "openai",
          providerSkillId: "skill_openai_existing",
          version: "v1",
          name: bundle.name,
          sourceSkillId: activeSkill.id,
          sourceSkillSlug: activeSkill.slug,
          contentHash: bundle.contentHash,
          syncedAt: "2026-06-04T00:00:00.000Z",
        },
      }),
    };
    const service = createService([skill]);
    const fetcher = jest.fn();
    const handler = new Handler(service, { fetcher });

    const response = await handler.execute(
      createContext({ providers: ["openai"] }),
      jest.fn(),
    );

    expect(fetcher).not.toHaveBeenCalled();
    expect(service.socialModule.skill.update).not.toHaveBeenCalled();
    expect(response).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          synced: [
            expect.objectContaining({
              provider: "openai",
              status: "unchanged",
              reference: expect.objectContaining({
                providerSkillId: "skill_openai_existing",
              }),
            }),
          ],
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a linked skill has provider metadata for older content.
   * When: freshness is checked against the current bundle.
   * Then: the stale reference is not accepted.
   */
  it("When: provider metadata hash is stale Then: freshness check fails", () => {
    const bundle = buildProviderSkillBundle(activeSkill as any);
    const skill = {
      ...activeSkill,
      metadata: putProviderSkillReference({
        skill: activeSkill as any,
        reference: {
          provider: "openai",
          providerSkillId: "skill_openai_old",
          version: "v1",
          name: bundle.name,
          sourceSkillId: activeSkill.id,
          sourceSkillSlug: activeSkill.slug,
          contentHash: "old-hash",
          syncedAt: "2026-06-04T00:00:00.000Z",
        },
      }),
    };

    expect(
      isFreshProviderSkillReference({
        skill: skill as any,
        provider: "openai",
        bundle,
      }),
    ).toBe(false);
  });

  /**
   * BDD Scenario
   * Given: a profile has both active and archived skills linked.
   * When: provider sync runs.
   * Then: archived skills are skipped instead of uploaded.
   */
  it("When: archived skills are linked Then: they are skipped", async () => {
    const archivedSkill = {
      ...activeSkill,
      id: "skill-archived",
      slug: "archived-skill",
      status: "archived",
    };
    const service = createService([activeSkill, archivedSkill]);
    const fetcher = jest
      .fn()
      .mockResolvedValue(createFetchResponse("skill_openai_1", "v1"));
    const handler = new Handler(service, { fetcher });

    const response = await handler.execute(
      createContext({ providers: ["openai"] }),
      jest.fn(),
    );

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(response).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          skipped: [
            {
              skillId: "skill-archived",
              skillSlug: "archived-skill",
              reason: "archived",
            },
          ],
        }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: a request names a skill that is not linked to the profile.
   * When: provider sync runs.
   * Then: the handler rejects before uploading anything.
   */
  it("When: an unlinked skill is requested Then: it rejects before upload", async () => {
    const service = createService([activeSkill]);
    const fetcher = jest.fn();
    const handler = new Handler(service, { fetcher });

    await expect(
      handler.execute(
        createContext({
          providers: ["openai"],
          skillIds: ["skill-unlinked"],
        }),
        jest.fn(),
      ),
    ).rejects.toThrow("not linked to profile");

    expect(fetcher).not.toHaveBeenCalled();
  });
});
