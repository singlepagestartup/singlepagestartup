import { afterEach, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Component as RbacModuleSubject } from "../../index";
import { AccountProvider } from "./Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";
import {
  readRbacStudioAuthUser,
  writeRbacStudioAuthUser,
  clearRbacStudioAuthUser,
} from "../../../shared";

const originalWindow = globalThis.window;
afterEach(() => {
  if (originalWindow) globalThis.window = originalWindow;
  else Reflect.deleteProperty(globalThis, "window");
});

test("the same account shows its name/avatar with optional AI Chat tokens", () => {
  function render(showTokens: boolean) {
    return renderToStaticMarkup(
      <AccountProvider account={aiChatAccount}>
        <RbacModuleSubject variant="account" showTokens={showTokens} />
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
  expect(render(true)).toContain("1,250 tokens");
  expect(render(false)).not.toContain("tokens");
});

test("guest headers share one sign-in control with the appropriate destination", () => {
  const chat = renderToStaticMarkup(
    <RbacModuleSubject variant="account" signedIn={false} showTokens />,
  );
  const website = renderToStaticMarkup(
    <RbacModuleSubject variant="account" signedIn={false} />,
  );
  for (const html of [chat, website]) {
    expect(html).toContain('data-ds-block="rbac.subject.account"');
    expect(html).toContain("Sign in");
    expect(html).not.toContain("Admin Panel");
  }
  expect(chat).toContain('href="/ai-chat/login"');
  expect(website).toContain("rbac-subject-authentication-select-method");
});

test("avatar updates persist for the current user and survive signing in again", () => {
  const values = new Map<string, string>();
  let events = 0;
  globalThis.window = {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
    dispatchEvent: () => {
      events++;
      return true;
    },
  } as unknown as Window & typeof globalThis;
  writeRbacStudioAuthUser("sarah@sps.dev", {
    avatar: "data:image/png;base64,preview",
    name: "Sarah",
  });
  expect(readRbacStudioAuthUser()?.avatar).toBe(
    "data:image/png;base64,preview",
  );
  expect(writeRbacStudioAuthUser(" SARAH@SPS.DEV ").name).toBe("Sarah");
  expect(readRbacStudioAuthUser()?.avatar).toBe(
    "data:image/png;base64,preview",
  );
  expect(writeRbacStudioAuthUser("james@sps.dev").name).toBe("James Carter");
  expect(readRbacStudioAuthUser()?.avatar).not.toBe(
    "data:image/png;base64,preview",
  );
  clearRbacStudioAuthUser();
  expect(readRbacStudioAuthUser()).toBeNull();
  expect(events).toBe(4);
});
