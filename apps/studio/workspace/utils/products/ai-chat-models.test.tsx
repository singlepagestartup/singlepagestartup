import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { projectProfileIdFromHref } from "./ai-chat-models";
import { aiChatAccount } from "./ai-chat-account-fixture";
import { aiChatWorkspaceFixture } from "./ai-chat-workspace-fixture";
import { createProjectProfile } from "./ai-chat-workspace";
import { AIChatPreview } from "../../products/singlepage/ai-chat/website/Preview";
import { resolveAIChatRoute as resolvePreviewRoute } from "../../products/singlepage/ai-chat/website/Preview/components/host/layout/singlepage/ai-chat-landing/routes";
import {
  aiChatProfileHref,
  aiChatServiceHrefs,
  aiChatThreadCreateHref,
  resolveAIChatRoute,
} from "./ai-chat-routes";

test("AI Chat service routes identify Social Profiles and RBAC Subjects", () => {
  for (const href of ["/", "/?from=framework", "/ai-chat/"]) {
    expect(resolveAIChatRoute(href)).toEqual({ page: "landing" });
    expect(resolvePreviewRoute(href)).toEqual({ page: "landing" });
  }
  for (const [page, href] of Object.entries(aiChatServiceHrefs)) {
    const expected = { page: page as keyof typeof aiChatServiceHrefs };
    expect(resolveAIChatRoute(href)).toEqual(expected);
    expect(
      resolveAIChatRoute(`${href.replace(/\/$/, "")}/?preview=1#form`),
    ).toEqual(expected);
  }
});

test("nested thread routes preserve independently encoded profile and chat IDs", () => {
  const profileId = "profile/a:b";
  const chatId = "chat/x:y";
  expect(
    resolveAIChatRoute(`${aiChatProfileHref(profileId)}/settings`),
  ).toEqual({
    page: "profile-settings",
    profileId,
  });
  const href = aiChatThreadCreateHref(profileId, chatId);
  expect(href).toContain("profile%2Fa%3Ab/chats/chat%2Fx%3Ay/threads/create");
  expect(resolveAIChatRoute(`${href}?preview=1#agent`)).toEqual({
    page: "thread-create",
    profileId,
    chatId,
  });
  const profiles = {
    initialProjects: [createProjectProfile(profileId, "Encoded profile")],
  };
  const html = renderToStaticMarkup(
    <AIChatPreview profiles={profiles} initialHref={href} />,
  );
  expect(html).toContain('data-profile-id="profile/a:b"');
  expect(html).toContain(
    'data-ds-block="social.thread.create-ai-chat" data-chat-id="chat/x:y"',
  );
  expect(html).toContain(`href="${href}"`);
  expect(html).toContain(`href="${aiChatProfileHref(profileId)}"`);
});

test("AI Chat routing rejects incomplete hierarchies and malformed IDs", () => {
  for (const href of [
    "/ai-chat/projects/pottery",
    "/ai-chat/register",
    "/ai-chat/social/profiles/pottery/threads/create",
    "/ai-chat/social/profiles/pottery/chats/threads/create",
    "/ai-chat/social/profiles/pottery/chats/chat/threads/new",
    "/ai-chat/social/profiles/%bad",
    "/ai-chat/social/profiles/pottery/chats/%bad/threads/create",
    "/ai-chat/social/profiles/%63reate/settings",
  ])
    expect(resolveAIChatRoute(href)).toBeUndefined();
});

test("every AI Chat page renders navigation to registered preview routes", () => {
  for (const href of [
    ...Object.values(aiChatServiceHrefs),
    aiChatProfileHref("pottery"),
    `${aiChatProfileHref("pottery")}/settings`,
    aiChatThreadCreateHref("pottery"),
  ]) {
    const html = renderToStaticMarkup(<AIChatPreview initialHref={href} />);
    expect(html).not.toContain("Page unavailable.");
    for (const [, target] of html.matchAll(/<a[^>]*href="(\/ai-chat[^\"]*)"/g))
      expect(resolveAIChatRoute(target)).toBeDefined();
  }
});

test("account service links return to the supplied profile scope", () => {
  const href = aiChatProfileHref("client/a:b");
  const profiles = {
    initialProjects: [createProjectProfile("client/a:b", "Client profile")],
  };
  for (const initialHref of [
    aiChatServiceHrefs.tokens,
    aiChatServiceHrefs.help,
  ]) {
    const html = renderToStaticMarkup(
      <AIChatPreview initialHref={initialHref} profiles={profiles} />,
    );
    expect(html).toContain(`href="${href}"`);
    expect(html).not.toContain('href="/ai-chat/social/profiles/example"');
  }
  const registration = renderToStaticMarkup(
    <AIChatPreview initialHref={aiChatServiceHrefs.register} />,
  );
  expect(registration).toContain(
    'href="/ai-chat/social/profiles/create#how-your-materials-are-processed-and-stored"',
  );
  expect(registration).not.toContain(
    'href="/ai-chat/social/profiles/example#how-your-materials-are-processed-and-stored"',
  );
});

test("route IDs select profiles from the supplied examples", () => {
  expect(
    projectProfileIdFromHref("/ai-chat/social/profiles/create"),
  ).toBeUndefined();
  expect(
    projectProfileIdFromHref("/ai-chat/social/profiles/a%3Ab#documents"),
  ).toBe("a:b");
  expect(
    projectProfileIdFromHref("/ai-chat/social/profiles/%bad"),
  ).toBeUndefined();
  const workspace = aiChatWorkspaceFixture();
  const foreign = createProjectProfile("foreign", "Foreign project");
  workspace.initialProjects.push(foreign);
  const html = renderToStaticMarkup(
    <AIChatPreview
      account={aiChatAccount}
      profiles={workspace}
      initialHref="/ai-chat/social/profiles/foreign"
    />,
  );
  expect(html).not.toContain("Project profile unavailable");
  expect(html).toContain('data-profile-id="foreign"');
  expect(html).toContain("Foreign project");
  const ownHtml = renderToStaticMarkup(
    <AIChatPreview
      account={aiChatAccount}
      profiles={workspace}
      initialHref="/ai-chat/social/profiles/pottery"
    />,
  );
  expect(ownHtml).toContain(
    'data-ds-block="social.profile.scope-ai-chat-project"',
  );
  expect(ownHtml).toContain('data-profile-id="pottery"');
  expect(ownHtml).not.toContain("Project profile unavailable");
});
