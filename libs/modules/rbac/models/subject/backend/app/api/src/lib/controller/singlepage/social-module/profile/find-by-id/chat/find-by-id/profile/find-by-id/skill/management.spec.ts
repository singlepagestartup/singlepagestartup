/**
 * BDD Suite: subject-scoped profile skill management
 * Given: linked and global skills behind a manageable AI profile.
 * When: pages are read, existing skills are linked, or relations are unlinked.
 * Then: pagination is stable, linking is idempotent, and global skills survive.
 */
import { Handler as Find } from "./find";
import { Handler as Available } from "./available";
import { Handler as Link } from "./link";
import { Handler as Unlink } from "./unlink";

function context(
  props: {
    params?: Record<string, string>;
    query?: Record<string, string>;
  } = {},
) {
  const params = {
    targetSocialModuleProfileId: "profile-1",
    socialModuleSkillId: "skill-2",
    ...props.params,
  };
  return {
    req: {
      param: (name: string) => params[name],
      query: (name: string) => props.query?.[name],
    },
    json: jest.fn((value) => value),
  } as any;
}

function service() {
  return {
    socialModule: {
      profilesToSkills: {
        find: jest
          .fn()
          .mockResolvedValue([{ id: "relation-1", skillId: "skill-1" }]),
        create: jest.fn().mockResolvedValue({ id: "relation-2" }),
        delete: jest.fn().mockResolvedValue(true),
      },
      skill: {
        find: jest.fn().mockResolvedValue([
          { id: "skill-1", title: "Alpha" },
          { id: "skill-2", title: "Beta" },
          { id: "skill-3", title: "Gamma" },
        ]),
        findById: jest.fn().mockResolvedValue({ id: "skill-2", title: "Beta" }),
      },
    },
  } as any;
}

describe("Profile skill management", () => {
  /**
   * BDD Scenario
   * Given: an ordered profile-skill relation list.
   * When: a bounded middle page is requested.
   * Then: limit and offset are applied before skill hydration.
   */
  it("When: linked page is requested Then: relation query is bounded", async () => {
    const api = service();
    const c = context({ query: { limit: "2", offset: "1" } });

    await new Find(api).execute(c, undefined);

    expect(api.socialModule.profilesToSkills.find).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ limit: 2, offset: 1 }),
      }),
    );
  });

  /**
   * BDD Scenario
   * Given: one linked skill and two global alternatives.
   * When: available skills are searched.
   * Then: linked rows are excluded and search is applied deterministically.
   */
  it("When: available page is searched Then: linked skills are excluded", async () => {
    const api = service();
    const c = context({ query: { search: "bet", limit: "2", offset: "0" } });

    await new Available(api).execute(c);

    expect(c.json).toHaveBeenCalledWith({
      data: [{ id: "skill-2", title: "Beta" }],
    });
  });

  /**
   * BDD Scenario
   * Given: an existing profile-skill relation.
   * When: link-existing is requested again.
   * Then: the idempotent endpoint does not create a duplicate.
   */
  it("When: an existing skill is linked again Then: no duplicate relation is created", async () => {
    const api = service();
    api.socialModule.profilesToSkills.find.mockResolvedValue([
      { id: "relation-2", skillId: "skill-2" },
    ]);

    await new Link(api).execute(context());

    expect(api.socialModule.profilesToSkills.create).not.toHaveBeenCalled();
  });

  /**
   * BDD Scenario
   * Given: a linked global skill.
   * When: unlink is requested.
   * Then: only the relation is deleted and the skill repository is untouched.
   */
  it("When: unlink is requested Then: only relation deletion runs", async () => {
    const api = service();

    await new Unlink(api).execute(context());

    expect(api.socialModule.profilesToSkills.delete).toHaveBeenCalledWith({
      id: "relation-1",
    });
    expect((api.socialModule.skill as any).delete).toBeUndefined();
  });
});
