import { renderToStaticMarkup } from "react-dom/server";
import { Component } from "./Component";
it("renders participants from the authorized parent response without relation/profile readers", () => {
  const html = renderToStaticMarkup(
    <Component
      {...({
        variant: "social-module-profile-chat-default",
        language: "en",
        data: { id: "subject" },
        socialModuleProfile: { id: "self" },
        socialModuleChatId: "chat",
        socialModuleChat: {
          id: "chat",
          createdAt: "2026-01-01",
          title: "Shared QA",
          participants: [
            { id: "self", title: { en: "Alice" } },
            { id: "peer", title: { en: "Bob" } },
          ],
        },
      } as any)}
    />,
  );
  expect(html).toContain("Shared QA");
  expect(html).toContain("Bob");
  expect(html).not.toContain("Alice");
});
it("keeps a chat visible when an older API has not supplied the optional projection", () => {
  const html = renderToStaticMarkup(
    <Component
      {...({
        variant: "social-module-profile-chat-default",
        language: "en",
        data: { id: "subject" },
        socialModuleProfile: { id: "self" },
        socialModuleChatId: "chat",
        socialModuleChat: {
          id: "chat",
          createdAt: "2026-01-01",
          title: "Shared QA",
        },
      } as any)}
    />,
  );
  expect(html).toContain("Shared QA");
  expect(html).toContain('href="/en/social/chats/chat"');
});
