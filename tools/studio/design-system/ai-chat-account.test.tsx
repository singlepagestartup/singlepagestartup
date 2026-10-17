import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AccountProvider } from "../../../apps/studio/modules/rbac/subject/singlepage/me/account/Account";
import { Component as SubjectAccount } from "../../../apps/studio/modules/rbac/subject/singlepage/me/account/index";
import { aiChatAccount } from "../../../apps/studio/modules/rbac/subject/singlepage/me/account/fixture";

test("account menu renders the supplied profile and balance, with a signed-out fallback", () => {
  const html = renderToStaticMarkup(
    <AccountProvider account={aiChatAccount}>
      <SubjectAccount page="chat" showTokens />
    </AccountProvider>,
  );
  expect(html).toContain('data-profile-id="current-user"');
  expect(html).toContain("1,250 tokens");
  const empty = renderToStaticMarkup(
    <AccountProvider account={{ ...aiChatAccount, profile: undefined }}>
      <SubjectAccount page="chat" showTokens />
    </AccountProvider>,
  );
  expect(empty).toContain("Sign in");
  expect(empty).not.toContain('data-profile-id="current-user"');
});
