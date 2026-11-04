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
            { id: "self", slug: "alice" },
            { id: "peer", slug: "bob" },
          ],
        },
      } as any)}
    />,
  );
  expect(html).toContain("Shared QA");
  expect(html).toContain("alice");
  expect(html).toContain("bob");
  expect(html).not.toContain("Participant details unavailable");
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
  expect(html).toContain("Participant details unavailable");
});
