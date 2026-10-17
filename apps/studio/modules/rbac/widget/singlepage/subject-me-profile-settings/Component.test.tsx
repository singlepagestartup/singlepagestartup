import { afterEach, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Widget } from "../../index";
import { Component as Subject } from "../../../subject";
import { AccountProvider } from "../../../subject/singlepage/me/account/Account";
import { aiChatAccount } from "../../../subject/singlepage/me/account/fixture";
const originalWindow = globalThis.window;
afterEach(() => {
  if (originalWindow) globalThis.window = originalWindow;
  else Reflect.deleteProperty(globalThis, "window");
});

test("profile settings retain the requested profile and refuse an unavailable ID", () => {
  const profile = {
    id: "maker",
    title: "Sam",
    subtitle: "Maker",
    description: "Pottery workshops",
    slug: "sam",
  };
  const html = renderToStaticMarkup(
    <AccountProvider account={aiChatAccount}>
      <Subject
        variant="me-social-module-profile-id-settings-ai-chat"
        profileId="maker"
        profile={profile}
      />
    </AccountProvider>,
  );
  expect(html).toContain('data-profile-id="maker"');
  expect(html).toContain('value="Sam"');
  expect(html).not.toContain('value="Alex"');
  const unavailable = renderToStaticMarkup(
    <AccountProvider account={aiChatAccount}>
      <Subject
        variant="me-social-module-profile-id-settings-ai-chat"
        profileId="missing"
      />
    </AccountProvider>,
  );
  expect(unavailable).toContain("Profile unavailable in this preview.");
  expect(unavailable).not.toContain("Save profile");
});

test("website and AI Chat settings share current-user profile, methods and data controls", () => {
  for (const showTokens of [false, true]) {
    const html = renderToStaticMarkup(
      <AccountProvider account={aiChatAccount}>
        <Widget variant="subject-me-profile-settings" showTokens={showTokens} />
      </AccountProvider>,
    );
    expect(html).toContain(
      'data-ds-block="rbac.widget.subject-me-profile-settings"',
    );
    expect(html).toContain('data-profile-id="current-user"');
    expect(html).toContain('value="Alex"');
    expect(html).toContain('value="alex"');
    expect(html).toContain("singlepagestartup-account-mascot-square.png");
    expect(html).not.toContain("images.unsplash.com");
    expect(html).toContain("Choose image");
    expect(html).toContain("Change email");
    expect(html).toContain("Change password");
    expect(html).toContain("Add sign-in method");
    expect(html).toContain("View purchases and receipts");
    expect(html).toContain("Delete account and project data");
    expect(html).toContain("When a change cannot be saved");
    expect(html).not.toContain('name="current-password"');
    expect(html).not.toContain("Change avatar");
    expect(html.includes("Buy tokens")).toBe(showTokens);
  }
});

test("profile fields come from the supplied example even with browser storage", () => {
  let reads = 0;
  globalThis.window = {
    localStorage: {
      getItem: () => {
        reads++;
        return "stale user";
      },
    },
  } as unknown as Window & typeof globalThis;
  const html = renderToStaticMarkup(
    <AccountProvider
      account={aiChatAccount}
      user={{
        name: "Alex",
        email: "alex@example.com",
        avatar: aiChatAccount.profile.avatar!,
        role: "Maker",
        slug: "alex-maker",
        description: "Pottery workshops",
      }}
    >
      <Widget variant="subject-me-profile-settings" />
    </AccountProvider>,
  );
  expect(html).toContain('value="alex-maker"');
  expect(html).toContain("Pottery workshops");
  expect(reads).toBe(0);
});
