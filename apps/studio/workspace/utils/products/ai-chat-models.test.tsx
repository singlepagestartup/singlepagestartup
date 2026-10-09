import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  findLocalRelations,
  linkProjectProfile,
  projectProfilesForUser,
  projectKnowledge,
  projectProfileIdFromHref,
} from "./ai-chat-models";
import { aiChatAccount } from "./ai-chat-account-fixture";
import {
  aiChatProjectFixture,
  aiChatWorkspaceFixture,
} from "./ai-chat-workspace-fixture";
import { createProjectProfile } from "./ai-chat-workspace";
import { AccountProvider } from "../../../modules/rbac/models/subject/singlepage/ai-chat-settings/Account";
import { SubjectAccount } from "../../../modules/rbac/models/subject/singlepage/ai-chat-account/View";
import Page from "../../../modules/host/models/page/singlepage/ai-chat/View";

test("account menu resolves only the current subject's user profile", () => {
  const account = {
    ...aiChatAccount,
    profiles: [
      { id: "other", title: "Other user", variant: "ai-chat-user" as const },
      ...aiChatAccount.profiles,
    ],
    subjectsToProfiles: [
      {
        id: "other-link",
        subjectId: "other-subject",
        socialModuleProfileId: "other",
      },
      ...aiChatAccount.subjectsToProfiles,
    ],
  };
  const html = renderToStaticMarkup(
    <AccountProvider account={account}>
      <SubjectAccount page="chat" />
    </AccountProvider>,
  );
  expect(html).toContain('data-profile-id="current-user"');
  expect(html).toContain("1,250 tokens");
  expect(html).not.toContain("Other user");
  for (const unavailable of [
    { ...account, subject: undefined },
    { ...account, subjectsToProfiles: [] },
    { ...account, subject: { id: "missing-subject" } },
  ]) {
    const result = renderToStaticMarkup(
      <AccountProvider account={unavailable}>
        <SubjectAccount page="chat" />
      </AccountProvider>,
    );
    expect(result).toContain("User profile unavailable");
    expect(result).not.toContain('data-profile-id="current-user"');
  }
});

test("projects require user participation, a project chat and a project profile variant", () => {
  const own = createProjectProfile("own", "My project");
  const other = createProjectProfile("other", "Other project");
  const missing = createProjectProfile("missing", "Unlinked project");
  let links = linkProjectProfile(
    { chats: [], profilesToChats: [] },
    "current-user",
    own,
  );
  links = linkProjectProfile(links, "other-user", other);
  expect(
    projectProfilesForUser("current-user", [other, own, missing], links).map(
      (p) => p.id,
    ),
  ).toEqual(["own"]);
  expect(projectProfilesForUser("missing-user", [own, other], links)).toEqual(
    [],
  );
  expect(
    projectProfilesForUser("current-user", [own], {
      ...links,
      chats: links.chats.map((chat) => ({ ...chat, variant: "ai-chat-work" })),
    }),
  ).toEqual([]);
  expect(
    projectProfilesForUser(
      "current-user",
      [{ ...own, variant: "ai-chat-user" } as unknown as typeof own],
      links,
    ),
  ).toEqual([]);
  expect(
    projectProfilesForUser("current-user", [own], { ...links, chats: [] }),
  ).toEqual([]);
});

test("source sections and navigation belong to the selected project profile", () => {
  const project = aiChatProjectFixture();
  const knowledge = projectKnowledge(project);
  expect(knowledge.sources.length).toBe(
    project.documents.reduce(
      (count, document) => count + document.sections.length,
      0,
    ),
  );
  const customers = knowledge.sources.find(
    (source) => source.title === "Customers and value",
  )!;
  expect(
    knowledge.bundles.find((bundle) => bundle.id === "brief")?.sourceIds,
  ).toContain(customers.id);
  expect(customers).not.toHaveProperty("documentId");
  expect(
    knowledge.relations.every((relation) => relation.profileId === project.id),
  ).toBe(true);
  expect(
    knowledge.relations.some(
      (relation) => relation.knowledgeModuleSourceId === customers.id,
    ),
  ).toBe(true);
  const second = projectKnowledge({ ...project, id: "second" });
  expect(
    second.sources.some((source) =>
      knowledge.sources.some((first) => first.id === source.id),
    ),
  ).toBe(false);
  expect(
    findLocalRelations({
      variant: "find",
      data: [...knowledge.relations, ...second.relations],
      apiProps: {
        params: {
          filters: {
            and: [{ column: "profileId", method: "eq", value: project.id }],
          },
        },
      },
    }),
  ).toEqual(knowledge.relations);
  expect(
    findLocalRelations({
      variant: "find",
      data: knowledge.relations,
      apiProps: { params: { filters: { and: [] } } },
    }),
  ).toEqual([]);
});

test("route IDs select profiles without falling back to an unrelated project", () => {
  expect(projectProfileIdFromHref("/ai-chat/projects/new")).toBeUndefined();
  expect(projectProfileIdFromHref("/ai-chat/projects/a%3Ab#documents")).toBe(
    "a:b",
  );
  expect(projectProfileIdFromHref("/ai-chat/projects/%bad")).toBe("%bad");
  const workspace = aiChatWorkspaceFixture();
  const foreign = createProjectProfile("foreign", "Foreign project");
  workspace.initialProjects.push(foreign);
  const html = renderToStaticMarkup(
    <Page
      account={aiChatAccount}
      workspace={workspace}
      url="/ai-chat/projects/foreign"
      onNavigate={() => {}}
    />,
  );
  expect(html).toContain("Project profile unavailable");
  expect(html).not.toContain('data-profile-id="foreign"');
  expect(html).not.toContain("Foreign project");
  const ownHtml = renderToStaticMarkup(
    <Page
      account={aiChatAccount}
      workspace={workspace}
      url="/ai-chat/projects/pottery"
      onNavigate={() => {}}
    />,
  );
  expect(ownHtml).toContain('data-ds-block="social.profile.ai-chat-project"');
  expect(ownHtml).toContain('data-profile-id="pottery"');
  expect(ownHtml).not.toContain("Project profile unavailable");
});
