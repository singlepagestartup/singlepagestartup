import { Component as RbacModuleSubject } from "../../index";
import type { Meta, StoryObj } from "@storybook/react";
import { AccountProvider } from "../account/Account";
import { aiChatAccount } from "../../../../../workspace/utils/products/ai-chat-account-fixture";
import { FilesProvider } from "../../../../file-storage/file/singlepage/ai-chat-attachments/Files";
import { SourceProvider } from "../../../../knowledge/source/singlepage/ai-chat-document/Source";
import { ThreadProvider } from "../../../../social/thread/singlepage/ai-chat-overview/Thread";

function Example() {
  return (
    <FilesProvider>
      <SourceProvider profileId="pottery">
        <ThreadProvider>
          <RbacModuleSubject variant="ai-chat-message-create" />
        </ThreadProvider>
      </SourceProvider>
    </FilesProvider>
  );
}
const meta = {
  id: "modules-rbac-models-subject-singlepage-ai-chat-message-create",
  title: "Modules/RBAC/Models/Subject/Singlepage/ai-chat-message-create",
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
