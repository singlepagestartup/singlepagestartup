import { afterEach, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as Subject } from "../../../index";
import { AccountProvider, useStudioAccount } from "./Account";
import { aiChatAccount } from "./fixture";
const originalWindow = globalThis.window;
afterEach(() => {
  if (originalWindow) globalThis.window = originalWindow;
  else Reflect.deleteProperty(globalThis, "window");
});

test("the same account shows its name/avatar with optional AI Chat tokens", () => {
  function render(showTokens: boolean) {
    return renderToStaticMarkup(
      <AccountProvider account={aiChatAccount}>
        <Subject variant="me-account" showTokens={showTokens} />
      </AccountProvider>,
    );
  }
  for (const html of [render(false), render(true)]) {
    expect(html).toContain('data-ds-block="social.profile.account-menu"');
    expect(html).toContain('data-profile-id="current-user"');
    expect(html).toContain("Alex");
    expect(html).not.toContain("Upload avatar");
    expect(html).toContain("singlepagestartup-account-mascot-square.png");
  }
  expect(render(true)).toContain("1 250 токенов");
  expect(render(false)).not.toContain("tokens");
});

test("guest headers share one sign-in control with the appropriate destination", () => {
  const chat = renderToStaticMarkup(
    <Subject variant="me-account" signedIn={false} showTokens />,
  );
  const website = renderToStaticMarkup(
    <Subject variant="me-account" signedIn={false} />,
  );
  for (const html of [chat, website]) {
    expect(html).toContain('data-ds-block="rbac.subject.me-account"');
    expect(html).toContain("Войти");
    expect(html).not.toContain("Admin Panel");
  }
  expect(chat).toContain(
    'href="/ai-chat/rbac/subjects/authentication/select-method"',
  );
  expect(website).toContain(
    "rbac-module-subject-me-authentication-select-method",
  );
});

test("browser session data cannot override explicit story props", () => {
  let storageReads = 0;
  let storageWrites = 0;
  globalThis.window = {
    localStorage: {
      getItem: () => {
        storageReads++;
        return JSON.stringify({
          email: "other@example.com",
          name: "Other account",
        });
      },
      setItem: () => {
        storageWrites++;
      },
      removeItem: () => {
        storageWrites++;
      },
    },
  } as unknown as Window & typeof globalThis;
  const member = renderToStaticMarkup(
    <AccountProvider account={aiChatAccount} signedIn>
      <Subject variant="me-account" showTokens />
    </AccountProvider>,
  );
  const guest = renderToStaticMarkup(
    <AccountProvider account={aiChatAccount} signedIn={false}>
      <Subject variant="me-account" showTokens />
    </AccountProvider>,
  );
  expect(member).toContain("Alex");
  expect(member).not.toContain("Other account");
  expect(guest).toContain("Войти");
  expect(guest).not.toContain('data-ds-block="social.profile.account-menu"');
  expect(storageReads).toBe(0);
  expect(storageWrites).toBe(0);
});

test("account actions emit supplied callbacks without changing presentation data", () => {
  let view: ReturnType<typeof useStudioAccount> | undefined;
  const events: unknown[] = [];
  function Capture() {
    view = useStudioAccount();
    return null;
  }
  renderToStaticMarkup(
    <AccountProvider
      account={aiChatAccount}
      signedIn
      onSignIn={(email) => events.push(email)}
      onSignOut={() => events.push("sign-out")}
      onProfileChange={(updates) => events.push(updates)}
      onEmailChange={(email) => events.push(email)}
    >
      <Capture />
    </AccountProvider>,
  );
  view!.signIn("example@example.com");
  view!.signOut();
  view!.updateProfile({ name: "Edited name" });
  view!.updateEmail("edited@example.com");
  expect(events).toEqual([
    "example@example.com",
    "sign-out",
    { name: "Edited name" },
    "edited@example.com",
  ]);
  expect(view!.account).toBe(aiChatAccount);
  expect(view!.signedIn).toBe(true);
});
