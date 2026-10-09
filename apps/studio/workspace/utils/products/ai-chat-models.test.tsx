import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { projectProfileIdFromHref } from "./ai-chat-models";
import { aiChatAccount } from "./ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "./ai-chat-workspace-fixture";
import { createProjectProfile } from "./ai-chat-workspace";
import { AccountProvider } from "../../../modules/rbac/models/subject/singlepage/ai-chat-account/Account";
import { Component as SubjectAccount } from "../../../modules/rbac/models/subject/singlepage/ai-chat-account/index";
import { AIChatPreview } from "../../products/singlepage/ai-chat/website/Preview";

test("account menu renders the supplied profile and balance, with an empty fallback", () => {
  const html = renderToStaticMarkup(
    <AccountProvider account={aiChatAccount}>
      <SubjectAccount page="chat" />
    </AccountProvider>,
  );
  expect(html).toContain('data-profile-id="current-user"');
  expect(html).toContain("1,250 tokens");
  const empty = renderToStaticMarkup(
    <AccountProvider account={{ ...aiChatAccount, profile: undefined }}>
      <SubjectAccount page="chat" />
    </AccountProvider>,
  );
  expect(empty).toContain("User profile unavailable");
  expect(empty).not.toContain('data-profile-id="current-user"');
});

test("route IDs select profiles from the supplied examples", () => {
  expect(projectProfileIdFromHref("/ai-chat/projects/new")).toBeUndefined();
  expect(projectProfileIdFromHref("/ai-chat/projects/a%3Ab#documents")).toBe(
    "a:b",
  );
  expect(projectProfileIdFromHref("/ai-chat/projects/%bad")).toBe("%bad");
  const workspace = aiChatWorkspaceFixture();
  const foreign = createProjectProfile("foreign", "Foreign project");
  workspace.initialProjects.push(foreign);
  const html = renderToStaticMarkup(
    <AIChatPreview
      account={aiChatAccount}
      profiles={workspace}
      initialHref="/ai-chat/projects/foreign"
    />,
  );
  expect(html).not.toContain("Project profile unavailable");
  expect(html).toContain('data-profile-id="foreign"');
  expect(html).toContain("Foreign project");
  const ownHtml = renderToStaticMarkup(
    <AIChatPreview
      account={aiChatAccount}
      profiles={workspace}
      initialHref="/ai-chat/projects/pottery"
    />,
  );
  expect(ownHtml).toContain('data-ds-block="social.profile.ai-chat-project"');
  expect(ownHtml).toContain('data-profile-id="pottery"');
  expect(ownHtml).not.toContain("Project profile unavailable");
});
