import { Component } from "../../../../../../modules/social/models/chat/singlepage/ai-chat-workspace/index";
import { AccountProvider } from "../../../../../../modules/rbac/models/subject/singlepage/ai-chat-settings/Account";
import { aiChatAccount } from "../../../../../utils/products/ai-chat-account-fixture";
export default function ProjectWorkspace(
  props: { text?: string; navigationHref?: string } = {},
) {
  return (
    <AccountProvider account={aiChatAccount}>
      <Component
        {...props}
        navigationHref={props.navigationHref?.replace(
          /^\/projects/,
          "/ai-chat/projects",
        )}
      />
    </AccountProvider>
  );
}
