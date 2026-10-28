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
    description: "Мастерская керамики",
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
  expect(unavailable).toContain("Профиль недоступен в этом примере.");
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
    expect(html).toContain("Выбрать изображение");
    expect(html).toContain("Изменить почту");
    expect(html).toContain("Изменить пароль");
    expect(html).toContain("Добавить способ входа");
    expect(html).toContain("Посмотрите покупки и чеки.");
    expect(html).toContain("Удалить аккаунт и данные проектов");
    expect(html).toContain("Если изменения не сохраняются");
    expect(html).not.toContain('name="current-password"');
    expect(html).not.toContain("Change avatar");
    expect(html.includes("Купить токены")).toBe(showTokens);
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
        description: "Мастерская керамики",
      }}
    >
      <Widget variant="subject-me-profile-settings" />
    </AccountProvider>,
  );
  expect(html).toContain('value="alex-maker"');
  expect(html).toContain("Мастерская керамики");
  expect(reads).toBe(0);
});
