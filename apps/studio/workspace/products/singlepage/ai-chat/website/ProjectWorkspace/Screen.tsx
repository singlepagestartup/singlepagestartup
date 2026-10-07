import { Component } from "@sps/social/models/chat/frontend/component/src/lib/singlepage/ai-chat-workspace";
import { AccountProvider } from "./../../../../../../../../libs/shared/frontend/components/src/lib/singlepage/ai-chat/Account";
import { aiChatAccount } from "../../../../../../../../tools/studio/products/fixtures/ai-chat-account";
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
