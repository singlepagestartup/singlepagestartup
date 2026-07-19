/**
 * BDD Suite: RBAC chat assistant management SDK routes
 * Given: a sender subject, sender profile, chat, and target AI profile.
 * When: management actions build HTTP requests.
 * Then: they remain subject/chat/target scoped and preserve pagination.
 */
import { action as findProfiles } from "./find";
import { action as findSkills } from "./find-by-id/skill/find";
import { action as findAvailableSkills } from "./find-by-id/skill/available";
import { action as linkSkill } from "./find-by-id/skill/link";
import { action as unlinkSkill } from "./find-by-id/skill/unlink";
import { action as findDocuments } from "./find-by-id/knowledge/document/find";

const common = {
  host: "http://api.test",
  id: "subject-1",
  socialModuleProfileId: "sender-profile",
  socialModuleChatId: "chat-1",
};
const target = { ...common, targetSocialModuleProfileId: "assistant-profile" };

describe("chat assistant management SDK", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation(async () => {
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as any;
  });

  /**
   * BDD Scenario
   * Given: the sender has not selected a target profile.
   * When: manageable profiles are requested.
   * Then: the collection route contains the sender subject/profile/chat scope.
   */
  it("When: profiles are discovered Then: collection route is scoped", async () => {
    await findProfiles(common);

    expect(global.fetch).toHaveBeenCalledWith(
      "http://api.test/api/rbac/subjects/subject-1/social-module/profiles/sender-profile/chats/chat-1/profiles",
      expect.objectContaining({ method: "GET" }),
    );
  });

  /**
   * BDD Scenario
   * Given: linked, available, and Knowledge lists.
   * When: Agent requests bounded pages.
   * Then: limit/offset/search are encoded without changing the response shape.
   */
  it("When: bounded pages are requested Then: pagination query is preserved", async () => {
    await findSkills({ ...target, limit: 7, offset: 6 });
    await findAvailableSkills({
      ...target,
      limit: 7,
      offset: 12,
      search: "web search",
    });
    await findDocuments({ ...target, limit: 7, offset: 18 });

    expect((global.fetch as jest.Mock).mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining("/skills?limit=7&offset=6"),
      expect.stringContaining(
        "/skills/available?limit=7&offset=12&search=web+search",
      ),
      expect.stringContaining("/knowledge/documents?limit=7&offset=18"),
    ]);
  });

  /**
   * BDD Scenario
   * Given: an existing global skill.
   * When: Agent links and then unlinks it.
   * Then: SDK uses relation-specific POST and DELETE methods on one scoped URL.
   */
  it("When: existing skill relation changes Then: POST and DELETE are used", async () => {
    const props = { ...target, socialModuleSkillId: "skill-1" };
    await linkSkill(props);
    await unlinkSkill(props);

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls[0]).toEqual([
      expect.stringContaining("/skills/skill-1"),
      expect.objectContaining({ method: "POST" }),
    ]);
    expect(calls[1]).toEqual([
      expect.stringContaining("/skills/skill-1"),
      expect.objectContaining({ method: "DELETE" }),
    ]);
  });
});
