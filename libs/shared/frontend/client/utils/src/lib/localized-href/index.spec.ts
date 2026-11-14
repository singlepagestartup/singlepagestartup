import { getLanguageSwitchHref, getLocalizedHref } from "./index";

describe("switching the current page language", () => {
  it.each([
    ["/en/framework", "ru", "/ru/framework"],
    ["/ru/framework/modules", "en", "/en/framework/modules"],
    ["/en", "ru", "/ru"],
    ["/ru/", "en", "/en/"],
    ["/framework", "en", "/en/framework"],
    [
      "/en/blog/en/intro%20post?tag=a&tag=b#details",
      "ru",
      "/ru/blog/en/intro%20post?tag=a&tag=b#details",
    ],
  ])("switches %s to %s", (path, language, expected) => {
    const location = new URL(path, "https://example.com");
    expect(getLanguageSwitchHref(location, language)).toBe(expected);
  });
});

describe("localized navigation", () => {
  it("keeps the current language when opening Help or a project action", () => {
    expect(getLocalizedHref("/en/ai-chat/settings", "/ai-chat/help")).toBe(
      "/en/ai-chat/help",
    );
    expect(
      getLocalizedHref(
        "/ru/ai-chat",
        "/ai-chat/social/profiles/p/chats/c/threads/create",
      ),
    ).toBe("/ru/ai-chat/social/profiles/p/chats/c/threads/create");
  });

  it("preserves a destination that already specifies its language", () => {
    expect(getLocalizedHref("/en/ai-chat", "/ru/ai-chat/help")).toBe(
      "/ru/ai-chat/help",
    );
  });

  it("preserves external links, fragments and paths without a current locale", () => {
    for (const href of [
      "https://singlepagestartup.com",
      "//example.com",
      "#workflow",
    ])
      expect(getLocalizedHref("/en/ai-chat", href)).toBe(href);
    expect(getLocalizedHref("/ai-chat", "/ai-chat/help")).toBe("/ai-chat/help");
  });
});
