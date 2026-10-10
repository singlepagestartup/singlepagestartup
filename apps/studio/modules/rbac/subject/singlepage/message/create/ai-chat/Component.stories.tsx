import { Component as RbacModuleSubject } from "../../../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../../../account/Account";
import { aiChatAccount } from "../../../../../../../workspace/utils/products/ai-chat-account-fixture";
import { FilesProvider } from "../../../../../../file-storage/file/singlepage/list/attachments/ai-chat/Files";
import { SourceProvider } from "../../../../../../knowledge/source/singlepage/overview/document/ai-chat/Source";
import { ThreadProvider } from "../../../../../../social/thread/singlepage/overview/ai-chat/Thread";

function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ThreadProvider>
          <RbacModuleSubject variant="message-create-ai-chat" />
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-message-create-ai-chat",
  title: "Modules/Rbac/Models/Subject/Singlepage/message/create/ai-chat",
  component: Example,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <AccountProvider account={aiChatAccount}>
        <Story />
      </AccountProvider>
    ),
  ],
} satisfies Meta<typeof Example>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
